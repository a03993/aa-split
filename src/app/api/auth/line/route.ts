import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/types/database.types"

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

interface RequestBody {
  idToken: string
}

// Rate limit 交給 Vercel Firewall 的 "Rate limit LINE auth" 規則處理，這裡不用自己算

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: RequestBody

  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { idToken } = body
  // 擋掉空值或異常長的字串，避免浪費一次 LINE API 呼叫
  if (
    !idToken ||
    typeof idToken !== "string" ||
    idToken.trim().length === 0 ||
    idToken.length > 4096
  ) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 })
  }

  // LIFF ID 格式是 `{channel_id}-{隨機字串}`，channel_id 就是這個 ID token 該有的 aud
  const expectedChannelId = process.env.NEXT_PUBLIC_LIFF_ID?.split("-")[0]

  if (!expectedChannelId) {
    console.error("[LINE auth] 缺少 NEXT_PUBLIC_LIFF_ID，無法驗證 ID token")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  let lineProfile: LineProfile
  try {
    // 交給 LINE 官方 verify endpoint 一次驗完簽章、效期、aud，claims 也帶 name/picture，不用再打 /v2/profile
    const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: idToken, client_id: expectedChannelId }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid or expired LINE ID token" }, { status: 401 })
    }

    const idTokenClaims = (await res.json()) as {
      sub: string
      aud: string
      name?: string
      picture?: string
    }

    // LINE 已經驗過 aud，這裡是多一層防禦
    if (idTokenClaims.aud !== expectedChannelId) {
      return NextResponse.json({ error: "ID token was not issued for this app" }, { status: 401 })
    }

    lineProfile = {
      userId: idTokenClaims.sub,
      displayName: idTokenClaims.name ?? "LINE User",
      pictureUrl: idTokenClaims.picture,
    }
  } catch {
    return NextResponse.json({ error: "Failed to verify LINE ID token" }, { status: 502 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error("[LINE auth] 缺少必要的 Supabase 環境變數")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  // service role 可繞過 RLS，才能建用戶、寫 profile
  const adminSupabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // anon key，只用來在 server 端完成 OTP 驗證
  const anonSupabase = createClient<Database>(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // LINE 不提供 email，用 userId 合成一個；.invalid 是保留域名，保證解析不到
  const syntheticEmail = `${lineProfile.userId}@line.invalid`

  let supabaseAuthUserId: string

  const { data: existingProfile, error: lookupError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("line_user_id", lineProfile.userId)
    .maybeSingle()

  if (lookupError) {
    console.error(lookupError)
    return NextResponse.json({ error: "Database lookup failed" }, { status: 500 })
  }

  if (existingProfile) {
    supabaseAuthUserId = existingProfile.id
  } else {
    // 合成 email 收不到信，email_confirm: true 跳過驗證信流程
    const { data: newAuthUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: {
        line_user_id: lineProfile.userId,
        display_name: lineProfile.displayName,
        avatar_url: lineProfile.pictureUrl ?? "",
      },
    })

    if (createError || !newAuthUser.user) {
      console.error(createError)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    supabaseAuthUserId = newAuthUser.user.id
  }

  // upsert 同時處理新建跟更新（例如換頭像）
  const { error: upsertError } = await adminSupabase.from("profiles").upsert(
    {
      id: supabaseAuthUserId,
      line_user_id: lineProfile.userId,
      display_name: lineProfile.displayName,
      avatar_url: lineProfile.pictureUrl ?? "",
    },
    { onConflict: "id" },
  )

  if (upsertError) {
    console.error(upsertError)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }

  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: "magiclink",
    email: syntheticEmail,
  })

  if (linkError || !linkData) {
    console.error(linkError)
    return NextResponse.json({ error: "Failed to generate Supabase session" }, { status: 500 })
  }

  // OTP 只在 server 端用掉，不會傳到瀏覽器
  const { data: otpData, error: otpError } = await anonSupabase.auth.verifyOtp({
    email: syntheticEmail,
    token: linkData.properties.email_otp,
    type: "magiclink",
  })

  if (otpError || !otpData.session) {
    console.error(otpError)
    return NextResponse.json({ error: "Failed to verify Supabase session" }, { status: 500 })
  }

  return NextResponse.json({
    accessToken: otpData.session.access_token,
    refreshToken: otpData.session.refresh_token,
    user: {
      id: supabaseAuthUserId,
      displayName: lineProfile.displayName,
      avatarUrl: lineProfile.pictureUrl ?? "",
      lineUserId: lineProfile.userId,
    },
  })
}

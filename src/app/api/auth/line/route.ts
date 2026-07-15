import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/types/database.types"

// 注意：多實例部署時此限制僅對單一實例有效，如需全域限制請改用 Upstash Rate Limit。
// 注意：此 Map 不會主動清理過期 entry，長時間運行下大量不同 IP 造訪可能導致記憶體緩慢增長，視流量規模決定是否需要加入 LRU 或定期清理。
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

interface RequestBody {
  accessToken: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { accessToken } = body
  // 驗證 accessToken：必須是非空字串且長度合理（LINE access token 不超過 2048 字元）
  if (
    !accessToken ||
    typeof accessToken !== "string" ||
    accessToken.trim().length === 0 ||
    accessToken.length > 2048
  ) {
    return NextResponse.json({ error: "accessToken is required" }, { status: 400 })
  }

  let lineProfile: LineProfile
  try {
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Invalid or expired LINE access token" }, { status: 401 })
    }

    lineProfile = (await profileRes.json()) as LineProfile
  } catch {
    return NextResponse.json({ error: "Failed to fetch LINE profile" }, { status: 502 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error("[LINE auth] 缺少必要的 Supabase 環境變數")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  // 使用 service role key 建立管理員 client，可繞過 RLS 以建立用戶與更新 profile。
  const adminSupabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 使用一般 anon key client 在伺服器端完成 OTP 驗證，換取真實 session。
  const regularSupabase = createClient<Database>(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 以 LINE userId 合成虛擬 email（Supabase 建立用戶需要 email，但 LINE 不提供）。
  // .invalid 是 RFC 2606 保留的頂層域名，保證永遠無法解析，比 .local（mDNS）更安全。
  const syntheticEmail = `${lineProfile.userId}@line.invalid`

  let supabaseAuthUserId: string

  const { data: existingProfile, error: lookupError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("line_user_id", lineProfile.userId)
    .maybeSingle()

  if (lookupError) {
    console.error("[LINE auth] profiles 查詢錯誤:", lookupError)
    return NextResponse.json({ error: "Database lookup failed" }, { status: 500 })
  }

  if (existingProfile) {
    supabaseAuthUserId = existingProfile.id
  } else {
    // 新用戶：建立 Supabase auth 用戶，並預先設定 user_metadata。
    // email_confirm: true 略過 email 驗證流程（此為合成 email，無法真正收信）。
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
      console.error("[LINE auth] 建立用戶失敗:", createError)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    supabaseAuthUserId = newAuthUser.user.id
  }

  // Upsert profiles 資料列：同時處理「首次建立」與「後續更新（如更換頭像）」。
  // onConflict: 'id' 確保同一 auth user 不會產生重複的 profile 資料列。
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
    console.error("[LINE auth] profiles upsert 錯誤:", upsertError)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }

  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: "magiclink",
    email: syntheticEmail,
  })

  if (linkError || !linkData) {
    console.error("[LINE auth] generateLink 錯誤:", linkError)
    return NextResponse.json({ error: "Failed to generate Supabase session" }, { status: 500 })
  }

  // 在伺服器端用 OTP 換取真實 session，OTP 不會傳送至瀏覽器。
  // 使用一般 anon client 呼叫 verifyOtp，取得包含 access_token 與 refresh_token 的 session。
  const { data: verifyData, error: verifyError } = await regularSupabase.auth.verifyOtp({
    email: syntheticEmail,
    token: linkData.properties.email_otp,
    type: "magiclink",
  })

  if (verifyError || !verifyData.session) {
    console.error("[LINE auth] verifyOtp 錯誤:", verifyError)
    return NextResponse.json({ error: "Failed to verify Supabase session" }, { status: 500 })
  }

  return NextResponse.json({
    accessToken: verifyData.session.access_token,
    refreshToken: verifyData.session.refresh_token,
    user: {
      id: supabaseAuthUserId,
      displayName: lineProfile.displayName,
      avatarUrl: lineProfile.pictureUrl ?? "",
      lineUserId: lineProfile.userId,
    },
  })
}

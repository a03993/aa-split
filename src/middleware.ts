import { type NextRequest, NextResponse } from "next/server"

import { type CookieOptions, createServerClient } from "@supabase/ssr"

import type { Database } from "@/types/database.types"

export async function middleware(request: NextRequest) {
  // 本地開發環境：略過所有 Supabase 驗證，不需要設定環境變數。
  // 安全防護：無論 NEXT_PUBLIC_ENV 的值為何，此繞過在 NODE_ENV=production 時一律停用，
  // 防止環境變數設定錯誤導致認證機制在正式環境被繞過。
  if (process.env.NEXT_PUBLIC_ENV === "local" && process.env.NODE_ENV !== "production") {
    return NextResponse.next({ request })
  }

  // 受保護路徑清單：未登入用戶將被導向首頁。
  // 如需新增其他受保護路徑（例如 /profile、/settings），請在此同步更新。
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/group/")

  // 只有受保護路徑才需要驗證：getUser() 會實際打一次 Supabase Auth 伺服器驗證 JWT，
  // 非受保護路徑（如首頁、landing）沒有登入門檻，不需要這次網路往返。
  if (!isProtectedRoute) {
    return NextResponse.next({ request })
  }

  // 進入此分支時，NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  // 必然已設定（非 local 環境要求這兩個環境變數），故使用非空斷言 (!) 是安全的。
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // 刷新 auth session，確保 Server Components 能取得最新的用戶狀態。
  // 此處必須使用 getUser()（向 Supabase Auth 伺服器驗證），不可改用 getSession()（僅信任本地 cookie）。
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/"
    redirectUrl.searchParams.set("redirected", "true")
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

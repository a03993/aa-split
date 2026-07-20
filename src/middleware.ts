import { type NextRequest, NextResponse } from "next/server"

import { type CookieOptions, createServerClient } from "@supabase/ssr"

import type { Database } from "@/types/database.types"

export async function middleware(request: NextRequest) {
  // 本地開發環境略過驗證；NODE_ENV=production 時強制停用，防止環境變數誤設繞過正式環境。
  if (process.env.NEXT_PUBLIC_ENV === "local" && process.env.NODE_ENV !== "production") {
    return NextResponse.next({ request })
  }

  // 受保護路徑清單：未登入用戶將被導向登入頁（並帶上 next 參數記住原本要去的頁面）。
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/group/")

  // 只驗證受保護路徑：getClaims() 至少會抓一次 JWKS，非受保護路徑不需此開銷。
  if (!isProtectedRoute) {
    return NextResponse.next({ request })
  }

  // 此處必然已設定這兩個環境變數（非 local 環境要求），所以用 (!) 是安全的。
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
  // 用 getClaims() 而非 getSession()：本專案 JWT 用非對稱簽章（ES256），
  // getClaims() 可透過 WebCrypto 本地驗證簽章，不必每次都打 Supabase Auth 伺服器（即 getUser() 的行為）。
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data) {
    const nextPath = request.nextUrl.pathname + request.nextUrl.search
    const redirectUrl = request.nextUrl.clone()

    redirectUrl.pathname = "/login"
    redirectUrl.search = ""
    redirectUrl.searchParams.set("next", nextPath)

    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

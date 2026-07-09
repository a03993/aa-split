import type { LiffService } from "@/infrastructure/liff/liff.provider"
import { exchangeLineToken } from "@/infrastructure/line/line-auth.client"
import type { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

export type AuthUser = {
  id: string
  displayName: string
  avatarUrl: string
  lineUserId: string | null
}

export type AuthResult =
  | { status: "authenticated"; user: AuthUser }
  | { status: "redirecting" }
  | { status: "out-of-client" }

type ProfileData = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "display_name" | "avatar_url" | "line_user_id"
>

export class AuthService {
  constructor(
    private liffService: LiffService,
    private supabaseClient: ReturnType<typeof createClient>,
  ) {}

  /**
   * LINE 登入 → Supabase session 初始化流程。
   *
   * 三種結果：
   * - authenticated：已登入（含快路徑：本地已有未過期的 Supabase session，
   *   例如 LIFF webview 重開但登入未過期，跳過整套 LINE 登入 + token 交換，
   *   只補一次 profiles 查詢取得最新顯示資料）。
   * - redirecting：在 LINE App 內但尚未登入，liff.login() 會把整頁導去 LINE 授權頁，
   *   此結果之後的程式碼不會被執行，回傳值幾乎不會被用到。
   * - out-of-client：不在 LINE App 內，無法自動登入，需引導使用者改用 LINE 開啟。
   */
  async initialize(liffId: string): Promise<AuthResult> {
    await this.liffService.initialize(liffId)

    const {
      data: { session: existingSession },
    } = await this.supabaseClient.auth.getSession()

    if (existingSession && this.liffService.isLoggedIn()) {
      const user = await this.loadProfile(existingSession.user.id)
      return { status: "authenticated", user }
    }

    if (!this.liffService.isLoggedIn()) {
      if (!this.liffService.isInClient()) {
        return { status: "out-of-client" }
      }
      this.liffService.login()
      return { status: "redirecting" }
    }

    const accessToken = this.liffService.getAccessToken()
    if (!accessToken) {
      throw new Error("LIFF access token is unavailable after login.")
    }

    const {
      accessToken: sbAccessToken,
      refreshToken,
      user,
    } = await exchangeLineToken({ accessToken })

    const { error } = await this.supabaseClient.auth.setSession({
      access_token: sbAccessToken,
      refresh_token: refreshToken,
    })

    if (error) {
      throw new Error(`Failed to set Supabase session: ${error.message}`)
    }

    return {
      status: "authenticated",
      user: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? "",
        lineUserId: user.lineUserId,
      },
    }
  }

  private async loadProfile(userId: string): Promise<AuthUser> {
    // maybeSingle() 在找不到資料列時回傳 null data（而非 PGRST116 錯誤）。
    const { data, error } = await this.supabaseClient
      .from("profiles")
      .select("display_name, avatar_url, line_user_id")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      console.error("[AuthService] profile 查詢錯誤:", error)
    }

    const profile = data as ProfileData | null

    return {
      id: userId,
      // 不使用 supabaseUser.email 作為 fallback，因為那是合成的虛擬 email
      // （{lineId}@line.invalid），不應直接顯示給用戶。
      displayName: profile?.display_name ?? "User",
      avatarUrl: profile?.avatar_url ?? "",
      lineUserId: profile?.line_user_id ?? null,
    }
  }
}

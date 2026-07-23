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

export function createAuthService(
  liffService: LiffService,
  supabaseClient: ReturnType<typeof createClient>,
) {
  async function loadProfile(userId: string): Promise<AuthUser> {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("display_name, avatar_url, line_user_id")
      .eq("id", userId)
      // 找不到資料列時回傳 null，不會 error
      .maybeSingle()

    if (error) {
      console.error(error)
    }

    const profile = data as ProfileData | null

    return {
      id: userId,
      displayName: profile?.display_name ?? "User",
      avatarUrl: profile?.avatar_url ?? "",
      lineUserId: profile?.line_user_id ?? null,
    }
  }

  async function initialize(liffId: string): Promise<AuthResult> {
    await liffService.initialize(liffId)

    const {
      data: { session: existingSession },
    } = await supabaseClient.auth.getSession()

    // 已經登入了
    if (existingSession) {
      const user = await loadProfile(existingSession.user.id)
      return { status: "authenticated", user }
    }

    if (!liffService.isLoggedIn()) {
      if (!liffService.isInClient()) {
        return { status: "out-of-client" }
      }

      // 導去 LINE 授權
      liffService.login()
      return { status: "redirecting" }
    }

    // 剛授權完要換 session
    const idToken = liffService.getIDToken()
    if (!idToken) {
      throw new Error("LIFF ID token is unavailable after login.")
    }

    const { accessToken, refreshToken, user } = await exchangeLineToken({ idToken })

    const { error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
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

  return { initialize }
}

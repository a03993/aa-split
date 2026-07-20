// LIFF Mock 實作 — 僅供本地開發使用
// 當 NEXT_PUBLIC_ENV=local 時啟用，讓開發者無需真實 LINE 登入即可測試。
// 永遠回傳固定的 profile，認證相關方法皆為空操作。
import type { LiffProfile, LiffService } from "./liff.provider"

const MOCK_PROFILE: LiffProfile = {
  userId: "mock-line-user-id",
  displayName: "Mock User",
  pictureUrl: undefined,
}

export class MockLiffService implements LiffService {
  async initialize(liffId: string): Promise<void> {
    console.log(`[MockLiff] initialize called with liffId="${liffId}" — skipped`)
  }

  isLoggedIn(): boolean {
    return true
  }

  login(options?: { redirectUri?: string }): void {
    console.log("[MockLiff] login called — no-op in mock mode", options)
  }

  logout(): void {
    console.log("[MockLiff] logout called — no-op in mock mode")
  }

  async getProfile(): Promise<LiffProfile> {
    console.log("[MockLiff] getProfile — returning mock profile", MOCK_PROFILE)
    return Promise.resolve({ ...MOCK_PROFILE })
  }

  getAccessToken(): string | null {
    return "mock-liff-access-token"
  }

  isInClient(): boolean {
    return false
  }

  async shareMessage(messages: unknown[]): Promise<void> {
    console.log("[MockLiff] shareMessage called with messages:", messages)
  }
}

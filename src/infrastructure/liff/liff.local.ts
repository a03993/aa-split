// 本地開發用的假 LIFF 實作，NEXT_PUBLIC_ENV=local 時啟用，不用真的登入
import type { LiffService } from "./liff.provider"

export class LocalLiffService implements LiffService {
  async initialize(liffId: string): Promise<void> {
    console.log(`[LocalLiff] initialize called with liffId="${liffId}" — skipped`)
  }

  isLoggedIn(): boolean {
    return true
  }

  login(options?: { redirectUri?: string }): void {
    console.log("[LocalLiff] login called — no-op in local mode", options)
  }

  logout(): void {
    console.log("[LocalLiff] logout called — no-op in local mode")
  }

  getIDToken(): string | null {
    return "local-liff-id-token"
  }

  isInClient(): boolean {
    return false
  }

  async shareMessage(messages: unknown[]): Promise<void> {
    console.log("[LocalLiff] shareMessage called with messages:", messages)
  }
}

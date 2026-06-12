"use client"

// 正式 LIFF 實作，使用 @line/liff SDK。
// 僅限客戶端：LIFF SDK 不支援 server/edge 環境。透過動態 import 將其排除在 server bundle 之外。
import type { LiffProfile, LiffService } from "./liff.provider"

let liffInstance: typeof import("@line/liff").default | null = null

async function getLiff(): Promise<typeof import("@line/liff").default> {
  if (liffInstance) return liffInstance
  const mod = await import("@line/liff")
  liffInstance = mod.default
  return liffInstance
}

export class RealLiffService implements LiffService {
  private initialized = false

  async initialize(liffId: string): Promise<void> {
    if (this.initialized) {
      return
    }

    const liff = await getLiff()
    await liff.init({ liffId })
    this.initialized = true
  }

  isLoggedIn(): boolean {
    if (!this.initialized || !liffInstance) return false
    return liffInstance.isLoggedIn()
  }

  login(): void {
    if (!liffInstance) {
      console.warn("[RealLiff] login() called before initialize()")
      return
    }
    liffInstance.login()
  }

  logout(): void {
    if (!liffInstance) {
      console.warn("[RealLiff] logout() called before initialize()")
      return
    }
    liffInstance.logout()
  }

  async getProfile(): Promise<LiffProfile> {
    if (!this.initialized) {
      throw new Error("LIFF is not initialized. Call initialize() first.")
    }

    const liff = await getLiff()

    if (!liff.isLoggedIn()) {
      throw new Error("User is not logged in via LINE.")
    }

    const profile = await liff.getProfile()

    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl ?? undefined,
    }
  }

  getAccessToken(): string | null {
    if (!this.initialized || !liffInstance) return null
    return liffInstance.getAccessToken()
  }

  isInClient(): boolean {
    if (!this.initialized || !liffInstance) return false
    return liffInstance.isInClient()
  }

  async shareMessage(messages: unknown[]): Promise<void> {
    if (!this.initialized) {
      throw new Error("LIFF is not initialized. Call initialize() first.")
    }

    const liff = await getLiff()

    if (!liff.isInClient()) {
      throw new Error("shareMessage is only available inside the LINE client.")
    }

    await liff.shareTargetPicker(messages as Parameters<typeof liff.shareTargetPicker>[0])
  }
}

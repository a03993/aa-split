"use client"

// 正式 LIFF 實作，包 @line/liff SDK
// 只能在瀏覽器跑，用動態 import 避免被打包進 server 端
import type { LiffService } from "./liff.provider"

let liffInstance: typeof import("@line/liff").default | null = null

async function getLiff(): Promise<typeof import("@line/liff").default> {
  if (liffInstance) {
    return liffInstance
  }

  const mod = await import("@line/liff")

  liffInstance = mod.default

  return liffInstance
}

export class LiveLiffService implements LiffService {
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
    if (!this.initialized || !liffInstance) {
      return false
    }

    return liffInstance.isLoggedIn()
  }

  login(options?: { redirectUri?: string }): void {
    if (!liffInstance) {
      console.warn("[LiveLiff] login() called before initialize()")
      return
    }

    liffInstance.login(options)
  }

  logout(): void {
    if (!liffInstance) {
      console.warn("[LiveLiff] logout() called before initialize()")
      return
    }

    liffInstance.logout()
  }

  getIDToken(): string | null {
    if (!this.initialized || !liffInstance) {
      return null
    }

    return liffInstance.getIDToken()
  }

  isInClient(): boolean {
    if (!this.initialized || !liffInstance) {
      return false
    }

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

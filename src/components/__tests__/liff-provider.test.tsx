import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/auth.store"
import { MOCK_USER_ID, MOCK_USER_NAME } from "@/infrastructure/mock"

import { LiffProvider } from "../liff-provider"

// LiffProvider 在非本地環境會呼叫 LIFF SDK 與 Supabase。此測試檔僅涵蓋本地路徑，不依賴任何外部服務。

describe("LiffProvider — local 環境", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENV", "local")
    useAuthStore.setState({ user: null, status: "loading" })
  })

  it("bootstrap 後 status 應為 authenticated", async () => {
    render(
      <LiffProvider liffId="">
        <div />
      </LiffProvider>,
    )
    await vi.waitFor(() => {
      expect(useAuthStore.getState().status).toBe("authenticated")
    })
  })

  it("bootstrap 後 user 不為 null", async () => {
    render(
      <LiffProvider liffId="">
        <div />
      </LiffProvider>,
    )
    await vi.waitFor(() => {
      expect(useAuthStore.getState().user).not.toBeNull()
    })
  })

  it("bootstrap 後 user.id 為 MOCK_USER_ID", async () => {
    render(
      <LiffProvider liffId="">
        <div />
      </LiffProvider>,
    )
    await vi.waitFor(() => {
      expect(useAuthStore.getState().user?.id).toBe(MOCK_USER_ID)
    })
  })

  it("bootstrap 後 user.displayName 為 MOCK_USER_NAME", async () => {
    render(
      <LiffProvider liffId="">
        <div />
      </LiffProvider>,
    )
    await vi.waitFor(() => {
      expect(useAuthStore.getState().user?.displayName).toBe(MOCK_USER_NAME)
    })
  })
})

describe("LiffProvider — LIFF_ID 未設定（非 local 環境）", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENV", "production")
    useAuthStore.setState({ user: null, status: "loading" })
  })

  it("liffId 為空字串時，status 應為 out-of-client（不永久卡住）", async () => {
    render(
      <LiffProvider liffId="">
        <div />
      </LiffProvider>,
    )
    await vi.waitFor(() => {
      expect(useAuthStore.getState().status).toBe("out-of-client")
    })
  })
})

describe("LiffProvider — LIFF_ID 未設定 且 UA 像 LINE App", () => {
  const originalUserAgent = navigator.userAgent

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENV", "production")
    useAuthStore.setState({ user: null, status: "loading" })
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 Line/13.15.0",
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    })
  })

  it("liffId 為空字串時，status 應為 error（不是 out-of-client）", async () => {
    render(
      <LiffProvider liffId="">
        <div />
      </LiffProvider>,
    )
    await vi.waitFor(() => {
      expect(useAuthStore.getState().status).toBe("error")
    })
  })
})

describe("LiffProvider — production 環境未覆蓋路徑", () => {
  // 無法測試：createAuthService 在 bootstrap() 內部呼叫，無法從外部注入。
  // 若要覆蓋此路徑，需將 LiffProvider 重構為接受 authServiceFactory 參數。
  it.todo("getCurrentUser 回傳 null 時，isLoading 應為 false（不永久卡住）")
})

import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/auth.store"
import { MOCK_USER_ID, MOCK_USER_NAME } from "@/infrastructure/mock"

import { LiffProvider } from "../liff-provider"

// LiffProvider 在非本地環境會呼叫 LIFF SDK 與 Supabase。此測試檔僅涵蓋本地路徑，不依賴任何外部服務。

describe("LiffProvider — local 環境", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENV", "local")
    useAuthStore.setState({ user: null, isLoading: true })
  })

  it("bootstrap 後 isLoading 應為 false", async () => {
    render(
      <LiffProvider liffId="">
        <div />
      </LiffProvider>,
    )
    await vi.waitFor(() => {
      expect(useAuthStore.getState().isLoading).toBe(false)
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

  it("bootstrap 後 user 不為 null（isAuthenticated 衍生為 true）", async () => {
    render(
      <LiffProvider liffId="">
        <div />
      </LiffProvider>,
    )
    await vi.waitFor(() => {
      expect(useAuthStore.getState().user).not.toBeNull()
    })
  })
})

describe("LiffProvider — production 環境未覆蓋路徑", () => {
  // 無法測試：AuthService 在 bootstrap() 內部實例化，無法從外部注入。
  // 若要覆蓋此路徑，需將 LiffProvider 重構為接受 authServiceFactory 參數。
  it.todo("getCurrentUser 回傳 null 時，isLoading 應為 false（不永久卡住）")
})

describe("LiffProvider — LIFF_ID 未設定（非 local 環境）", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENV", "production")
    useAuthStore.setState({ user: null, isLoading: true })
  })

  it("liffId 為空字串時，isLoading 應為 false（不永久卡住）", async () => {
    render(
      <LiffProvider liffId="">
        <div />
      </LiffProvider>,
    )
    await vi.waitFor(() => {
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})

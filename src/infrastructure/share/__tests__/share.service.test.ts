import { afterEach, describe, expect, it, vi } from "vitest"

import type { LiffService } from "@/infrastructure/liff/liff.provider"

import { WebShareService } from "../share.service"

function createLiffServiceMock(overrides: Partial<LiffService> = {}): LiffService {
  return {
    initialize: vi.fn(),
    isLoggedIn: vi.fn(() => true),
    login: vi.fn(),
    logout: vi.fn(),
    getIDToken: vi.fn(() => null),
    isInClient: vi.fn(() => false),
    isApiAvailable: vi.fn(() => false),
    shareMessage: vi.fn(async () => true),
    ...overrides,
  }
}

describe("WebShareService", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe("getBookUrl", () => {
    it("NEXT_PUBLIC_APP_URL 存在時優先使用", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com")
      vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "preview.vercel.app")

      const service = new WebShareService(createLiffServiceMock())

      expect(service.getBookUrl("book-1")).toBe("https://app.example.com/group/book-1")
    })

    it("NEXT_PUBLIC_APP_URL 不存在時退回 NEXT_PUBLIC_VERCEL_URL", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "")
      vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "preview.vercel.app")

      const service = new WebShareService(createLiffServiceMock())

      expect(service.getBookUrl("book-1")).toBe("https://preview.vercel.app/group/book-1")
    })

    it("兩個環境變數都不存在時回傳相對路徑", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "")
      vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "")

      const service = new WebShareService(createLiffServiceMock())

      expect(service.getBookUrl("book-1")).toBe("/group/book-1")
    })
  })

  describe("shareToLine", () => {
    it("在 LINE 客戶端且 shareTargetPicker 可用時，透過 shareMessage 送出 Flex Message", async () => {
      const shareMessage = vi.fn(async (_messages: unknown[]) => true)
      const liffService = createLiffServiceMock({
        isInClient: vi.fn(() => true),
        isApiAvailable: vi.fn(() => true),
        shareMessage,
      })
      const service = new WebShareService(liffService)

      const result = await service.shareToLine("book-1", "日本旅遊")

      expect(result).toBe(true)
      expect(shareMessage).toHaveBeenCalledTimes(1)

      const [messages] = shareMessage.mock.calls[0]
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        type: "flex",
        altText: "邀你一起來 AA：日本旅遊",
      })
    })

    it("shareMessage 回傳 false（使用者取消）時，shareToLine 也回傳 false", async () => {
      const liffService = createLiffServiceMock({
        isInClient: vi.fn(() => true),
        isApiAvailable: vi.fn(() => true),
        shareMessage: vi.fn(async () => false),
      })
      const service = new WebShareService(liffService)

      const result = await service.shareToLine("book-1", "日本旅遊")

      expect(result).toBe(false)
    })

    it("不在 LINE 客戶端時，改用瀏覽器開啟 LINE 分享頁", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com")
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null)
      const shareMessage = vi.fn(async (_messages: unknown[]) => true)
      const liffService = createLiffServiceMock({
        isInClient: vi.fn(() => false),
        shareMessage,
      })
      const service = new WebShareService(liffService)

      const result = await service.shareToLine("book-1", "日本旅遊")

      expect(result).toBe(true)
      expect(shareMessage).not.toHaveBeenCalled()
      expect(openSpy).toHaveBeenCalledTimes(1)

      const [url] = openSpy.mock.calls[0]
      expect(url).toContain("https://social-plugins.line.me/lineit/share")
      expect(url).toContain(encodeURIComponent("https://app.example.com/group/book-1"))
    })

    it("在 LINE 客戶端但 shareTargetPicker 不可用時，仍 fallback 到瀏覽器分享頁", async () => {
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null)
      const shareMessage = vi.fn(async (_messages: unknown[]) => true)
      const liffService = createLiffServiceMock({
        isInClient: vi.fn(() => true),
        isApiAvailable: vi.fn(() => false),
        shareMessage,
      })
      const service = new WebShareService(liffService)

      const result = await service.shareToLine("book-1", "日本旅遊")

      expect(result).toBe(true)
      expect(shareMessage).not.toHaveBeenCalled()
      expect(openSpy).toHaveBeenCalledTimes(1)
    })
  })
})

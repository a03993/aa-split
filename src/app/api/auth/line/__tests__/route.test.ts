import { NextRequest } from "next/server"

import { afterEach, describe, expect, it, vi } from "vitest"

import { POST } from "../route"

function makeRequest(body: unknown, ip: string): NextRequest {
  return new NextRequest("http://localhost/api/auth/line", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

describe("POST /api/auth/line", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe("rate limit", () => {
    it("同一 IP 於視窗內第 11 次請求回傳 429", async () => {
      const ip = "rate-limit-test-ip"

      for (let i = 0; i < 10; i++) {
        const res = await POST(makeRequest({}, ip))
        expect(res.status).not.toBe(429)
      }

      const res = await POST(makeRequest({}, ip))
      expect(res.status).toBe(429)
      const json = await res.json()
      expect(json.error).toBe("Too many requests")
    })
  })

  describe("請求內容驗證", () => {
    it("body 不是合法 JSON 時回傳 400", async () => {
      const res = await POST(makeRequest("not-json", "ip-invalid-json"))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("Invalid request body")
    })

    it("缺少 accessToken 時回傳 400", async () => {
      const res = await POST(makeRequest({}, "ip-missing-token"))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("accessToken is required")
    })

    it("accessToken 為空字串時回傳 400", async () => {
      const res = await POST(makeRequest({ accessToken: "   " }, "ip-blank-token"))
      expect(res.status).toBe(400)
    })

    it("accessToken 超過 2048 字元時回傳 400", async () => {
      const res = await POST(makeRequest({ accessToken: "a".repeat(2049) }, "ip-long-token"))
      expect(res.status).toBe(400)
    })
  })

  describe("LINE Profile API 驗證", () => {
    it("LINE API 回傳非 2xx 時回傳 401", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false } as Response))

      const res = await POST(makeRequest({ accessToken: "valid-token" }, "ip-401"))
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe("Invalid or expired LINE access token")
    })

    it("LINE API 連線失敗時回傳 502", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")))

      const res = await POST(makeRequest({ accessToken: "valid-token" }, "ip-502"))
      expect(res.status).toBe(502)
      const json = await res.json()
      expect(json.error).toBe("Failed to fetch LINE profile")
    })
  })

  describe("伺服器設定", () => {
    it("缺少 Supabase 環境變數時回傳 500", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ userId: "line-user-1", displayName: "Alice" }),
        } as Response),
      )
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")

      const res = await POST(makeRequest({ accessToken: "valid-token" }, "ip-500-config"))
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe("Server configuration error")
    })
  })
})

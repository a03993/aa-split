import { NextRequest } from "next/server"

import { createClient } from "@supabase/supabase-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "../route"

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}))

const SUPABASE_URL = "https://example.supabase.co"
const SERVICE_ROLE_KEY = "service-role-key"
const ANON_KEY = "anon-key"

function buildAdminClient(existingProfileId: string | null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: existingProfileId ? { id: existingProfileId } : null,
            error: null,
          }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      admin: {
        createUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "new-user-id" } }, error: null }),
        generateLink: vi.fn().mockResolvedValue({
          data: { properties: { email_otp: "123456" } },
          error: null,
        }),
      },
    },
  }
}

function buildAnonClient() {
  return {
    auth: {
      verifyOtp: vi.fn().mockResolvedValue({
        data: { session: { access_token: "sb-access-token", refresh_token: "sb-refresh-token" } },
        error: null,
      }),
    },
  }
}

function stubSupabaseClients(existingProfileId: string | null) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL)
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY)
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ANON_KEY)

  const adminClient = buildAdminClient(existingProfileId)
  const anonClient = buildAnonClient()

  vi.mocked(createClient).mockImplementation(
    (_url, key) =>
      (key === ANON_KEY ? anonClient : adminClient) as unknown as ReturnType<typeof createClient>,
  )

  return { adminClient, anonClient }
}

function makeRequest(body: unknown, ip: string): NextRequest {
  return new NextRequest("http://localhost/api/auth/line", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

const CHANNEL_ID = "2010566610"

function stubVerifyFetch(response: Response | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response))),
  )
}

function stubValidIdToken(claims: { sub: string; aud?: string; name?: string; picture?: string }) {
  stubVerifyFetch({
    ok: true,
    json: async () => ({ aud: CHANNEL_ID, ...claims }),
  } as Response)
}

describe("POST /api/auth/line", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_ID", `${CHANNEL_ID}-a6nD2AoU`)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe("請求內容驗證", () => {
    it("body 不是合法 JSON 時回傳 400", async () => {
      const res = await POST(makeRequest("not-json", "ip-invalid-json"))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("Invalid request body")
    })

    it("缺少 idToken 時回傳 400", async () => {
      const res = await POST(makeRequest({}, "ip-missing-token"))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("idToken is required")
    })

    it("idToken 為空字串時回傳 400", async () => {
      const res = await POST(makeRequest({ idToken: "   " }, "ip-blank-token"))
      expect(res.status).toBe(400)
    })

    it("idToken 超過 4096 字元時回傳 400", async () => {
      const res = await POST(makeRequest({ idToken: "a".repeat(4097) }, "ip-long-token"))
      expect(res.status).toBe(400)
    })
  })

  describe("ID token 驗證", () => {
    it("缺少 NEXT_PUBLIC_LIFF_ID 時回傳 500", async () => {
      vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "")

      const res = await POST(makeRequest({ idToken: "valid-token" }, "ip-no-liff-id"))
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe("Server configuration error")
    })

    it("LINE verify endpoint 回傳非 2xx 時回傳 401", async () => {
      stubVerifyFetch({ ok: false } as Response)

      const res = await POST(makeRequest({ idToken: "invalid-token" }, "ip-401"))
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe("Invalid or expired LINE ID token")
    })

    it("ID token 的 aud 跟本專案 channel 不符時回傳 401", async () => {
      stubValidIdToken({ sub: "line-user-1", aud: "other-channel" })

      const res = await POST(makeRequest({ idToken: "valid-token" }, "ip-wrong-channel"))
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe("ID token was not issued for this app")
    })

    it("verify 端點連線失敗時回傳 502", async () => {
      stubVerifyFetch(new Error("network error"))

      const res = await POST(makeRequest({ idToken: "valid-token" }, "ip-verify-fail"))
      expect(res.status).toBe(502)
      const json = await res.json()
      expect(json.error).toBe("Failed to verify LINE ID token")
    })
  })

  describe("伺服器設定", () => {
    it("缺少 Supabase 環境變數時回傳 500", async () => {
      stubValidIdToken({ sub: "line-user-1", name: "Alice" })
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")

      const res = await POST(makeRequest({ idToken: "valid-token" }, "ip-500-config"))
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe("Server configuration error")
    })
  })

  describe("成功登入", () => {
    it("既有用戶：查到 profile 就直接用該 id，回傳 200 跟 session", async () => {
      stubValidIdToken({ sub: "line-user-1", name: "Alice", picture: "https://pic/alice.png" })
      const { anonClient } = stubSupabaseClients("existing-user-id")

      const res = await POST(makeRequest({ idToken: "valid-token" }, "ip-existing-user"))

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({
        accessToken: "sb-access-token",
        refreshToken: "sb-refresh-token",
        user: {
          id: "existing-user-id",
          displayName: "Alice",
          avatarUrl: "https://pic/alice.png",
          lineUserId: "line-user-1",
        },
      })
      expect(anonClient.auth.verifyOtp).toHaveBeenCalledWith({
        email: "line-user-1@line.invalid",
        token: "123456",
        type: "magiclink",
      })
    })

    it("新用戶：查不到 profile 就呼叫 createUser 建立帳號，回傳 200", async () => {
      stubValidIdToken({ sub: "line-user-2", name: "Bob" })
      const { adminClient } = stubSupabaseClients(null)

      const res = await POST(makeRequest({ idToken: "valid-token" }, "ip-new-user"))

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user.id).toBe("new-user-id")
      expect(adminClient.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "line-user-2@line.invalid",
          email_confirm: true,
        }),
      )
    })
  })
})

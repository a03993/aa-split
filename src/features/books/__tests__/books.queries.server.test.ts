import { describe, expect, it, vi } from "vitest"

import type { BookBundle } from "@/types/app.types"

import { prefetchBookBundle } from "../books.queries.server"

const { fetchBookBundleLocalMock, fetchBookBundleRpcMock, createServerClientMock } = vi.hoisted(
  () => ({
    fetchBookBundleLocalMock: vi.fn(),
    fetchBookBundleRpcMock: vi.fn(),
    createServerClientMock: vi.fn(),
  }),
)

vi.mock("../books.bundle", () => ({
  fetchBookBundleLocal: fetchBookBundleLocalMock,
  fetchBookBundleRpc: fetchBookBundleRpcMock,
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: createServerClientMock,
}))

// 測試環境沒有設定 NEXT_PUBLIC_ENV=local，IS_LOCAL 為 false，走的是正式環境的 RPC 分支。
describe("prefetchBookBundle（非 local 環境）", () => {
  it("用 server client 呼叫 fetchBookBundleRpc，並回傳其結果", async () => {
    const bundle: BookBundle = { book: null, members: [], expenses: [], settlements: [] }
    const supabaseClient = { rpc: vi.fn() }
    createServerClientMock.mockResolvedValue(supabaseClient)
    fetchBookBundleRpcMock.mockResolvedValue(bundle)

    const result = await prefetchBookBundle("book-1")

    expect(createServerClientMock).toHaveBeenCalled()
    expect(fetchBookBundleRpcMock).toHaveBeenCalledWith(supabaseClient, "book-1")
    expect(fetchBookBundleLocalMock).not.toHaveBeenCalled()
    expect(result).toBe(bundle)
  })
})

import { describe, expect, it, vi } from "vitest"

import { SupabaseBookRepository } from "../book.repository"

type ChainResult = { data: unknown; error: unknown }

function createChainable(result: ChainResult) {
  const chain: Record<string, unknown> = {}
  const methods = [
    "select",
    "eq",
    "in",
    "order",
    "insert",
    "update",
    "delete",
    "single",
    "maybeSingle",
  ]
  for (const method of methods) {
    chain[method] = vi.fn(() => chain)
  }
  chain.then = (resolve: (value: ChainResult) => void) => resolve(result)
  return chain
}

function createMockSupabase(results: ChainResult[]) {
  let call = 0
  const from = vi.fn(() => createChainable(results[call++]))
  return { from } as unknown as ConstructorParameters<typeof SupabaseBookRepository>[0]
}

describe("SupabaseBookRepository", () => {
  describe("settle", () => {
    it("成功時更新 settled_at 並寫入 settlements，不拋出錯誤", async () => {
      const supabase = createMockSupabase([
        { data: null, error: null }, // books.update(settled_at)
        { data: null, error: null }, // settlements.insert
      ])
      const repo = new SupabaseBookRepository(supabase)

      await expect(
        repo.settle("book-1", [
          { book_id: "book-1", payer_member_id: "a", receiver_member_id: "b", amount: 100 },
        ]),
      ).resolves.toBeUndefined()
    })

    it("settlements 為空陣列時只更新 settled_at，不呼叫第二次 from()", async () => {
      const supabase = createMockSupabase([{ data: null, error: null }])
      const repo = new SupabaseBookRepository(supabase)

      await repo.settle("book-1", [])

      expect(supabase.from).toHaveBeenCalledTimes(1)
    })

    it("更新 settled_at 失敗時直接拋出錯誤，不繼續寫入 settlements", async () => {
      const supabase = createMockSupabase([{ data: null, error: { message: "update failed" } }])
      const repo = new SupabaseBookRepository(supabase)

      await expect(repo.settle("book-1", [])).rejects.toThrow(
        'Failed to mark book "book-1" as settled: update failed',
      )
      expect(supabase.from).toHaveBeenCalledTimes(1)
    })

    it("settlements insert 失敗時 rollback settled_at 為 null 並拋出錯誤", async () => {
      const supabase = createMockSupabase([
        { data: null, error: null }, // books.update(settled_at) 成功
        { data: null, error: { message: "insert failed" } }, // settlements.insert 失敗
        { data: null, error: null }, // rollback books.update(settled_at: null) 成功
      ])
      const repo = new SupabaseBookRepository(supabase)

      await expect(
        repo.settle("book-1", [
          { book_id: "book-1", payer_member_id: "a", receiver_member_id: "b", amount: 100 },
        ]),
      ).rejects.toThrow('Failed to insert settlements for book "book-1": insert failed')
      expect(supabase.from).toHaveBeenCalledTimes(3)
    })

    it("rollback 本身也失敗時仍拋出原始 settlements 錯誤（不吞掉、不改變錯誤訊息）", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const supabase = createMockSupabase([
        { data: null, error: null }, // books.update(settled_at) 成功
        { data: null, error: { message: "insert failed" } }, // settlements.insert 失敗
        { data: null, error: { message: "rollback failed" } }, // rollback 也失敗
      ])
      const repo = new SupabaseBookRepository(supabase)

      await expect(
        repo.settle("book-1", [
          { book_id: "book-1", payer_member_id: "a", receiver_member_id: "b", amount: 100 },
        ]),
      ).rejects.toThrow('Failed to insert settlements for book "book-1": insert failed')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe("addCategory", () => {
    const existingBook = {
      custom_categories: [{ key: "food", label: "飲食", icon: "🍔" }],
      updated_at: "2026-06-01T00:00:00Z",
    }

    it("成功時回傳更新後的 book", async () => {
      const updatedBook = { id: "book-1", custom_categories: [] }
      const supabase = createMockSupabase([
        { data: existingBook, error: null }, // fetch existing
        { data: updatedBook, error: null }, // optimistic update 成功
      ])
      const repo = new SupabaseBookRepository(supabase)

      const result = await repo.addCategory("book-1", {
        key: "transport",
        label: "交通",
        icon: "🚗",
      })

      expect(result).toEqual(updatedBook)
    })

    it("樂觀鎖版本衝突（updatedBook 為 null）時拋出錯誤提示重試", async () => {
      const supabase = createMockSupabase([
        { data: existingBook, error: null }, // fetch existing
        { data: null, error: null }, // update 因版本衝突回傳 0 rows
      ])
      const repo = new SupabaseBookRepository(supabase)

      await expect(
        repo.addCategory("book-1", { key: "transport", label: "交通", icon: "🚗" }),
      ).rejects.toThrow("資料已被其他人修改，請重試")
    })

    it("fetch existing 失敗時拋出錯誤", async () => {
      const supabase = createMockSupabase([{ data: null, error: { message: "fetch failed" } }])
      const repo = new SupabaseBookRepository(supabase)

      await expect(
        repo.addCategory("book-1", { key: "transport", label: "交通", icon: "🚗" }),
      ).rejects.toThrow('Failed to fetch book "book-1" for addCategory: fetch failed')
    })

    it("update 本身回傳 error 時拋出錯誤", async () => {
      const supabase = createMockSupabase([
        { data: existingBook, error: null },
        { data: null, error: { message: "update failed" } },
      ])
      const repo = new SupabaseBookRepository(supabase)

      await expect(
        repo.addCategory("book-1", { key: "transport", label: "交通", icon: "🚗" }),
      ).rejects.toThrow('Failed to update custom_categories for book "book-1": update failed')
    })
  })
})

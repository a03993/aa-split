import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

import type { BookBundle } from "@/types/app.types"
import type { Database } from "@/types/database.types"

import { fetchBookBundleLocal, fetchBookBundleRpc } from "../books.bundle"

const findByIdMock = vi.fn()
const findMembersByBookIdMock = vi.fn()
const findExpensesByBookIdMock = vi.fn()
const findSettlementsByBookIdMock = vi.fn()

vi.mock("@/infrastructure/repository.factory", () => ({
  createBookRepository: () => ({ findById: findByIdMock }),
  createMemberRepository: () => ({ findByBookId: findMembersByBookIdMock }),
  createExpenseRepository: () => ({ findByBookId: findExpensesByBookIdMock }),
  createSettlementRepository: () => ({ findByBookId: findSettlementsByBookIdMock }),
}))

function makeSupabaseMock(rpcResult: { data: unknown; error: { message: string } | null }) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
  } as unknown as SupabaseClient<Database>
}

describe("fetchBookBundleLocal", () => {
  it("平行呼叫各 repository 並組成 BookBundle", async () => {
    const book = { id: "book-1" }
    const members = [{ id: "member-1" }]
    const expenses = [{ id: "expense-1" }]
    const settlements = [{ id: "settlement-1" }]

    findByIdMock.mockResolvedValue(book)
    findMembersByBookIdMock.mockResolvedValue(members)
    findExpensesByBookIdMock.mockResolvedValue(expenses)
    findSettlementsByBookIdMock.mockResolvedValue(settlements)

    const result = await fetchBookBundleLocal("book-1")

    expect(result).toEqual({ book, members, expenses, settlements })
    expect(findByIdMock).toHaveBeenCalledWith("book-1")
    expect(findMembersByBookIdMock).toHaveBeenCalledWith("book-1")
    expect(findExpensesByBookIdMock).toHaveBeenCalledWith("book-1")
    expect(findSettlementsByBookIdMock).toHaveBeenCalledWith("book-1")
  })
})

describe("fetchBookBundleRpc", () => {
  it("成功時回傳 rpc 的 data", async () => {
    const bundle: BookBundle = {
      book: { id: "book-1" } as never,
      members: [],
      expenses: [],
      settlements: [],
    }
    const supabase = makeSupabaseMock({ data: bundle, error: null })

    const result = await fetchBookBundleRpc(supabase, "book-1")

    expect(result).toEqual(bundle)
    expect(supabase.rpc).toHaveBeenCalledWith("get_book_bundle", { p_book_id: "book-1" })
  })

  it("data 為 null 時回傳空的 BookBundle", async () => {
    const supabase = makeSupabaseMock({ data: null, error: null })

    const result = await fetchBookBundleRpc(supabase, "book-1")

    expect(result).toEqual({ book: null, members: [], expenses: [], settlements: [] })
  })

  it("rpc 回傳 error 時拋出例外，訊息帶入 bookId 與原始錯誤", async () => {
    const supabase = makeSupabaseMock({ data: null, error: { message: "boom" } })

    await expect(fetchBookBundleRpc(supabase, "book-1")).rejects.toThrow(
      'Failed to fetch book bundle "book-1": boom',
    )
  })
})

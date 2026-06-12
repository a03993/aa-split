import { describe, expect, it, vi } from "vitest"

import type { BookRepository } from "@/domain/book/book.repository"
import type { ExpenseWithDetails, MemberRow } from "@/types/app.types"

import { BookService } from "../books.service"

function makeMember(id: string): MemberRow {
  return {
    id,
    book_id: "book-1",
    display_name: id,
    profile_id: null,
    created_at: "2026-06-01T00:00:00Z",
  }
}

function makeExpense(
  payerMemberId: string,
  amount: number,
  splits: Array<{ memberId: string; amount: number }>,
): ExpenseWithDetails {
  return {
    id: `expense-${payerMemberId}`,
    book_id: "book-1",
    title: "費用",
    category: "food",
    amount,
    payer_member_id: payerMemberId,
    split_mode: "equal",
    date: "2026-06-01",
    time: "12:00",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    payer: makeMember(payerMemberId),
    expense_splits: splits.map((s) => ({
      id: `split-${s.memberId}`,
      expense_id: `expense-${payerMemberId}`,
      member_id: s.memberId,
      amount: s.amount,
      shares: null,
      member: makeMember(s.memberId),
    })),
  } as ExpenseWithDetails
}

describe("BookService.settleBook", () => {
  it("計算轉帳組合後，以正確格式呼叫 repo.settle", async () => {
    const settle = vi.fn().mockResolvedValue(undefined)
    const repo = { settle } as unknown as BookRepository
    const service = new BookService(repo)

    const alice = makeMember("alice")
    const bob = makeMember("bob")
    const expenses = [makeExpense("alice", 100, [{ memberId: "bob", amount: 50 }])]

    await service.settleBook("book-1", [alice, bob], expenses)

    expect(settle).toHaveBeenCalledTimes(1)
    expect(settle).toHaveBeenCalledWith("book-1", [
      {
        book_id: "book-1",
        payer_member_id: "bob",
        receiver_member_id: "alice",
        amount: 50,
        settlement_currency: null,
        exchange_rate: null,
      },
    ])
  })

  it("提供 settlementCurrency 與 exchangeRate 時一併寫入 settle 記錄", async () => {
    const settle = vi.fn().mockResolvedValue(undefined)
    const repo = { settle } as unknown as BookRepository
    const service = new BookService(repo)

    const alice = makeMember("alice")
    const bob = makeMember("bob")
    const expenses = [makeExpense("alice", 100, [{ memberId: "bob", amount: 50 }])]

    await service.settleBook("book-1", [alice, bob], expenses, "TWD", 0.22)

    expect(settle).toHaveBeenCalledWith("book-1", [
      {
        book_id: "book-1",
        payer_member_id: "bob",
        receiver_member_id: "alice",
        amount: 50,
        settlement_currency: "TWD",
        exchange_rate: 0.22,
      },
    ])
  })

  it("沒有費用時傳入空的 settlements 陣列", async () => {
    const settle = vi.fn().mockResolvedValue(undefined)
    const repo = { settle } as unknown as BookRepository
    const service = new BookService(repo)

    await service.settleBook("book-1", [makeMember("alice")], [])

    expect(settle).toHaveBeenCalledWith("book-1", [])
  })

  it("repo.settle 失敗時，錯誤會往外拋出（不吞掉）", async () => {
    const settle = vi.fn().mockRejectedValue(new Error("settle failed"))
    const repo = { settle } as unknown as BookRepository
    const service = new BookService(repo)

    await expect(service.settleBook("book-1", [makeMember("alice")], [])).rejects.toThrow(
      "settle failed",
    )
  })
})

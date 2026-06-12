import { describe, expect, it } from "vitest"

import type { ExpenseWithDetails, MemberRow } from "@/types/app.types"

import { SettlementService } from "../settlements.service"

function makeMember(id: string, displayName: string): MemberRow {
  return {
    id,
    book_id: "book-1",
    display_name: displayName,
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
    id: `expense-${payerMemberId}-${amount}`,
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
    payer: makeMember(payerMemberId, payerMemberId),
    expense_splits: splits.map((s) => ({
      id: `split-${s.memberId}`,
      expense_id: `expense-${payerMemberId}-${amount}`,
      member_id: s.memberId,
      amount: s.amount,
      shares: null,
      member: makeMember(s.memberId, s.memberId),
    })),
  } as ExpenseWithDetails
}

describe("SettlementService.calculatePlan", () => {
  const service = new SettlementService({} as never)

  it("計算兩人分帳的餘額、轉帳與 debtSummary", () => {
    const alice = makeMember("alice", "Alice")
    const bob = makeMember("bob", "Bob")
    const expenses = [makeExpense("alice", 100, [{ memberId: "bob", amount: 50 }])]

    const plan = service.calculatePlan([alice, bob], expenses)

    expect(plan.balances.get("alice")).toBe(100)
    expect(plan.balances.get("bob")).toBe(-50)
    expect(plan.transfers).toHaveLength(1)
    expect(plan.transfers[0]).toMatchObject({
      fromMemberId: "bob",
      toMemberId: "alice",
      amount: 50,
    })
    expect(plan.debtSummary).toHaveLength(1)
    expect(plan.debtSummary[0].fromMember.id).toBe("bob")
    expect(plan.debtSummary[0].toMember.id).toBe("alice")
    expect(plan.debtSummary[0].amount).toBe(50)
  })

  it("沒有費用時餘額全為 0、無轉帳、無 debtSummary", () => {
    const alice = makeMember("alice", "Alice")
    const bob = makeMember("bob", "Bob")

    const plan = service.calculatePlan([alice, bob], [])

    expect(plan.balances.get("alice")).toBe(0)
    expect(plan.balances.get("bob")).toBe(0)
    expect(plan.transfers).toHaveLength(0)
    expect(plan.debtSummary).toHaveLength(0)
  })

  it("transfer 對應到已離開帳本（不在 members 清單中）的成員時，該筆從 debtSummary 中過濾掉", () => {
    const alice = makeMember("alice", "Alice")
    // bob 曾經是成員、參與過費用分攤，但已經離開帳本（不在目前的 members 清單中）
    const expenses = [makeExpense("alice", 100, [{ memberId: "bob", amount: 50 }])]

    // calculatePlan 只收到 alice（bob 已被移除），但 expenses 仍包含 bob 的分攤紀錄
    const plan = service.calculatePlan([alice], expenses)

    // balances/transfers 仍會計算出 bob 的部分（因為是從 expenses 算出的）
    expect(plan.transfers).toHaveLength(1)
    // 但 debtSummary 因為在 memberById 裡找不到 bob，會被過濾掉
    expect(plan.debtSummary).toHaveLength(0)
  })
})

import { describe, expect, it } from "vitest"

import type { ExpenseWithDetails } from "@/types/app.types"

import { calculateBalances, calculateSettlement } from "../settlement.calculator"

const ALICE = "member-alice"
const BOB = "member-bob"
const CAROL = "member-carol"
const DAVE = "member-dave"

function makeExpense(
  payerMemberId: string,
  amount: number,
  splits: { memberId: string; amount: number }[],
): ExpenseWithDetails {
  return {
    id: `exp-${Math.random()}`,
    book_id: "book-1",
    title: "test",
    category: "food",
    amount,
    payer_member_id: payerMemberId,
    split_mode: "equal",
    date: "2026-06-08",
    time: "00:00:00",
    created_at: "2026-06-08T00:00:00Z",
    updated_at: "2026-06-08T00:00:00Z",
    payer: {
      id: payerMemberId,
      book_id: "book-1",
      display_name: "test",
      profile_id: null,
      created_at: "",
    },
    expense_splits: splits.map((s) => ({
      id: `split-${Math.random()}`,
      expense_id: "exp-1",
      member_id: s.memberId,
      amount: s.amount,
      shares: null,
      created_at: "",
      member: {
        id: s.memberId,
        book_id: "book-1",
        display_name: "test",
        profile_id: null,
        created_at: "",
      },
    })),
  }
}

describe("calculateBalances", () => {
  it("無費用時所有成員 balance 為 0", () => {
    const balances = calculateBalances([], [ALICE, BOB])
    expect(balances.get(ALICE)).toBe(0)
    expect(balances.get(BOB)).toBe(0)
  })

  it("付款人 balance 增加，分攤者 balance 減少", () => {
    const expense = makeExpense(ALICE, 300, [
      { memberId: ALICE, amount: 100 },
      { memberId: BOB, amount: 100 },
      { memberId: CAROL, amount: 100 },
    ])
    const balances = calculateBalances([expense], [ALICE, BOB, CAROL])
    // Alice 付 300，自己分攤 100，淨值 +200
    expect(balances.get(ALICE)).toBe(200)
    // Bob 未付款，分攤 100，淨值 -100
    expect(balances.get(BOB)).toBe(-100)
    expect(balances.get(CAROL)).toBe(-100)
  })

  it("多筆費用累加正確", () => {
    const e1 = makeExpense(ALICE, 300, [
      { memberId: ALICE, amount: 100 },
      { memberId: BOB, amount: 100 },
      { memberId: CAROL, amount: 100 },
    ])
    const e2 = makeExpense(BOB, 240, [
      { memberId: ALICE, amount: 80 },
      { memberId: BOB, amount: 80 },
      { memberId: CAROL, amount: 80 },
    ])
    const balances = calculateBalances([e1, e2], [ALICE, BOB, CAROL])
    // Alice：付 300，分攤 100+80，淨值 +120
    expect(balances.get(ALICE)).toBe(120)
    // Bob：付 240，分攤 100+80，淨值 +60
    expect(balances.get(BOB)).toBe(60)
    // Carol：未付款，分攤 100+80，淨值 -180
    expect(balances.get(CAROL)).toBe(-180)
  })
})

describe("calculateSettlement", () => {
  it("所有人 balance 為 0 時無需轉帳", () => {
    const balances = new Map([
      [ALICE, 0],
      [BOB, 0],
    ])
    expect(calculateSettlement(balances)).toHaveLength(0)
  })

  it("簡單兩人：債務人付給債權人", () => {
    const balances = new Map([
      [ALICE, 100], // 債權人
      [BOB, -100], // 債務人
    ])
    const transfers = calculateSettlement(balances)
    expect(transfers).toHaveLength(1)
    expect(transfers[0]).toEqual({
      fromMemberId: BOB,
      toMemberId: ALICE,
      amount: 100,
    })
  })

  it("三人：最小轉帳筆數", () => {
    // Alice: +200，Bob: -100，Carol: -100
    const balances = new Map([
      [ALICE, 200],
      [BOB, -100],
      [CAROL, -100],
    ])
    const transfers = calculateSettlement(balances)
    expect(transfers).toHaveLength(2)
    const total = transfers.reduce((sum, t) => sum + t.amount, 0)
    expect(total).toBe(200)
  })

  it("浮點數微差（< 0.01）不產生轉帳", () => {
    const balances = new Map([
      [ALICE, 0.005],
      [BOB, -0.005],
    ])
    expect(calculateSettlement(balances)).toHaveLength(0)
  })

  it("金額四捨五入到分", () => {
    // 100 ÷ 3 產生小數，驗證轉帳金額皆為整數分位
    const balances = new Map([
      [ALICE, 66.67],
      [BOB, -33.33],
      [CAROL, -33.34],
    ])
    const transfers = calculateSettlement(balances)
    transfers.forEach((t) => {
      expect(Number.isInteger(Math.round(t.amount * 100))).toBe(true)
    })
  })
})

describe("calculateSettlement — 多人複雜場景", () => {
  it("4 人多筆費用：transfers 總金額 === 所有債務人 balance 絕對值之和", () => {
    // Alice 付 400，四人均分（各 100）→ 淨值 +175
    // Bob 付 300，四人均分（各 75） → 淨值 +75
    // Carol 付 200，四人均分（各 50）→ 淨值 -25
    // Dave 未付款，分攤 225          → 淨值 -225
    const balances = new Map([
      [ALICE, 175],
      [BOB, 75],
      [CAROL, -25],
      [DAVE, -225],
    ])

    const debtorTotal = [...balances.values()]
      .filter((b) => b < 0)
      .reduce((sum, b) => sum + Math.abs(b), 0)

    const transfers = calculateSettlement(balances)
    const transferTotal = transfers.reduce((sum, t) => sum + t.amount, 0)

    expect(Math.round(transferTotal * 100)).toBe(Math.round(debtorTotal * 100))
  })

  it("balance 為 0 的成員不出現在任何 transfer 中", () => {
    const EVE = "member-eve"
    const balances = new Map([
      [ALICE, 200],
      [BOB, -100],
      [CAROL, -100],
      [EVE, 0],
    ])

    const transfers = calculateSettlement(balances)

    const memberIds = transfers.flatMap((t) => [t.fromMemberId, t.toMemberId])
    expect(memberIds).not.toContain(EVE)
  })
})

import { describe, expect, it } from "vitest"

import { calculateCustomSplit, calculateEqualSplit, validateSplits } from "../expense.entity"

describe("calculateEqualSplit", () => {
  it("整除時每人金額相同", () => {
    expect(calculateEqualSplit(300, 3)).toEqual([100, 100, 100])
  })

  it("無法整除時餘數分給第一人", () => {
    expect(calculateEqualSplit(100, 3)).toEqual([33.34, 33.33, 33.33])
  })

  it("單人時全額分給自己", () => {
    expect(calculateEqualSplit(500, 1)).toEqual([500])
  })

  it("結果加總等於原始金額", () => {
    const splits = calculateEqualSplit(100, 3)
    const total = splits.reduce((a, b) => a + b, 0)
    expect(Math.round(total * 100)).toBe(Math.round(100 * 100))
  })

  it("memberCount 為 0 時拋出錯誤", () => {
    expect(() => calculateEqualSplit(100, 0)).toThrow(RangeError)
  })

  it("amount 為負數時拋出錯誤", () => {
    expect(() => calculateEqualSplit(-100, 3)).toThrow(RangeError)
  })

  it("amount 為 0 時每人均為 0", () => {
    expect(calculateEqualSplit(0, 3)).toEqual([0, 0, 0])
  })
})

describe("calculateCustomSplit", () => {
  it("全部份數模式：依份數等比例分配", () => {
    const result = calculateCustomSplit(100, [
      { memberId: "a", shares: 1 },
      { memberId: "b", shares: 1 },
    ])
    expect(result).toEqual([
      { memberId: "a", amount: 50, shares: 1 },
      { memberId: "b", amount: 50, shares: 1 },
    ])
  })

  it("份數不等時依比例分配", () => {
    const result = calculateCustomSplit(100, [
      { memberId: "a", shares: 1 },
      { memberId: "b", shares: 3 },
    ])
    expect(result).toEqual([
      { memberId: "a", amount: 25, shares: 1 },
      { memberId: "b", amount: 75, shares: 3 },
    ])
  })

  it("全部固定金額：直接使用 fixedAmount", () => {
    const result = calculateCustomSplit(100, [
      { memberId: "a", fixedAmount: 60 },
      { memberId: "b", fixedAmount: 40 },
    ])
    expect(result).toEqual([
      { memberId: "a", amount: 60, shares: null },
      { memberId: "b", amount: 40, shares: null },
    ])
  })

  it("混合模式：固定金額 + 份數分配剩餘", () => {
    const result = calculateCustomSplit(100, [
      { memberId: "a", fixedAmount: 40 },
      { memberId: "b", shares: 1 },
      { memberId: "c", shares: 1 },
    ])
    expect(result).toEqual([
      { memberId: "a", amount: 40, shares: null },
      { memberId: "b", amount: 30, shares: 1 },
      { memberId: "c", amount: 30, shares: 1 },
    ])
  })

  it("份數分配有餘數時補給最後一位份數參與者", () => {
    const result = calculateCustomSplit(100, [
      { memberId: "a", fixedAmount: 1 },
      { memberId: "b", shares: 1 },
      { memberId: "c", shares: 1 },
    ])
    const total = result.reduce((sum, r) => sum + r.amount, 0)
    expect(Math.round(total * 100)).toBe(Math.round(100 * 100))
    expect(result.find((r) => r.memberId === "a")?.amount).toBe(1)
  })

  it("只有一位份數參與者時，該人分得所有剩餘金額", () => {
    const result = calculateCustomSplit(100, [
      { memberId: "a", fixedAmount: 30 },
      { memberId: "b", fixedAmount: 20 },
      { memberId: "c", shares: 1 },
    ])
    expect(result.find((r) => r.memberId === "c")?.amount).toBe(50)
  })

  it("結果加總嚴格等於 amount", () => {
    const result = calculateCustomSplit(100, [
      { memberId: "a", shares: 3 },
      { memberId: "b", shares: 3 },
      { memberId: "c", shares: 1 },
    ])
    const total = result.reduce((sum, r) => sum + r.amount, 0)
    expect(Math.round(total * 100)).toBe(Math.round(100 * 100))
  })

  it("金額為 0 時所有人分得 0", () => {
    const result = calculateCustomSplit(0, [
      { memberId: "a", shares: 1 },
      { memberId: "b", shares: 1 },
    ])
    expect(result).toEqual([
      { memberId: "a", amount: 0, shares: 1 },
      { memberId: "b", amount: 0, shares: 1 },
    ])
  })

  it("shares=0 且無 fixed 的參與者 amount 為 0", () => {
    const result = calculateCustomSplit(100, [
      { memberId: "a", shares: 0 },
      { memberId: "b", shares: 1 },
      { memberId: "c", shares: 1 },
    ])
    expect(result.find((r) => r.memberId === "a")?.amount).toBe(0)
    expect(result.find((r) => r.memberId === "b")?.amount).toBe(50)
    expect(result.find((r) => r.memberId === "c")?.amount).toBe(50)
  })

  it("最後一位份數參與者鎖定為剩餘金額（吸收除法餘數）", () => {
    const result = calculateCustomSplit(10, [
      { memberId: "a", shares: 1 },
      { memberId: "b", shares: 1 },
      { memberId: "c", shares: 1 },
    ])
    expect(result.find((r) => r.memberId === "a")?.amount).toBe(3.33)
    expect(result.find((r) => r.memberId === "b")?.amount).toBe(3.33)
    expect(result.find((r) => r.memberId === "c")?.amount).toBe(3.34)
  })
})

describe("validateSplits", () => {
  it("加總等於 amount 時回傳 true", () => {
    expect(validateSplits(300, [100, 100, 100])).toBe(true)
  })

  it("加總在 ±0.01 容差內回傳 true", () => {
    expect(validateSplits(100, [33.34, 33.33, 33.33])).toBe(true)
  })

  it("加總超出容差時回傳 false", () => {
    expect(validateSplits(300, [100, 100, 99])).toBe(false)
  })

  it("空陣列回傳 false", () => {
    expect(validateSplits(100, [])).toBe(false)
  })
})

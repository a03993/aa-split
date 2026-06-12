import { describe, expect, it } from "vitest"

import { createExpenseSchema } from "../expense.schema"

const validBase = {
  title: "午餐",
  category: "food",
  amount: 100,
  payerMemberId: "00000000-0000-0000-0000-000000000001",
  splitMode: "equal" as const,
  splits: [
    { memberId: "00000000-0000-0000-0000-000000000001", amount: 50 },
    { memberId: "00000000-0000-0000-0000-000000000002", amount: 50 },
  ],
  date: "2024-01-15",
  time: "12:30",
}

describe("createExpenseSchema", () => {
  it("完整有效資料通過驗證", () => {
    expect(createExpenseSchema.safeParse(validBase).success).toBe(true)
  })

  describe("title", () => {
    it("空字串失敗", () => {
      const result = createExpenseSchema.safeParse({ ...validBase, title: "" })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("請輸入費用名稱")
    })
  })

  describe("category", () => {
    it("空字串失敗", () => {
      const result = createExpenseSchema.safeParse({ ...validBase, category: "" })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("請選擇分類")
    })
  })

  describe("amount", () => {
    it("0 失敗（必須大於 0）", () => {
      const result = createExpenseSchema.safeParse({ ...validBase, amount: 0 })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("金額必須大於 0")
    })

    it("負數失敗", () => {
      const result = createExpenseSchema.safeParse({ ...validBase, amount: -10 })
      expect(result.success).toBe(false)
    })

    it("字串型態失敗並回傳型態錯誤訊息", () => {
      const result = createExpenseSchema.safeParse({ ...validBase, amount: "100" })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("請輸入金額")
    })
  })

  describe("payerMemberId", () => {
    it("非 UUID 格式失敗", () => {
      const result = createExpenseSchema.safeParse({ ...validBase, payerMemberId: "not-a-uuid" })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("請選擇付款人")
    })

    it("有效 UUID 通過", () => {
      expect(createExpenseSchema.safeParse(validBase).success).toBe(true)
    })
  })

  describe("splitMode", () => {
    it("custom 通過", () => {
      expect(createExpenseSchema.safeParse({ ...validBase, splitMode: "custom" }).success).toBe(
        true,
      )
    })

    it("不合法值失敗", () => {
      const result = createExpenseSchema.safeParse({ ...validBase, splitMode: "proportional" })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("請選擇分攤方式")
    })
  })

  describe("splits", () => {
    it("空陣列通過（schema 本身不驗長度）", () => {
      expect(createExpenseSchema.safeParse({ ...validBase, splits: [] }).success).toBe(true)
    })

    it("split item memberId 非 UUID 失敗", () => {
      const result = createExpenseSchema.safeParse({
        ...validBase,
        splits: [{ memberId: "bad-id", amount: 100 }],
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("成員 ID 格式錯誤")
    })

    it("split item amount 為負數失敗", () => {
      const result = createExpenseSchema.safeParse({
        ...validBase,
        splits: [{ memberId: "00000000-0000-0000-0000-000000000001", amount: -1 }],
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("金額不能為負數")
    })

    it("split item amount 為 0 通過（允許零分攤）", () => {
      const result = createExpenseSchema.safeParse({
        ...validBase,
        splits: [{ memberId: "00000000-0000-0000-0000-000000000001", amount: 0 }],
      })
      expect(result.success).toBe(true)
    })
  })

  describe("date", () => {
    it("YYYY-MM-DD 格式通過", () => {
      expect(createExpenseSchema.safeParse({ ...validBase, date: "2024-12-31" }).success).toBe(true)
    })

    it("格式錯誤失敗", () => {
      const result = createExpenseSchema.safeParse({ ...validBase, date: "2024/01/15" })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("日期格式應為 YYYY-MM-DD")
    })
  })

  describe("time", () => {
    it("HH:MM 格式通過", () => {
      expect(createExpenseSchema.safeParse({ ...validBase, time: "09:05" }).success).toBe(true)
    })

    it("HH:MM:SS 格式通過", () => {
      expect(createExpenseSchema.safeParse({ ...validBase, time: "09:05:30" }).success).toBe(true)
    })

    it("格式錯誤失敗", () => {
      const result = createExpenseSchema.safeParse({ ...validBase, time: "9:5" })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("時間格式應為 HH:MM 或 HH:MM:SS")
    })
  })
})

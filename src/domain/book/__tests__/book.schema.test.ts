import { describe, expect, it } from "vitest"

import { createBookSchema } from "../book.schema"

describe("createBookSchema", () => {
  describe("bookTitle", () => {
    it("有效名稱通過驗證", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "日本旅遊",
        memberNames: ["Bob"],
        currency: "TWD",
      })
      expect(result.success).toBe(true)
    })

    it("空字串失敗", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "",
        memberNames: ["Bob"],
        currency: "TWD",
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("帳本名稱不能為空")
    })

    it("超過 20 字元失敗", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "a".repeat(21),
        memberNames: ["Bob"],
        currency: "TWD",
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("帳本名稱最多 20 個字元")
    })

    it("剛好 20 字元通過", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "a".repeat(20),
        memberNames: ["Bob"],
        currency: "TWD",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("memberNames", () => {
    it("空陣列通過（成員為選填，owner 已在後端自動加入）", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "旅遊",
        memberNames: [],
        currency: "TWD",
      })
      expect(result.success).toBe(true)
    })

    it("一位成員通過", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "旅遊",
        memberNames: ["Alice"],
        currency: "TWD",
      })
      expect(result.success).toBe(true)
    })

    it("成員名稱超過 20 字元失敗", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "旅遊",
        memberNames: ["a".repeat(21)],
        currency: "TWD",
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("成員名稱最多 20 個字元")
    })

    it("成員名稱剛好 20 字元通過", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "旅遊",
        memberNames: ["a".repeat(20)],
        currency: "TWD",
      })
      expect(result.success).toBe(true)
    })

    it("成員名稱為空字串失敗", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "旅遊",
        memberNames: [""],
        currency: "TWD",
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe("成員名稱不能為空")
    })
  })

  describe("currency", () => {
    it("未提供幣別失敗", () => {
      const result = createBookSchema.safeParse({ bookTitle: "旅遊", memberNames: [] })
      expect(result.success).toBe(false)
    })

    it("不支援的幣別代碼失敗", () => {
      const result = createBookSchema.safeParse({
        bookTitle: "旅遊",
        memberNames: [],
        currency: "EUR",
      })
      expect(result.success).toBe(false)
    })
  })
})

import { describe, expect, it } from "vitest"

import { isOwner, isSettled } from "../book.entity"

const baseBook = {
  id: "book-1",
  name: "旅遊",
  owner_id: "user-alice",
  settled_at: null,
  settlement_currency: null,
  exchange_rate: null,
  custom_categories: [],
  currency: "TWD",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
}

describe("isSettled", () => {
  it("settled_at 為 null 時回傳 false", () => {
    expect(isSettled(baseBook)).toBe(false)
  })

  it("settled_at 有值時回傳 true", () => {
    expect(isSettled({ ...baseBook, settled_at: "2026-06-10T00:00:00Z" })).toBe(true)
  })
})

describe("isOwner", () => {
  it("userId 與 owner_id 相同時回傳 true", () => {
    expect(isOwner(baseBook, "user-alice")).toBe(true)
  })

  it("userId 與 owner_id 不同時回傳 false", () => {
    expect(isOwner(baseBook, "user-bob")).toBe(false)
  })
})

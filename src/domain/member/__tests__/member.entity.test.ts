import { describe, expect, it } from "vitest"

import { canClaim, isClaimed } from "../member.entity"

const baseMember = {
  id: "member-1",
  book_id: "book-1",
  display_name: "Alice",
  profile_id: null,
  created_at: "2026-06-01T00:00:00Z",
}

describe("isClaimed", () => {
  it("profile_id 為 null 時回傳 false", () => {
    expect(isClaimed(baseMember)).toBe(false)
  })

  it("profile_id 有值時回傳 true", () => {
    expect(isClaimed({ ...baseMember, profile_id: "user-alice" })).toBe(true)
  })
})

describe("canClaim", () => {
  it("未認領的 slot 可以 claim", () => {
    expect(canClaim(baseMember)).toBe(true)
  })

  it("已認領的 slot 不能 claim", () => {
    expect(canClaim({ ...baseMember, profile_id: "user-alice" })).toBe(false)
  })
})

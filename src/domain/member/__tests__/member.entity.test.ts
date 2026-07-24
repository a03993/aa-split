import { describe, expect, it } from "vitest"

import {
  DEFAULT_AVATAR_URL,
  canClaim,
  getAvatarUrl,
  getDisplayName,
  isClaimed,
} from "../member.entity"

const baseMember = {
  id: "member-1",
  book_id: "book-1",
  display_name: "Alice",
  profile_id: null,
  created_at: "2026-06-01T00:00:00Z",
  profile: null,
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

describe("getDisplayName", () => {
  it("未認領時回傳 slot 自己的 display_name", () => {
    expect(getDisplayName(baseMember)).toBe("Alice")
  })

  it("已認領時優先回傳 profile 的 display_name", () => {
    const member = {
      ...baseMember,
      profile_id: "user-alice",
      profile: { id: "user-alice", display_name: "Alice Lin", avatar_url: "" },
    }
    expect(getDisplayName(member)).toBe("Alice Lin")
  })
})

describe("getAvatarUrl", () => {
  it("未認領時回傳 null", () => {
    expect(getAvatarUrl(baseMember)).toBeNull()
  })

  it("已認領但 LINE 沒給頭貼時回傳 DEFAULT_AVATAR_URL", () => {
    const member = {
      ...baseMember,
      profile_id: "user-alice",
      profile: { id: "user-alice", display_name: "Alice Lin", avatar_url: "" },
    }
    expect(getAvatarUrl(member)).toBe(DEFAULT_AVATAR_URL)
  })

  it("已認領且有頭貼時回傳 avatar_url", () => {
    const member = {
      ...baseMember,
      profile_id: "user-alice",
      profile: { id: "user-alice", display_name: "Alice Lin", avatar_url: "https://line.me/a.png" },
    }
    expect(getAvatarUrl(member)).toBe("https://line.me/a.png")
  })
})

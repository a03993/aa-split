import { describe, expect, it, vi } from "vitest"

import type { Member } from "@/types/app.types"

import { MemberService } from "../members.service"

const baseMember = (overrides: Partial<Member> = {}): Member => ({
  id: "member-1",
  book_id: "book-1",
  display_name: "Alice",
  profile_id: "user-alice",
  created_at: "2026-06-01T00:00:00Z",
  profile: null,
  ...overrides,
})

const service = new MemberService({} as never)

describe("MemberService.findCurrentUserMember", () => {
  it("找到對應 profile_id 的成員", () => {
    const members = [
      baseMember({ id: "member-1", profile_id: "user-alice" }),
      baseMember({ id: "member-2", profile_id: "user-bob" }),
    ]
    expect(service.findCurrentUserMember(members, "user-alice")?.id).toBe("member-1")
  })

  it("找不到時回傳 undefined", () => {
    const members = [baseMember({ profile_id: "user-alice" })]
    expect(service.findCurrentUserMember(members, "user-bob")).toBeUndefined()
  })

  it("空陣列時回傳 undefined", () => {
    expect(service.findCurrentUserMember([], "user-alice")).toBeUndefined()
  })
})

describe("MemberService.getUnclaimedMembers", () => {
  it("回傳所有 profile_id 為 null 的成員", () => {
    const members = [
      baseMember({ id: "member-1", profile_id: "user-alice" }),
      baseMember({ id: "member-2", profile_id: null }),
      baseMember({ id: "member-3", profile_id: null }),
    ]
    const unclaimed = service.getUnclaimedMembers(members)
    expect(unclaimed).toHaveLength(2)
    expect(unclaimed.map((m) => m.id)).toEqual(["member-2", "member-3"])
  })

  it("全部已認領時回傳空陣列", () => {
    const members = [baseMember({ profile_id: "user-alice" })]
    expect(service.getUnclaimedMembers(members)).toHaveLength(0)
  })

  it("空陣列時回傳空陣列", () => {
    expect(service.getUnclaimedMembers([])).toHaveLength(0)
  })
})

describe("場景 10 — 批次新增成員（Promise.all）部分失敗", () => {
  const makeRow = (id: string, name: string) => ({
    id,
    book_id: "book-1",
    display_name: name,
    profile_id: null as null,
    created_at: "2026-06-01T00:00:00Z",
  })

  it("第 2 個 reject 時，Promise.all 整體 reject 並傳遞原始錯誤", async () => {
    const dbError = new Error("DB insert failed")
    const mockRepo = {
      findByBookId: async () => [],
      claim: async () => makeRow("m1", "Alice"),
      removeMember: async () => undefined,
      unclaim: async () => makeRow("m1", "Alice"),
      addMember: vi
        .fn()
        .mockResolvedValueOnce(makeRow("m1", "Alice"))
        .mockRejectedValueOnce(dbError)
        .mockResolvedValueOnce(makeRow("m3", "Carol")),
    }
    const svc = new MemberService(mockRepo as never)
    await expect(
      Promise.all(["Alice", "Bob", "Carol"].map((name) => svc.addMember("book-1", name))),
    ).rejects.toThrow("DB insert failed")
  })

  it("部分失敗時 addMember 仍被呼叫 3 次（Promise.all 並行）", async () => {
    const addMemberMock = vi
      .fn()
      .mockResolvedValueOnce(makeRow("m1", "Alice"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(makeRow("m3", "Carol"))
    const svc = new MemberService({ addMember: addMemberMock } as never)
    await Promise.all(["Alice", "Bob", "Carol"].map((name) => svc.addMember("book-1", name))).catch(
      () => {},
    )
    expect(addMemberMock).toHaveBeenCalledTimes(3)
  })

  it("全部成功時回傳所有成員", async () => {
    const mockRepo = {
      addMember: vi
        .fn()
        .mockResolvedValueOnce(makeRow("m1", "Alice"))
        .mockResolvedValueOnce(makeRow("m2", "Bob"))
        .mockResolvedValueOnce(makeRow("m3", "Carol")),
    }
    const svc = new MemberService(mockRepo as never)
    const results = await Promise.all(
      ["Alice", "Bob", "Carol"].map((name) => svc.addMember("book-1", name)),
    )
    expect(results.map((r) => r.display_name)).toEqual(["Alice", "Bob", "Carol"])
  })
})

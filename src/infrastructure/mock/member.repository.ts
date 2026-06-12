import type { MemberRepository } from "@/domain/member/member.repository"
import type { Member, MemberRow } from "@/types/app.types"

import { _mockMembers } from "./book.repository"
import { MOCK_USER_ID } from "./mock-data"

// _mockMembers 是跨實例共享的可變陣列（參照而非副本），模擬資料庫持久化行為。
// 所有 MockMemberRepository 實例操作的都是同一份資料，符合本地開發的預期。
const members: Member[] = _mockMembers

function delay(): Promise<void> {
  return new Promise((r) => setTimeout(r, 50))
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export class MockMemberRepository implements MemberRepository {
  async findByBookId(bookId: string): Promise<Member[]> {
    await delay()
    return members.filter((m) => m.book_id === bookId)
  }

  async claim(memberId: string): Promise<MemberRow> {
    await delay()
    const member = members.find((m) => m.id === memberId)
    if (!member) {
      throw new Error(`MockMemberRepository: member "${memberId}" not found`)
    }
    // Mock 實作固定使用 MOCK_USER_ID 作為認領者，
    // 與 Supabase 實作（從 auth session 取 user.id）的行為一致：
    // 都是綁定「當前登入用戶」，只是 mock 環境只有一個固定用戶。
    member.profile_id = MOCK_USER_ID
    return { ...member }
  }

  async addMember(bookId: string, displayName: string): Promise<MemberRow> {
    await delay()
    const now = new Date().toISOString()
    const newMember: Member = {
      id: generateId("mock-member"),
      book_id: bookId,
      display_name: displayName,
      profile_id: null,
      created_at: now,
      profile: null,
    }
    members.push(newMember)
    return { ...newMember }
  }

  async removeMember(memberId: string): Promise<void> {
    await delay()
    const index = members.findIndex((m) => m.id === memberId)
    if (index === -1) {
      throw new Error(`MockMemberRepository: member "${memberId}" not found`)
    }
    members.splice(index, 1)
  }

  async unclaim(memberId: string): Promise<MemberRow> {
    await delay()
    const member = members.find((m) => m.id === memberId)
    if (!member) {
      throw new Error(`MockMemberRepository: member "${memberId}" not found`)
    }
    member.profile_id = null
    return { ...member }
  }
}

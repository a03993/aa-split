import { canClaim } from "@/domain/member"
import type { MemberRepository } from "@/domain/member/member.repository"
import type { Member, MemberRow } from "@/types/app.types"

export class MemberService {
  constructor(private repo: MemberRepository) {}

  /**
   * 取得指定帳本的所有成員，包含已連結的用戶 profile 資料。
   */
  async getMembers(bookId: string): Promise<Member[]> {
    return this.repo.findByBookId(bookId)
  }

  /**
   * 將 member slot 連結至當前登入用戶（認領成員）。
   * userId 由 repository 層從 auth session 取得，不接受外部傳入，防止越權操作。
   * 回傳更新後的 MemberRow。
   */
  async claimMember(memberId: string): Promise<MemberRow> {
    return this.repo.claim(memberId)
  }

  /**
   * 在指定帳本新增一個尚未認領的成員 slot。
   * 回傳新建立的 MemberRow。
   */
  async addMember(bookId: string, displayName: string): Promise<MemberRow> {
    return this.repo.addMember(bookId, displayName)
  }

  /**
   * 從帳本移除一個成員 slot。
   */
  async removeMember(memberId: string): Promise<void> {
    return this.repo.removeMember(memberId)
  }

  /**
   * 解除 member slot 與用戶帳號的連結（將 profile_id 設為 null）。
   * 回傳更新後的 MemberRow。
   */
  async unclaimMember(memberId: string): Promise<MemberRow> {
    return this.repo.unclaim(memberId)
  }

  /**
   * 在成員列表中找出與當前用戶連結的 member slot。
   */
  findCurrentUserMember(members: Member[], userId: string): Member | undefined {
    return members.find((m) => m.profile_id === userId)
  }

  /**
   * 回傳尚未認領的成員列表（profile_id 為 null 的成員）。
   */
  getUnclaimedMembers(members: Member[]): Member[] {
    return members.filter(canClaim)
  }
}

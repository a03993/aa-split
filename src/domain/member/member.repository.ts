import type { Member, MemberRow } from "@/types/app.types"

export interface MemberRepository {
  findByBookId(bookId: string): Promise<Member[]>
  claim(memberId: string): Promise<MemberRow>
  addMember(bookId: string, displayName: string): Promise<MemberRow>
  removeMember(memberId: string): Promise<void>
  unclaim(memberId: string): Promise<MemberRow>
}

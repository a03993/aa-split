import type { MemberRow } from "@/types/app.types"

export function isClaimed(member: MemberRow): boolean {
  return member.profile_id !== null
}

export function canClaim(member: MemberRow): boolean {
  return !isClaimed(member)
}

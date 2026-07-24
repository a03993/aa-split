import type { Member, MemberRow } from "@/types/app.types"

export function isClaimed(member: MemberRow): boolean {
  return member.profile_id !== null
}

export function canClaim(member: MemberRow): boolean {
  return !isClaimed(member)
}

// 認領後優先顯示 LINE 的 display_name/avatar_url，未認領則用 slot 自己的 display_name
export function getDisplayName(member: Member): string {
  if (!member.profile) {
    return member.display_name
  }

  return member.profile.display_name
}

// TODO: 補上自己設計的預設頭貼圖片路徑
export const DEFAULT_AVATAR_URL = ""

// 未認領（沒有 profile）維持 null，讓 UI fallback 顯示字母；
// 已認領但 LINE 沒給頭貼（avatar_url 是空字串）才用 DEFAULT_AVATAR_URL。
export function getAvatarUrl(member: Member): string | null {
  if (!member.profile) {
    return null
  }

  return member.profile.avatar_url || DEFAULT_AVATAR_URL
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAvatarUrl, getDisplayName } from "@/domain/member"
import type { Member } from "@/types/app.types"

interface MemberAvatarProps {
  member: Member | undefined
  fallbackLabel?: string
  size?: "sm" | "md"
  className?: string
}

// 認領後顯示 LINE 頭像/名字，未認領則顯示 slot 名字縮寫；member 找不到時用 fallbackLabel 兜底
export function MemberAvatar({ member, fallbackLabel = "", size, className }: MemberAvatarProps) {
  const avatarUrl = member ? getAvatarUrl(member) : null
  const label = member ? getDisplayName(member) : fallbackLabel

  return (
    <Avatar size={size} className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} />}
      <AvatarFallback className="font-medium text-foreground">
        {label.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

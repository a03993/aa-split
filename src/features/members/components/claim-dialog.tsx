"use client"

import { MemberAvatar } from "@/components/member-avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getDisplayName } from "@/domain/member"
import type { Member } from "@/types/app.types"

export type ClaimDialogTrigger = "entry" | "add-expense"

interface Content {
  title: string
  label: string
}

const CONTENT: Record<ClaimDialogTrigger, Content> = {
  entry: {
    title: "你是哪一位？",
    label: "以訪客身份瀏覽",
  },
  "add-expense": {
    title: "想要新增帳單嗎？你需要先認領身份",
    label: "繼續以訪客身份瀏覽",
  },
}

interface ClaimDialogProps {
  open: boolean
  unclaimedMembers: Member[]
  trigger?: ClaimDialogTrigger
  onClaim: (memberId: string) => void
  onContinueAsGuest: () => void
}

export function ClaimDialog({
  open,
  unclaimedMembers,
  trigger = "entry",
  onClaim,
  onContinueAsGuest,
}: ClaimDialogProps) {
  const { title, label } = CONTENT[trigger]

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <p className="mb-4 text-sm text-muted-foreground">請選擇你在這個帳本中的身份</p>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {unclaimedMembers.map((member) => (
            <Button
              key={member.id}
              variant="outline"
              className="flex h-auto w-full items-center justify-start gap-3 rounded-xl p-4 text-left"
              onClick={() => onClaim(member.id)}
            >
              <MemberAvatar member={member} />
              <span className="font-medium">{getDisplayName(member)}</span>
            </Button>
          ))}

          {unclaimedMembers.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">沒有未認領的成員</p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          找不到你的名字嗎？請帳本建立者幫你新增身份
        </p>

        <Button
          variant="ghost"
          className="mt-2 w-full text-muted-foreground"
          onClick={onContinueAsGuest}
        >
          {label}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

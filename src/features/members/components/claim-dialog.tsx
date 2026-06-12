"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Member } from "@/types/app.types"

interface ClaimDialogProps {
  open: boolean
  unclaimedMembers: Member[]
  onClaim: (memberId: string) => void
  onContinueAsGuest: () => void
}

export function ClaimDialog({
  open,
  unclaimedMembers,
  onClaim,
  onContinueAsGuest,
}: ClaimDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>你是哪一位？</DialogTitle>
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
              <Avatar size="md">
                {member.profile?.avatar_url && <AvatarImage src={member.profile.avatar_url} />}
                <AvatarFallback className="font-medium text-foreground">
                  {member.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.display_name}</span>
            </Button>
          ))}

          {unclaimedMembers.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">沒有未認領的成員</p>
          )}
        </div>

        <Button
          variant="ghost"
          className="mt-2 w-full text-muted-foreground"
          onClick={onContinueAsGuest}
        >
          以訪客身份瀏覽
        </Button>
      </DialogContent>
    </Dialog>
  )
}

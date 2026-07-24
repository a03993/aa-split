"use client"

import { useState } from "react"

import { CircleMinus, CornerDownLeft, LogOut, Unlink2, Users, X } from "lucide-react"
import { toast } from "sonner"

import { MemberAvatar } from "@/components/member-avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getDisplayName } from "@/domain/member"
import { usePendingNameList } from "@/features/members/use-pending-name-list"
import { cn } from "@/lib/utils"
import type { Member } from "@/types/app.types"

interface MemberDialogProps {
  members: Member[]
  currentUserId: string
  ownerUserId: string
  isOwner: boolean
  isSettled?: boolean
  memberIdsInExpenses: Set<string>
  onRemove: (memberId: string) => void
  onUnclaim: (memberId: string) => void
  onLeave: (memberId: string, onSuccess: () => void) => void
  onAdd: (displayNames: string[], onSuccess: () => void) => void
  trigger?: React.ReactNode
}

export function MemberDialog({
  members,
  currentUserId,
  ownerUserId,
  isOwner,
  isSettled = false,
  memberIdsInExpenses,
  onRemove,
  onUnclaim,
  onLeave,
  onAdd,
  trigger,
}: MemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  const {
    input: pendingInput,
    setInput: setPendingInput,
    names: pendingNames,
    error: pendingError,
    setError: setPendingError,
    handleAdd: handleAddToPending,
    handleRemove: handleRemoveFromPending,
    handleKeyDown,
    resetList: resetPendingList,
    inputRef,
  } = usePendingNameList({
    existingNames: members.map((m) => m.display_name),
  })

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetPendingList()
    }

    setIsOpen(next)
  }

  function handleAddMembers() {
    if (pendingNames.length === 0) {
      return
    }

    onAdd(pendingNames, resetPendingList)
  }

  function handleRequestRemove(member: Member) {
    if (memberIdsInExpenses.has(member.id)) {
      toast.info("此成員已有費用記錄，無法移除")
      return
    }

    setMemberToRemove(member)
  }

  function handleConfirmRemove() {
    if (!memberToRemove) {
      return
    }

    onRemove(memberToRemove.id)
    setMemberToRemove(null)
  }

  function handleConfirmLeave() {
    const selfMember = members.find((m) => m.profile_id === currentUserId)

    if (!selfMember) {
      return
    }

    onLeave(selfMember.id, () => handleOpenChange(false))
    setLeaveConfirmOpen(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="icon-lg">
              <Users />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="flex flex-col overflow-hidden" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>成員</DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 flex-col divide-y divide-border overflow-y-auto">
            {members.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                isSelf={member.profile_id === currentUserId}
                isOwnerMember={member.profile_id === ownerUserId}
                isOwner={isOwner}
                isSettled={isSettled}
                inExpenses={memberIdsInExpenses.has(member.id)}
                onUnclaim={() => onUnclaim(member.id)}
                onRequestRemove={() => handleRequestRemove(member)}
                onLeave={() => setLeaveConfirmOpen(true)}
              />
            ))}
          </div>

          {!isSettled && !isOwner && (
            <DialogFooter>
              <p className="w-full text-center text-xs text-muted-foreground">
                如需新增成員，請通知群組創建人
              </p>
            </DialogFooter>
          )}

          {!isSettled && isOwner && (
            <DialogFooter>
              <div className="flex w-full flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="member">新增成員</Label>
                    <p className={cn("text-xs text-destructive", !pendingError && "invisible")}>
                      {pendingError}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        ref={inputRef}
                        id="member"
                        value={pendingInput}
                        placeholder="蒂娜、雪莉"
                        maxLength={20}
                        onChange={(e) => {
                          setPendingInput(e.target.value)
                          setPendingError("")
                        }}
                        onKeyDown={handleKeyDown}
                      />
                      {pendingInput.length > 10 && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {pendingInput.length}/20
                        </span>
                      )}
                    </div>
                    {pendingInput.trim() && (
                      <Button size="icon-md" onClick={handleAddToPending}>
                        <CornerDownLeft />
                      </Button>
                    )}
                  </div>

                  {pendingNames.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pendingNames.map((name) => (
                        <div key={name} className={badgeVariants({ variant: "secondary" })}>
                          {name}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveFromPending(name)}
                          >
                            <X className="text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {pendingNames.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 text-muted-foreground"
                      onClick={() => handleOpenChange(false)}
                    >
                      取消
                    </Button>
                    <Button className="flex-1" onClick={handleAddMembers}>
                      新增
                    </Button>
                  </div>
                )}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(next) => {
          if (!next) {
            setMemberToRemove(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認移除成員</AlertDialogTitle>
            <AlertDialogDescription>
              確定要移除「{memberToRemove && getDisplayName(memberToRemove)}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove}>確認</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認離開帳本</AlertDialogTitle>
            <AlertDialogDescription>
              離開後，這個身份會變成未認領狀態，之後可以重新認領。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave}>確認離開</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function MemberItem({
  member,
  isSelf,
  isOwnerMember,
  isOwner,
  isSettled,
  inExpenses,
  onUnclaim,
  onRequestRemove,
  onLeave,
}: {
  member: Member
  isSelf: boolean
  isOwnerMember: boolean
  isOwner: boolean
  isSettled: boolean
  inExpenses: boolean
  onUnclaim: () => void
  onRequestRemove: () => void
  onLeave: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <MemberAvatar member={member} />
        <span className="text-base font-normal text-foreground">{getDisplayName(member)}</span>
      </div>

      <div className="flex items-center gap-1">
        {isOwnerMember && <Badge>創建人</Badge>}
        {!isSettled && isOwner && member.profile_id && !isSelf && (
          <Button variant="ghost" size="icon-sm" onClick={onUnclaim}>
            <Unlink2 />
          </Button>
        )}
        {!isSettled && isOwner && !isSelf && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(inExpenses && "opacity-50")}
            onClick={onRequestRemove}
          >
            <CircleMinus />
          </Button>
        )}
        {!isSettled && !isOwner && isSelf && (
          <Button variant="ghost" size="icon-sm" onClick={onLeave}>
            <LogOut />
          </Button>
        )}
      </div>
    </div>
  )
}

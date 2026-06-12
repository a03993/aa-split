"use client"

import { useState } from "react"

import { CornerDownLeft, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createBookSchema } from "@/domain/book"
import type { CreateBookInput } from "@/domain/book/book.repository"
import { usePendingNameList } from "@/features/members/use-pending-name-list"
import { CURRENCIES, type CurrencyCode, DEFAULT_CURRENCY } from "@/lib/currencies"
import { cn } from "@/lib/utils"

const BOOK_NAME_MAX = 20
const MEMBER_NAME_MAX = 20
const SHOW_COUNTER_THRESHOLD = 10

interface CreateBookSheetProps {
  onSubmit: (data: CreateBookInput) => Promise<void>
  currentUserId: string
  currentUserName: string
}

export function CreateBookSheet({
  onSubmit,
  currentUserId,
  currentUserName,
}: CreateBookSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [bookTitle, setBookTitle] = useState("")
  const [bookTitleError, setBookTitleError] = useState("")
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY)

  const {
    input: memberInput,
    setInput: setMemberInput,
    names: pendingNames,
    error,
    setError: setMemberError,
    handleAdd: handleAddMember,
    handleRemove: handleRemovePendingMember,
    handleKeyDown: handleMemberKeyDown,
    resetList: resetPendingList,
    inputRef: memberInputRef,
  } = usePendingNameList({ existingNames: [currentUserName] })

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setBookTitle("")
      setBookTitleError("")
      setCurrency(DEFAULT_CURRENCY)
      resetPendingList()
    }
    setIsOpen(nextOpen)
  }

  async function handleSubmitClick() {
    const result = createBookSchema.safeParse({
      bookTitle: bookTitle.trim(),
      memberNames: pendingNames,
      currency,
    })
    if (!result.success) {
      const titleIssue = result.error.issues.find((issue) => issue.path[0] === "bookTitle")
      setBookTitleError(titleIssue?.message ?? "")
      return
    }
    setBookTitleError("")
    try {
      await onSubmit({
        name: result.data.bookTitle,
        ownerUserId: currentUserId,
        memberNames: result.data.memberNames,
        currency: result.data.currency,
      })
      // 成功後才關閉，確保 mutation 失敗時使用者能看到錯誤
      handleOpenChange(false)
    } catch {
      toast.error("建立帳本失敗，請稍後再試")
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          size="icon-lg"
          className="fixed right-6 z-50 [bottom:max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle>建立帳本</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">帳本名稱</Label>
              <p className="text-sm leading-none text-destructive">{bookTitleError}</p>
            </div>
            <div className="relative">
              <Input
                id="title"
                placeholder="日本旅遊、週五聚餐"
                maxLength={BOOK_NAME_MAX}
                value={bookTitle}
                onChange={(e) => {
                  setBookTitle(e.target.value)
                  setBookTitleError("")
                }}
              />
              <span
                className={cn(
                  "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground",
                  bookTitle.length <= SHOW_COUNTER_THRESHOLD && "invisible",
                )}
              >
                {bookTitle.length}/{BOOK_NAME_MAX}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency">幣別</Label>
            <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} · {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="member">
                成員<span className="text-muted-foreground">(選填)</span>
              </Label>
              <p className="text-sm leading-none text-destructive">{error}</p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={memberInputRef}
                  id="member"
                  placeholder="蒂娜、雪莉"
                  value={memberInput}
                  maxLength={MEMBER_NAME_MAX}
                  onChange={(e) => {
                    setMemberInput(e.target.value)
                    setMemberError("")
                  }}
                  onKeyDown={handleMemberKeyDown}
                />
                {memberInput.length > SHOW_COUNTER_THRESHOLD && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {memberInput.length}/{MEMBER_NAME_MAX}
                  </span>
                )}
              </div>
              {memberInput.trim() && (
                <Button size="icon-md" onClick={handleAddMember}>
                  <CornerDownLeft />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="p-2">
              {currentUserName}
              <span className="text-primary-foreground/50">(你)</span>
            </Badge>

            {pendingNames.map((name) => (
              <div key={name} className={badgeVariants({ variant: "secondary" })}>
                {name}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemovePendingMember(name)}
                >
                  <X className="text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <SheetFooter>
          <Button variant="ghost" className="flex-1" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button className="flex-1" onClick={handleSubmitClick}>
            建立
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

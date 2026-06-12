"use client"

import { useEffect, useState } from "react"

import { format } from "date-fns"
import { Plus } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerDialog } from "@/components/ui/date-picker-dialog"
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
import { TimePickerDialog } from "@/components/ui/time-picker-dialog"
import type { CreateExpenseInput } from "@/domain/expense/expense.repository"
import { CategoryPickerDialog } from "@/features/expenses/components/category-picker-dialog"
import { ParticipantAmountItem } from "@/features/expenses/components/participant-amount-item"
import { SPLIT_MODES, useExpenseForm } from "@/features/expenses/use-expense-form"
import { getCurrencySymbol } from "@/lib/currencies"
import { cn } from "@/lib/utils"
import type { Category, Member } from "@/types/app.types"

interface AddExpenseSheetProps {
  bookId: string
  members: Member[]
  currency: string
  customCategories?: Category[]
  onSubmit: (data: CreateExpenseInput, notifyGroup: boolean) => void
  currentMemberId?: string
  isSettled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function getCurrentTime(): { hour: string; minute: string } {
  const now = new Date()
  return {
    hour: String(now.getHours()).padStart(2, "0"),
    minute: String(now.getMinutes()).padStart(2, "0"),
  }
}

export function AddExpenseSheet({
  bookId,
  members,
  currency,
  customCategories = [],
  onSubmit,
  currentMemberId,
  isSettled = false,
  open,
  onOpenChange,
}: AddExpenseSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = open ?? internalOpen

  function buildInitialFormValues() {
    const today = new Date()
    const nowRounded = getCurrentTime()
    return {
      date: format(today, "yyyy-MM-dd"),
      time: `${nowRounded.hour}:${nowRounded.minute}`,
      category: "",
      title: "",
      amount: undefined as unknown as number,
      payerMemberId: currentMemberId ?? "",
      participantIds: members.map((m) => m.id),
      splitMode: "equal" as const,
    }
  }

  const {
    form,
    splitMode,
    participantIds,
    formDate,
    formTime,
    formCategory,
    formPayerMemberId,
    splitAmounts,
    isNotify,
    setIsNotify,
    pendingCategories,
    setPendingCategories,
    shares,
    manualAmounts,
    toggleParticipant,
    createSplitHandlers,
    buildSubmitPayload,
    resetSplitState,
  } = useExpenseForm({
    defaultValues: buildInitialFormValues(),
    defaultIsNotify: true,
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = form

  // 只在 sheet 開啟時同步一次 participantIds，
  // 不追蹤 members 後續變化，避免用戶調整參與者後被父層 re-render 覆蓋。
  useEffect(() => {
    if (isOpen) {
      setValue(
        "participantIds",
        members.map((m) => m.id),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // formDate 字串轉 Date 物件供 DatePickerDialog 使用
  const dateObj = formDate ? new Date(formDate + "T00:00:00") : new Date()
  const [selectedHour, selectedMinute] = formTime
    ? formTime.split(":")
    : [getCurrentTime().hour, getCurrentTime().minute]

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetSplitState()
      // reset 使用最新的成員與付款人資訊，並重新計算當前時間
      reset({
        ...buildInitialFormValues(),
        payerMemberId: currentMemberId ?? "",
        participantIds: members.map((m) => m.id),
      })
    }
    if (onOpenChange) {
      onOpenChange(nextOpen)
    } else {
      setInternalOpen(nextOpen)
    }
  }

  const handleFormSubmit = handleSubmit((data) => {
    const payload = buildSubmitPayload(data)
    if (!payload) return
    onSubmit(
      {
        bookId,
        title: data.title,
        category: data.category,
        amount: data.amount,
        payerMemberId: data.payerMemberId,
        splitMode: data.splitMode,
        splits: payload.splits,
        date: data.date,
        time: data.time,
        pendingCategory: payload.pendingCategory,
      },
      isNotify,
    )
    handleOpenChange(false)
  })

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button size="icon-lg" disabled={isSettled}>
          <Plus />
        </Button>
      </SheetTrigger>
      <SheetContent
        showCloseButton={false}
        className="h-[90dvh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>新增費用</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="expense-date">日期</Label>
              <DatePickerDialog
                id="expense-date"
                date={dateObj}
                hasError={!!errors.date}
                onConfirm={(newDate) => {
                  setValue("date", format(newDate, "yyyy-MM-dd"), { shouldValidate: true })
                }}
              />
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="expense-time">時間</Label>
              <TimePickerDialog
                id="expense-time"
                hour={selectedHour}
                minute={selectedMinute}
                onConfirm={(h, m) => {
                  setValue("time", `${h}:${m}`, { shouldValidate: true })
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="expense-category">分類</Label>
              <CategoryPickerDialog
                id="expense-category"
                value={formCategory}
                hasError={!!errors.category}
                customCategories={[...customCategories, ...pendingCategories]}
                onConfirm={(val, pending) => {
                  setValue("category", val, { shouldValidate: true })
                  if (pending) setPendingCategories((prev) => [...prev, pending])
                }}
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="flex flex-[2_2_0%] flex-col gap-1.5">
              <Label htmlFor="expense-title">品項</Label>
              <Input
                id="expense-title"
                placeholder="例：午餐、計程車"
                {...register("title")}
                className={cn(errors.title && "border-destructive")}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="expense-payer">付款人</Label>
              <Select
                value={formPayerMemberId}
                onValueChange={(value) =>
                  setValue("payerMemberId", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="expense-payer">
                  <SelectValue placeholder="選擇付款人" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          {member.profile?.avatar_url && (
                            <AvatarImage src={member.profile.avatar_url} />
                          )}
                          <AvatarFallback>
                            {member.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.display_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payerMemberId && (
                <p className="text-xs text-destructive">{errors.payerMemberId.message}</p>
              )}
            </div>

            <div className="flex flex-[2_2_0%] flex-col gap-1.5">
              <Label htmlFor="expense-amount">金額</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  id="expense-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  {...register("amount", { valueAsNumber: true })}
                  className={cn("pl-10", errors.amount && "border-destructive")}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>參與者</Label>
              <div className="flex gap-2">
                {SPLIT_MODES.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={splitMode === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setValue("splitMode", value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {splitMode === "equal" ? (
              <div className="flex flex-row flex-wrap gap-2 py-2">
                {members.map((member) => {
                  const checked = participantIds.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      className="flex flex-col items-center gap-1 rounded-lg p-2 active:bg-muted/50"
                      onClick={() => toggleParticipant(member.id)}
                    >
                      <Avatar
                        className={cn(
                          checked && "ring-2 ring-black ring-offset-1",
                          !checked && "opacity-40",
                        )}
                      >
                        {member.profile?.avatar_url && (
                          <AvatarImage src={member.profile.avatar_url} />
                        )}
                        <AvatarFallback>
                          {member.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn("text-sm", !checked && "text-muted-foreground")}>
                        {member.display_name}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map((member) => {
                  const isManual = manualAmounts[member.id] != null
                  const memberShares = shares[member.id] ?? 1
                  const displayAmount = splitAmounts[member.id] ?? 0
                  const { onShareDecrement, onShareIncrement, onAmountChange } =
                    createSplitHandlers(member.id)
                  return (
                    <ParticipantAmountItem
                      key={member.id}
                      member={member}
                      isParticipant={participantIds.includes(member.id)}
                      isManual={isManual}
                      shares={memberShares}
                      displayAmount={isManual ? (manualAmounts[member.id] ?? 0) : displayAmount}
                      currency={currency}
                      onShareDecrement={onShareDecrement}
                      onShareIncrement={onShareIncrement}
                      onAmountChange={onAmountChange}
                    />
                  )
                })}
              </div>
            )}

            {errors.participantIds && (
              <p className="text-xs text-destructive">{errors.participantIds.message}</p>
            )}
          </div>
        </div>

        <SheetFooter className="flex-col gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="notify-group"
              checked={isNotify}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                setIsNotify(checked === true)
              }
            />
            <Label htmlFor="notify-group" className="cursor-pointer text-sm">
              傳送通知給群組
            </Label>
          </div>

          <div className="flex flex-row gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleFormSubmit}>
              新增
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

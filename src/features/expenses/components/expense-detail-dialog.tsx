"use client"

import { useMemo, useState } from "react"

import { format } from "date-fns"

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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerDialog } from "@/components/ui/date-picker-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimePickerDialog } from "@/components/ui/time-picker-dialog"
import type { UpdateExpenseInput } from "@/domain/expense/expense.repository"
import { getDisplayName } from "@/domain/member"
import { CategoryPickerDialog } from "@/features/expenses/components/category-picker-dialog"
import { CustomSplit, EqualSplit } from "@/features/expenses/components/participant"
import { SPLIT_MODES, useExpenseForm } from "@/features/expenses/use-expense-form"
import { getCategoryIcon, getCategoryLabel } from "@/lib/categories"
import { getCurrencySymbol } from "@/lib/currencies"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"
import type { Category, ExpenseWithDetails, Member } from "@/types/app.types"

interface ExpenseDetailDialogProps {
  expense: ExpenseWithDetails
  members: Member[]
  currency: string
  customCategories?: Category[]
  isSettled: boolean
  isGuest?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (data: UpdateExpenseInput, notifyGroup: boolean) => void
  onDelete?: () => void
}

export function ExpenseDetailDialog({
  expense,
  members,
  currency,
  customCategories = [],
  isSettled,
  isGuest = false,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: ExpenseDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setIsEditing(false)
    }

    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={isGuest || isSettled}>
        {isEditing ? (
          <EditMode
            key={expense.id}
            expense={expense}
            members={members}
            currency={currency}
            customCategories={customCategories}
            onCancel={() => setIsEditing(false)}
            onUpdate={onUpdate}
          />
        ) : (
          <ReadMode
            expense={expense}
            members={members}
            currency={currency}
            customCategories={customCategories}
            isSettled={isSettled}
            isGuest={isGuest}
            onEdit={() => setIsEditing(true)}
            onClose={() => handleOpenChange(false)}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReadMode({
  expense,
  members,
  currency,
  customCategories,
  isSettled,
  isGuest,
  onEdit,
  onClose,
  onDelete,
}: {
  expense: ExpenseWithDetails
  members: Member[]
  currency: string
  customCategories: Category[]
  isSettled: boolean
  isGuest: boolean
  onEdit: () => void
  onClose: () => void
  onDelete?: () => void
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const CategoryIcon = getCategoryIcon(
    customCategories.find((c) => c.key === expense.category)?.icon ?? expense.category,
  )
  const categoryLabel = getCategoryLabel(expense.category, customCategories)
  const timeDisplay = expense.time ? expense.time.slice(0, 5) : ""

  return (
    <>
      <DialogHeader>
        <DialogTitle>{expense.title}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">日期</span>
            <span>{expense.date.replace(/-/g, "/")}</span>
          </div>
          {timeDisplay && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">時間</span>
              <span>{timeDisplay}</span>
            </div>
          )}
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">分類</span>
            <span className="flex items-center gap-1.5">
              <CategoryIcon size={14} />
              {categoryLabel}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">金額</span>
            <span className="font-semibold">
              {formatCurrency(Number(expense.amount), currency)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 text-sm">
          <span className="text-xs text-muted-foreground">付款人</span>
          <span>{getDisplayName(expense.payer)}</span>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="text-xs text-muted-foreground">分攤明細</span>
          {expense.expense_splits
            .filter((split) => Number(split.amount) > 0)
            .map((split) => {
              const member = memberMap.get(split.member_id)
              return (
                <div key={split.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MemberAvatar
                      member={member}
                      fallbackLabel={split.member.display_name}
                      size="sm"
                    />
                    <span>{member ? getDisplayName(member) : split.member.display_name}</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(Number(split.amount), currency)}
                  </span>
                </div>
              )
            })}
        </div>
      </div>

      {!isGuest && !isSettled && (
        <DialogFooter className="flex-col gap-2">
          {onDelete && (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => setIsConfirmingDelete(true)}
            >
              刪除
            </Button>
          )}
          <div className="flex w-full gap-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              關閉
            </Button>
            <Button className="flex-1" onClick={onEdit}>
              編輯
            </Button>
          </div>
        </DialogFooter>
      )}

      <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除費用</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{expense.title}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete?.()}>確定刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function EditMode({
  expense,
  members,
  currency,
  customCategories,
  onCancel,
  onUpdate,
}: {
  expense: ExpenseWithDetails
  members: Member[]
  currency: string
  customCategories: Category[]
  onCancel: () => void
  onUpdate: (data: UpdateExpenseInput, notifyGroup: boolean) => void
}) {
  const initialParticipantIds = expense.expense_splits
    .filter((s) => Number(s.amount) > 0)
    .map((s) => s.member_id)

  // shares != null → 份數模式，還原份數；shares == null → 手動金額，還原 manualAmounts
  const initialShares: Record<string, number> = {}
  const initialManualAmounts: Record<string, number | null> = {}

  if (expense.split_mode === "custom") {
    for (const s of expense.expense_splits) {
      if (Number(s.amount) <= 0) {
        continue
      }

      if (s.shares != null) {
        initialShares[s.member_id] = s.shares
      } else {
        initialManualAmounts[s.member_id] = Number(s.amount)
      }
    }
  }

  const initialTime = expense.time ? expense.time.slice(0, 5) : "00:00"

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
  } = useExpenseForm({
    defaultValues: {
      date: expense.date,
      time: initialTime,
      category: expense.category,
      title: expense.title,
      amount: Number(expense.amount),
      payerMemberId: expense.payer_member_id,
      participantIds: initialParticipantIds,
      splitMode: expense.split_mode,
    },
    initialShares,
    initialManualAmounts,
    defaultIsNotify: false,
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const dateObj = formDate ? new Date(formDate + "T00:00:00") : new Date(expense.date + "T00:00:00")
  const [selectedHour, selectedMinute] = formTime ? formTime.split(":") : initialTime.split(":")

  function handleCategoryConfirm(value: string, newCategory?: Category) {
    setValue("category", value, { shouldValidate: true })

    if (newCategory) {
      setPendingCategories((prev) => [...prev, newCategory])
    }
  }

  const handleFormSubmit = handleSubmit((data) => {
    const payload = buildSubmitPayload(data)

    if (!payload) {
      return
    }

    onUpdate(
      {
        expenseId: expense.id,
        bookId: expense.book_id,
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

    onCancel()
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>編輯費用</DialogTitle>
      </DialogHeader>

      <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="edit-expense-date">日期</Label>
            <DatePickerDialog
              id="edit-expense-date"
              date={dateObj}
              hasError={!!errors.date}
              onConfirm={(newDate) => {
                setValue("date", format(newDate, "yyyy-MM-dd"), { shouldValidate: true })
              }}
            />
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="edit-expense-time">時間</Label>
            <TimePickerDialog
              id="edit-expense-time"
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
            <Label htmlFor="edit-expense-category">分類</Label>
            <CategoryPickerDialog
              id="edit-expense-category"
              value={formCategory}
              customCategories={[...customCategories, ...pendingCategories]}
              onConfirm={handleCategoryConfirm}
            />
          </div>

          <div className="flex flex-[2_2_0%] flex-col gap-1.5">
            <Label htmlFor="edit-expense-title">品項</Label>
            <Input
              id="edit-expense-title"
              placeholder="例：午餐、計程車"
              {...register("title")}
              className={cn(errors.title && "border-destructive")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="edit-expense-payer">付款人</Label>
            <Select
              value={formPayerMemberId}
              onValueChange={(value) => setValue("payerMemberId", value, { shouldValidate: true })}
            >
              <SelectTrigger id="edit-expense-payer">
                <SelectValue placeholder="選擇付款人" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <MemberAvatar member={member} size="sm" />
                      {getDisplayName(member)}
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
            <Label htmlFor="edit-expense-amount">金額</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                id="edit-expense-amount"
                type="number"
                inputMode="decimal"
                placeholder="0"
                min={0}
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
                  type="button"
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
              {members.map((member) => (
                <EqualSplit
                  key={member.id}
                  member={member}
                  checked={participantIds.includes(member.id)}
                  onToggle={() => toggleParticipant(member.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((member) => (
                <CustomSplit
                  key={member.id}
                  member={member}
                  isParticipant={participantIds.includes(member.id)}
                  manualAmount={manualAmounts[member.id]}
                  shares={shares[member.id] ?? 1}
                  displayAmount={splitAmounts[member.id] ?? 0}
                  currency={currency}
                  createSplitHandlers={createSplitHandlers}
                />
              ))}
            </div>
          )}

          {errors.participantIds && (
            <p className="text-xs text-destructive">{errors.participantIds.message}</p>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-notify-group"
              checked={isNotify}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                setIsNotify(checked === true)
              }
            />
            <Label htmlFor="edit-notify-group" className="cursor-pointer text-sm">
              傳送通知給群組
            </Label>
          </div>

          <div className="flex flex-row gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" className="flex-1">
              儲存
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  )
}

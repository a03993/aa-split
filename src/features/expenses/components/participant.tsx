"use client"

import { useState } from "react"

import { Minus, Plus } from "lucide-react"

import { MemberAvatar } from "@/components/member-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getDisplayName } from "@/domain/member"
import type { useExpenseForm } from "@/features/expenses/use-expense-form"
import { getCurrencySymbol } from "@/lib/currencies"
import { cn } from "@/lib/utils"
import type { Member } from "@/types/app.types"

export function EqualSplit({
  member,
  checked,
  onToggle,
}: {
  member: Member
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 rounded-lg p-2 active:bg-muted/50"
      onClick={onToggle}
    >
      <MemberAvatar
        member={member}
        className={cn(checked && "ring-2 ring-black ring-offset-1", !checked && "opacity-40")}
      />
      <span className={cn("text-sm", !checked && "text-muted-foreground")}>
        {getDisplayName(member)}
      </span>
    </button>
  )
}

export function CustomSplit({
  member,
  isParticipant,
  manualAmount,
  shares,
  displayAmount,
  currency,
  createSplitHandlers,
}: {
  member: Member
  isParticipant: boolean
  manualAmount: number | null | undefined
  shares: number
  displayAmount: number
  currency: string
  createSplitHandlers: ReturnType<typeof useExpenseForm>["createSplitHandlers"]
}) {
  const isManual = manualAmount != null
  const { onShareDecrement, onShareIncrement, onAmountChange } = createSplitHandlers(member.id)

  return (
    <AmountItem
      member={member}
      isParticipant={isParticipant}
      isManual={isManual}
      shares={shares}
      displayAmount={isManual ? (manualAmount ?? 0) : displayAmount}
      currency={currency}
      onShareDecrement={onShareDecrement}
      onShareIncrement={onShareIncrement}
      onAmountChange={onAmountChange}
    />
  )
}

function AmountItem({
  member,
  isParticipant,
  isManual,
  shares,
  displayAmount,
  currency,
  onShareDecrement,
  onShareIncrement,
  onAmountChange,
}: {
  member: Member
  isParticipant: boolean
  isManual: boolean
  shares: number
  displayAmount: number
  currency: string
  onShareDecrement: () => void
  onShareIncrement: () => void
  onAmountChange: (val: number | null) => void
}) {
  const [prevValue, setPrevValue] = useState<string | null>(null)

  const value = prevValue !== null ? prevValue : displayAmount > 0 ? String(displayAmount) : ""

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parsedAmount = parseFloat(e.target.value)

    setPrevValue(e.target.value)
    onAmountChange(isNaN(parsedAmount) ? null : parsedAmount)
  }

  function handleBlur() {
    setPrevValue(null)
  }

  return (
    <div className="flex w-full items-center gap-2 rounded-lg pl-2">
      <MemberAvatar
        member={member}
        size="sm"
        className={cn(
          isParticipant && "ring-2 ring-black ring-offset-1",
          !isParticipant && "opacity-40",
        )}
      />
      <span className={cn("flex-1 truncate text-sm", !isParticipant && "opacity-40")}>
        {getDisplayName(member)}
      </span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={onShareDecrement}>
            <Minus />
          </Button>
          <span
            className={cn("w-5 text-center text-sm", !isParticipant && "text-muted-foreground")}
          >
            {!isParticipant ? 0 : isManual ? "—" : shares}
          </span>
          <Button type="button" variant="secondary" onClick={onShareIncrement}>
            <Plus />
          </Button>
        </div>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {getCurrencySymbol(currency)}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
            className={cn(
              "w-24 pl-10 text-right",
              !isManual && "text-muted-foreground/50",
              !isParticipant && "text-muted-foreground",
            )}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>
      </div>
    </div>
  )
}

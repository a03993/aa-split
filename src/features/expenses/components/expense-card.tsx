"use client"

import { getCategoryIcon } from "@/lib/categories"
import { formatCurrency } from "@/lib/format-currency"
import type { Category, ExpenseWithDetails } from "@/types/app.types"

interface ExpenseCardProps {
  expense: ExpenseWithDetails
  currentMemberId: string | undefined
  currency: string
  customCategories?: Category[]
  onClick?: () => void
}

export function ExpenseCard({
  expense,
  currentMemberId,
  currency,
  customCategories = [],
  onClick,
}: ExpenseCardProps) {
  const memberShare = currentMemberId
    ? expense.expense_splits.find((split) => split.member_id === currentMemberId)?.amount
    : undefined

  const CategoryIcon = getCategoryIcon(
    customCategories.find((category) => category.key === expense.category)?.icon ??
      expense.category,
  )

  return (
    <button
      className="flex w-full items-center gap-3 border-b border-border py-3 text-left active:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CategoryIcon size={20} />
      </div>

      <div className="flex-1">
        <p className="truncate font-medium text-foreground">{expense.title}</p>
        <p className="text-xs text-muted-foreground">{expense.payer.display_name} 付</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold text-foreground">{formatCurrency(expense.amount, currency)}</p>
        {memberShare !== undefined && (
          <p className="text-xs text-muted-foreground">
            你的分攤: {formatCurrency(memberShare, currency)}
          </p>
        )}
      </div>
    </button>
  )
}

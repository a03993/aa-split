"use client"

import { useState } from "react"

import { Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CreateExpenseInput } from "@/domain/expense/expense.repository"
import { AddExpenseSheet } from "@/features/expenses/components/add-expense-sheet"
import { SettlementSheet } from "@/features/settlements/components/settlement-sheet"
import type { SettlementPlan } from "@/features/settlements/settlements.service"
import type { BookWithMembers, Category, ExpenseWithDetails, Member } from "@/types/app.types"

import { ExpenseListSheet } from "./expense-list-sheet"

interface ToolbarProps {
  isSettled: boolean
  bookId: string
  members: Member[]
  customCategories?: Category[]
  currentMemberId?: string
  onAddExpense: (data: CreateExpenseInput, notifyGroup: boolean) => void
  book: BookWithMembers
  expenses: ExpenseWithDetails[]
  settlementPlan: SettlementPlan
  settledCurrency?: string | null
  settledExchangeRate?: number | null
  onSettleConfirm: (settlementCurrency?: string, exchangeRate?: number) => Promise<void> | void
  onSelectExpense: (expense: ExpenseWithDetails) => void
  onShare: () => void
}

export function Toolbar({
  isSettled,
  bookId,
  members,
  customCategories,
  currentMemberId,
  onAddExpense,
  book,
  expenses,
  settlementPlan,
  settledCurrency,
  settledExchangeRate,
  onSettleConfirm,
  onSelectExpense,
  onShare,
}: ToolbarProps) {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)

  return (
    <div className="fixed inset-x-0 z-50 flex place-content-evenly [bottom:max(1.5rem,env(safe-area-inset-bottom))]">
      <AddExpenseSheet
        bookId={bookId}
        members={members}
        currency={book.currency}
        customCategories={customCategories}
        currentMemberId={currentMemberId}
        isSettled={isSettled}
        open={isAddExpenseOpen}
        onSubmit={onAddExpense}
        onOpenChange={setIsAddExpenseOpen}
      />
      <ExpenseListSheet
        book={book}
        expenses={expenses}
        currentMemberId={currentMemberId}
        onSelectExpense={onSelectExpense}
        onAddExpense={() => setIsAddExpenseOpen(true)}
      />
      <SettlementSheet
        members={members}
        balances={settlementPlan.balances}
        transfers={settlementPlan.transfers}
        currency={book.currency}
        isSettled={isSettled}
        settledCurrency={settledCurrency}
        settledExchangeRate={settledExchangeRate}
        onConfirm={onSettleConfirm}
      />

      <Button size="icon-lg" className="flex-col" onClick={onShare}>
        <Share2 />
      </Button>
    </div>
  )
}

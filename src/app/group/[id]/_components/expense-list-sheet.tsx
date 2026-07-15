"use client"

import { useMemo, useState } from "react"

import { format, parseISO } from "date-fns"
import { List } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CategorySelect } from "@/features/expenses/components/category-select"
import { ExpenseCard } from "@/features/expenses/components/expense-card"
import { DEFAULT_CATEGORIES } from "@/lib/categories"
import type { BookWithMembers, ExpenseWithDetails } from "@/types/app.types"

interface ExpenseListSheetProps {
  book: BookWithMembers
  expenses: ExpenseWithDetails[]
  currentMemberId?: string
  isGuest?: boolean
  isSettled?: boolean
  onSelectExpense: (expense: ExpenseWithDetails) => void
  onAddExpense: () => void
}

export function ExpenseListSheet({
  book,
  expenses,
  currentMemberId,
  isGuest = false,
  isSettled = false,
  onSelectExpense,
  onAddExpense,
}: ExpenseListSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const customKeys = book.custom_categories.map((c) => c.key)
    return [...DEFAULT_CATEGORIES.map((c) => c.key), ...customKeys]
  }, [book.custom_categories])

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === null) {
      return expenses
    }

    return expenses.filter((e) => e.category === selectedCategory)
  }, [expenses, selectedCategory])

  const groupedExpenses = useMemo(() => {
    const map = new Map<string, typeof filteredExpenses>()

    for (const expense of filteredExpenses) {
      if (!map.has(expense.date)) {
        map.set(expense.date, [])
      }

      map.get(expense.date)!.push(expense)
    }

    for (const group of map.values()) {
      group.sort((a, b) => (b.time ?? "").localeCompare(a.time ?? ""))
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, group]) => ({
        date,
        displayDate: format(parseISO(date), "yyyy/MM/dd"),
        expenses: group,
      }))
  }, [filteredExpenses])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon-lg">
          <List />
        </Button>
      </SheetTrigger>
      <SheetContent showCloseButton={isGuest || isSettled} className="h-[90dvh]">
        <SheetHeader>
          <SheetTitle>帳單列表</SheetTitle>
          <CategorySelect
            categories={categories}
            value={selectedCategory}
            customCategories={book.custom_categories}
            onValueChange={setSelectedCategory}
          />
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col">
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-sm text-muted-foreground">
                  {expenses.length === 0 ? "還沒有費用，點擊 + 新增第一筆" : "此分類沒有費用"}
                </p>
              </div>
            ) : (
              groupedExpenses.map(({ date, displayDate, expenses: dailyExpenses }) => (
                <div key={date}>
                  <p className="px-1 pb-1 pt-4 text-xs text-muted-foreground">{displayDate}</p>
                  {dailyExpenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      currentMemberId={currentMemberId}
                      currency={book.currency}
                      customCategories={book.custom_categories}
                      onClick={() => onSelectExpense(expense)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
        {!isGuest && !isSettled && (
          <SheetFooter>
            <Button variant="ghost" className="flex-1" onClick={() => setIsOpen(false)}>
              關閉
            </Button>
            <Button className="flex-1" onClick={onAddExpense}>
              新增帳單
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

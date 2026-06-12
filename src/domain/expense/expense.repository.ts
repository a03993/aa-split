import type { Category, ExpenseRow, ExpenseWithDetails, SplitMode } from "@/types/app.types"

export interface CreateExpenseInput {
  bookId: string
  title: string
  category: string
  amount: number
  payerMemberId: string
  splitMode: SplitMode
  splits: Array<{ memberId: string; amount: number; shares: number | null }>
  date: string
  time?: string
  pendingCategory?: Category
}

export interface UpdateExpenseInput extends CreateExpenseInput {
  expenseId: string
}

export interface ExpenseRepository {
  findByBookId(bookId: string): Promise<ExpenseWithDetails[]>
  create(data: CreateExpenseInput): Promise<ExpenseRow>
  update(data: UpdateExpenseInput): Promise<ExpenseRow>
  delete(expenseId: string): Promise<void>
}

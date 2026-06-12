import type {
  CreateExpenseInput,
  ExpenseRepository,
  UpdateExpenseInput,
} from "@/domain/expense/expense.repository"
import type {
  Category,
  ExpenseRow,
  ExpenseSplitRow,
  ExpenseWithDetails,
  MemberRow,
} from "@/types/app.types"

import { _mockBooks, _mockMembers } from "./book.repository"
import { MOCK_EXPENSES, MOCK_EXPENSE_SPLITS } from "./mock-data"

const expenses: ExpenseRow[] = MOCK_EXPENSES.map((e) => ({ ...e }))
const splits: ExpenseSplitRow[] = MOCK_EXPENSE_SPLITS.map((s) => ({ ...s }))
const members: MemberRow[] = _mockMembers

function delay(): Promise<void> {
  return new Promise((r) => setTimeout(r, 50))
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function applyPendingCategory(bookId: string, category: Category): void {
  const book = _mockBooks.find((b) => b.id === bookId)
  if (!book) return
  book.custom_categories = [...book.custom_categories, category]
}

function requireMember(memberId: string): MemberRow {
  const member = members.find((m) => m.id === memberId)
  if (!member) {
    throw new Error(`MockExpenseRepository: member "${memberId}" not found`)
  }
  return member
}

function buildExpenseWithDetails(expense: ExpenseRow): ExpenseWithDetails {
  const payer = requireMember(expense.payer_member_id)
  const expenseSplits = splits
    .filter((s) => s.expense_id === expense.id)
    .map((s) => ({
      ...s,
      member: requireMember(s.member_id),
    }))
  return {
    ...expense,
    payer,
    expense_splits: expenseSplits,
  }
}

export class MockExpenseRepository implements ExpenseRepository {
  async findByBookId(bookId: string): Promise<ExpenseWithDetails[]> {
    await delay()
    return expenses
      .filter((e) => e.book_id === bookId)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.created_at.localeCompare(a.created_at)
      })
      .map(buildExpenseWithDetails)
  }

  async create(data: CreateExpenseInput): Promise<ExpenseRow> {
    await delay()
    const now = new Date().toISOString()
    const newExpense: ExpenseRow = {
      id: generateId("mock-expense"),
      book_id: data.bookId,
      title: data.title,
      category: data.category,
      amount: data.amount,
      payer_member_id: data.payerMemberId,
      split_mode: data.splitMode,
      date: data.date,
      time: data.time ?? new Date().toTimeString().slice(0, 8),
      created_at: now,
      updated_at: now,
    }
    expenses.push(newExpense)

    for (const split of data.splits) {
      const newSplit: ExpenseSplitRow = {
        id: generateId("mock-split"),
        expense_id: newExpense.id,
        member_id: split.memberId,
        amount: split.amount,
        shares: split.shares,
        created_at: now,
      }
      splits.push(newSplit)
    }

    if (data.pendingCategory) applyPendingCategory(data.bookId, data.pendingCategory)

    return { ...newExpense }
  }

  async update(data: UpdateExpenseInput): Promise<ExpenseRow> {
    await delay()
    const expenseIndex = expenses.findIndex((e) => e.id === data.expenseId)
    if (expenseIndex === -1) {
      throw new Error(`MockExpenseRepository: expense "${data.expenseId}" not found`)
    }

    const now = new Date().toISOString()
    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      title: data.title,
      category: data.category,
      amount: data.amount,
      payer_member_id: data.payerMemberId,
      split_mode: data.splitMode,
      date: data.date,
      time: data.time ?? new Date().toTimeString().slice(0, 8),
      updated_at: now,
    }

    let i = splits.length - 1
    while (i >= 0) {
      if (splits[i].expense_id === data.expenseId) {
        splits.splice(i, 1)
      }
      i -= 1
    }

    for (const split of data.splits) {
      splits.push({
        id: generateId("mock-split"),
        expense_id: data.expenseId,
        member_id: split.memberId,
        amount: split.amount,
        shares: split.shares,
        created_at: now,
      })
    }

    if (data.pendingCategory) applyPendingCategory(data.bookId, data.pendingCategory)

    return { ...expenses[expenseIndex] }
  }

  async delete(expenseId: string): Promise<void> {
    await delay()
    const expenseIndex = expenses.findIndex((e) => e.id === expenseId)
    if (expenseIndex === -1) {
      throw new Error(`MockExpenseRepository: expense "${expenseId}" not found`)
    }
    expenses.splice(expenseIndex, 1)

    let i = splits.length - 1
    while (i >= 0) {
      if (splits[i].expense_id === expenseId) {
        splits.splice(i, 1)
      }
      i -= 1
    }
  }
}

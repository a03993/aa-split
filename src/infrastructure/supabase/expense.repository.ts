import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  CreateExpenseInput,
  ExpenseRepository,
  UpdateExpenseInput,
} from "@/domain/expense/expense.repository"
import type { ExpenseRow, ExpenseWithDetails } from "@/types/app.types"
import type { Database } from "@/types/database.types"

function toSplitsJson(splits: Array<{ memberId: string; amount: number; shares: number | null }>) {
  return splits.map((s) => ({ memberId: s.memberId, amount: s.amount, shares: s.shares }))
}

export class SupabaseExpenseRepository implements ExpenseRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByBookId(bookId: string): Promise<ExpenseWithDetails[]> {
    const { data, error } = await this.supabase
      .from("expenses")
      .select(
        `
        *,
        payer:members!expenses_payer_member_id_fkey (*),
        expense_splits (
          *,
          member:members!expense_splits_member_id_fkey (*)
        )
      `,
      )
      .eq("book_id", bookId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch expenses for book "${bookId}": ${error.message}`)
    }

    return (data ?? []) as ExpenseWithDetails[]
  }

  async create(data: CreateExpenseInput): Promise<ExpenseRow> {
    const splitsJson = toSplitsJson(data.splits)

    const { data: expenseId, error } = await this.supabase.rpc("create_expense_with_category", {
      p_book_id: data.bookId,
      p_title: data.title,
      p_category: data.category,
      p_amount: data.amount,
      p_payer_member_id: data.payerMemberId,
      p_split_mode: data.splitMode,
      p_date: data.date,
      p_time: data.time ?? new Date().toTimeString().slice(0, 8),
      p_splits: splitsJson,
      p_pending_category: data.pendingCategory ?? null,
    })

    if (error || !expenseId) {
      throw new Error(`Failed to create expense "${data.title}": ${error?.message}`)
    }

    const { data: expenseRow, error: fetchError } = await this.supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .single()

    if (fetchError || !expenseRow) {
      throw new Error(`Failed to fetch created expense "${expenseId}": ${fetchError?.message}`)
    }

    return expenseRow
  }

  async update(data: UpdateExpenseInput): Promise<ExpenseRow> {
    const splitsJson = toSplitsJson(data.splits)

    const { error } = await this.supabase.rpc("update_expense_with_category", {
      p_expense_id: data.expenseId,
      p_book_id: data.bookId,
      p_title: data.title,
      p_category: data.category,
      p_amount: data.amount,
      p_payer_member_id: data.payerMemberId,
      p_split_mode: data.splitMode,
      p_date: data.date,
      p_time: data.time ?? new Date().toTimeString().slice(0, 8),
      p_splits: splitsJson,
      p_pending_category: data.pendingCategory ?? null,
    })

    if (error) {
      throw new Error(`Failed to update expense "${data.expenseId}": ${error.message}`)
    }

    const { data: expenseRow, error: fetchError } = await this.supabase
      .from("expenses")
      .select("*")
      .eq("id", data.expenseId)
      .single()

    if (fetchError || !expenseRow) {
      throw new Error(`Failed to fetch updated expense "${data.expenseId}": ${fetchError?.message}`)
    }

    return expenseRow
  }

  async delete(expenseId: string): Promise<void> {
    // expense_splits 由資料庫 schema 的 ON DELETE CASCADE 自動刪除，無需手動清理。
    const { error } = await this.supabase.from("expenses").delete().eq("id", expenseId)

    if (error) {
      throw new Error(`Failed to delete expense "${expenseId}": ${error.message}`)
    }
  }
}

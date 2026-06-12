import type { SupabaseClient } from "@supabase/supabase-js"

import type { SettlementRepository } from "@/domain/settlement/settlement.repository"
import type { SettlementInsert, SettlementRow } from "@/types/app.types"
import type { Database } from "@/types/database.types"

export class SupabaseSettlementRepository implements SettlementRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByBookId(bookId: string): Promise<SettlementRow[]> {
    const { data, error } = await this.supabase
      .from("settlements")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch settlements for book "${bookId}": ${error.message}`)
    }

    return data ?? []
  }

  async createBatch(settlements: SettlementInsert[]): Promise<SettlementRow[]> {
    if (settlements.length === 0) {
      return []
    }

    const { data, error } = await this.supabase.from("settlements").insert(settlements).select()

    if (error || !data) {
      throw new Error(`Failed to batch-insert settlements: ${error?.message}`)
    }

    return data
  }
}

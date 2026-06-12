import type { SupabaseClient } from "@supabase/supabase-js"

import type { BookRepository, CreateBookInput } from "@/domain/book/book.repository"
import type {
  BookRow,
  BookWithMembers,
  Category,
  MemberInsert,
  SettlementInsert,
} from "@/types/app.types"
import type { Database } from "@/types/database.types"

export class SupabaseBookRepository implements BookRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<BookWithMembers | null> {
    const { data, error } = await this.supabase
      .from("books")
      .select(
        `
        *,
        members (*, profile:profiles!members_profile_id_fkey (*))
      `,
      )
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Failed to fetch book by id "${id}": ${error.message}`)
    }

    return data as BookWithMembers
  }

  async findByUserId(userId: string): Promise<BookWithMembers[]> {
    const { data: memberRows, error: memberError } = await this.supabase
      .from("members")
      .select("book_id")
      .eq("profile_id", userId)

    if (memberError) {
      throw new Error(
        `Failed to fetch member book ids for user "${userId}": ${memberError.message}`,
      )
    }

    if (!memberRows || memberRows.length === 0) {
      return []
    }

    const bookIds = memberRows.map((m) => m.book_id)

    const { data, error } = await this.supabase
      .from("books")
      .select(
        `
        *,
        members (*, profile:profiles!members_profile_id_fkey (*))
      `,
      )
      .in("id", bookIds)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch books for user "${userId}": ${error.message}`)
    }

    return (data ?? []) as BookWithMembers[]
  }

  async create(data: CreateBookInput): Promise<BookRow> {
    const { data: bookRow, error: bookError } = await this.supabase
      .from("books")
      .insert({
        name: data.name,
        owner_id: data.ownerUserId,
        currency: data.currency,
      })
      .select()
      .single()

    if (bookError || !bookRow) {
      throw new Error(`Failed to create book "${data.name}": ${bookError?.message}`)
    }

    const { data: ownerUser, error: userError } = await this.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", data.ownerUserId)
      .single()

    if (userError || !ownerUser) {
      throw new Error(
        `Failed to fetch owner profile for user "${data.ownerUserId}": ${userError?.message}`,
      )
    }

    const memberInserts: MemberInsert[] = [
      {
        book_id: bookRow.id,
        display_name: ownerUser.display_name,
        profile_id: data.ownerUserId,
      },
      ...data.memberNames.map((name) => ({
        book_id: bookRow.id,
        display_name: name,
        profile_id: null,
      })),
    ]

    const { error: membersError } = await this.supabase.from("members").insert(memberInserts)

    if (membersError) {
      // Rollback：刪除已建立的孤兒 book，確保資料庫維持一致狀態。
      // 注意：若 rollback 的 delete 本身失敗，錯誤會被記錄但不會再次拋出，
      // 以避免隱藏原始的 members insert 錯誤。孤兒 book 需人工清理。
      const { error: rollbackError } = await this.supabase
        .from("books")
        .delete()
        .eq("id", bookRow.id)
      if (rollbackError) {
        console.error(
          `[book.create] Rollback 失敗，孤兒 book "${bookRow.id}" 需人工清理:`,
          rollbackError,
        )
      }
      throw new Error(`Failed to create members for book "${bookRow.id}": ${membersError.message}`)
    }

    return bookRow as BookRow
  }

  async settle(bookId: string, settlements: SettlementInsert[]): Promise<void> {
    const { error: updateError } = await this.supabase
      .from("books")
      .update({
        settled_at: new Date().toISOString(),
      })
      .eq("id", bookId)

    if (updateError) {
      throw new Error(`Failed to mark book "${bookId}" as settled: ${updateError.message}`)
    }

    if (settlements.length > 0) {
      const { error: settlementsError } = await this.supabase
        .from("settlements")
        .insert(settlements)

      if (settlementsError) {
        // Rollback：將 settled_at 設回 null，確保 book 狀態與 settlement 資料一致。
        const { error: rollbackError } = await this.supabase
          .from("books")
          .update({ settled_at: null })
          .eq("id", bookId)
        if (rollbackError) {
          console.error(
            `[book.settle] Rollback 失敗，bookId="${bookId}" 已標記結算但無結算資料:`,
            rollbackError,
          )
        }
        throw new Error(
          `Failed to insert settlements for book "${bookId}": ${settlementsError.message}`,
        )
      }
    }
  }

  async addCategory(bookId: string, category: Category): Promise<BookRow> {
    const { data: existing, error: fetchError } = await this.supabase
      .from("books")
      .select("custom_categories, updated_at")
      .eq("id", bookId)
      .single()

    if (fetchError || !existing) {
      throw new Error(`Failed to fetch book "${bookId}" for addCategory: ${fetchError?.message}`)
    }

    const current = existing.custom_categories as Category[]

    // 注意：此處未驗證 category.key 是否已存在，呼叫端（UI 層）應確保不重複新增相同 key。
    const updated = [...current, category]

    // 樂觀鎖定：僅在 updated_at 未變更時才寫入，
    // 防止多人同時新增自訂分類時發生後寫覆蓋前寫（last-write-wins）的 race condition。
    // 若 update 因版本衝突回傳 null（0 rows affected），拋出錯誤提示呼叫端重試。
    const { data: updatedBook, error: updateError } = await this.supabase
      .from("books")
      .update({ custom_categories: updated })
      .eq("id", bookId)
      .eq("updated_at", existing.updated_at)
      .select()
      .maybeSingle()

    if (updateError) {
      throw new Error(
        `Failed to update custom_categories for book "${bookId}": ${updateError.message}`,
      )
    }

    if (!updatedBook) {
      throw new Error(
        `Failed to update custom_categories for book "${bookId}": 資料已被其他人修改，請重試`,
      )
    }

    return updatedBook as BookRow
  }
}

import type { SupabaseClient } from "@supabase/supabase-js"

import type { MemberRepository } from "@/domain/member/member.repository"
import type { Member, MemberRow } from "@/types/app.types"
import type { Database } from "@/types/database.types"

export class SupabaseMemberRepository implements MemberRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByBookId(bookId: string): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from("members")
      .select(
        `
        *,
        profile:profiles!members_profile_id_fkey (*)
      `,
      )
      .eq("book_id", bookId)
      .order("created_at", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch members for book "${bookId}": ${error.message}`)
    }

    return (data ?? []) as Member[]
  }

  async claim(memberId: string): Promise<MemberRow> {
    // 安全設計：userId 由伺服器端從 Supabase session 取得，不接受客戶端傳入的值。
    // 此做法防止攻擊者偽造請求，將任意 userId 綁定到不屬於自己的 member slot。
    // RLS policy「members: update by owner or self」會進一步在資料庫層確認操作合法性。
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Cannot claim member: no authenticated user")
    }

    const { data, error } = await this.supabase
      .from("members")
      .update({ profile_id: user.id })
      .eq("id", memberId)
      .select()
      .single()

    if (error || !data) {
      // data 為 null 但 error 為 undefined 時，通常是 RLS 拒絕此操作（找不到符合條件的資料列）。
      // 可能原因：memberId 不存在、已被他人認領、或目前用戶不是帳本成員。
      throw new Error(
        `Failed to claim member "${memberId}": ${error?.message ?? "RLS 拒絕或資料列不存在"}`,
      )
    }

    return data
  }

  async addMember(bookId: string, displayName: string): Promise<MemberRow> {
    const { data, error } = await this.supabase
      .from("members")
      .insert({
        book_id: bookId,
        display_name: displayName,
        profile_id: null,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(
        `Failed to add member "${displayName}" to book "${bookId}": ${error?.message}`,
      )
    }

    return data
  }

  async removeMember(memberId: string): Promise<void> {
    const { error } = await this.supabase.from("members").delete().eq("id", memberId)

    if (error) {
      throw new Error(`Failed to remove member "${memberId}": ${error.message}`)
    }
  }

  async unclaim(memberId: string): Promise<MemberRow> {
    const { data, error } = await this.supabase
      .from("members")
      .update({ profile_id: null })
      .eq("id", memberId)
      .select()
      .single()

    if (error || !data) {
      // data 為 null 但 error 為 undefined 時，通常是 RLS 拒絕此操作。
      throw new Error(
        `Failed to unclaim member "${memberId}": ${error?.message ?? "RLS 拒絕或資料列不存在"}`,
      )
    }

    return data
  }
}

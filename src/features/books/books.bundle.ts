import type { SupabaseClient } from "@supabase/supabase-js"

import {
  createBookRepository,
  createExpenseRepository,
  createMemberRepository,
  createSettlementRepository,
} from "@/infrastructure/repository.factory"
import type { BookBundle } from "@/types/app.types"
import type { Database } from "@/types/database.types"

// 本地開發（mock repository）沒有合併查詢 RPC 可用，退回平行呼叫各 repository（皆為記憶體操作，無網路成本）。
export async function fetchBookBundleLocal(bookId: string): Promise<BookBundle> {
  const [book, members, expenses, settlements] = await Promise.all([
    createBookRepository().findById(bookId),
    createMemberRepository().findByBookId(bookId),
    createExpenseRepository().findByBookId(bookId),
    createSettlementRepository().findByBookId(bookId),
  ])

  return { book, members, expenses, settlements }
}

// 一次取得帳本詳情頁所需的全部資料，取代 useBook + useMembers + useExpenses + useSettlements
// 各自獨立的 4 次 round trip。client/server 端各自傳入對應的 supabase client 呼叫這裡。
export async function fetchBookBundleRpc(
  supabase: SupabaseClient<Database>,
  bookId: string,
): Promise<BookBundle> {
  const { data, error } = await supabase.rpc("get_book_bundle", { p_book_id: bookId })

  if (error) {
    throw new Error(`Failed to fetch book bundle "${bookId}": ${error.message}`)
  }

  return (data ?? {
    book: null,
    members: [],
    expenses: [],
    settlements: [],
  }) as unknown as BookBundle
}

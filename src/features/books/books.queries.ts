"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateBookInput } from "@/domain/book/book.repository"
import { settlementKeys } from "@/features/settlements/settlements.queries"
import {
  createBookRepository,
  createExpenseRepository,
  createMemberRepository,
  createSettlementRepository,
} from "@/infrastructure/repository.factory"
import type {
  BookRow,
  BookWithMembers,
  Category,
  ExpenseWithDetails,
  Member,
  MemberRow,
  SettlementRow,
} from "@/types/app.types"

import { BookService } from "./books.service"

export const bookKeys = {
  all: ["books"] as const,
  byUser: (userId: string) => ["books", "user", userId] as const,
  detail: (bookId: string) => ["books", bookId] as const,
  bundle: (bookId: string) => ["books", "bundle", bookId] as const,
}

// 每次 queryFn 或 mutationFn 呼叫時建立新實例，避免 stale closure 問題
function createBookService(): BookService {
  const repo = createBookRepository()
  return new BookService(repo)
}

const IS_LOCAL = process.env.NEXT_PUBLIC_ENV === "local" && process.env.NODE_ENV !== "production"

export interface BookBundle {
  book: BookWithMembers | null
  members: Member[]
  expenses: ExpenseWithDetails[]
  settlements: SettlementRow[]
}

/**
 * 一次取得帳本詳情頁所需的全部資料，取代 useBook + useMembers + useExpenses + useSettlements
 * 各自獨立的 4 次 round trip。
 * 本地開發（mock repository）沒有合併查詢 RPC 可用，退回平行呼叫各 repository（皆為記憶體操作，無網路成本）。
 */
async function fetchBookBundle(bookId: string): Promise<BookBundle> {
  if (IS_LOCAL) {
    const [book, members, expenses, settlements] = await Promise.all([
      createBookRepository().findById(bookId),
      createMemberRepository().findByBookId(bookId),
      createExpenseRepository().findByBookId(bookId),
      createSettlementRepository().findByBookId(bookId),
    ])
    return { book, members, expenses, settlements }
  }

  const { createClient } = await import("@/lib/supabase/client")
  const supabase = createClient()
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

export function useBookBundle(bookId: string | undefined) {
  return useQuery<BookBundle, Error>({
    queryKey: bookKeys.bundle(bookId ?? ""),
    queryFn: () => fetchBookBundle(bookId!),
    enabled: !!bookId,
  })
}

export function useUserBooks(userId: string | undefined) {
  return useQuery<BookWithMembers[], Error>({
    queryKey: bookKeys.byUser(userId ?? ""),
    queryFn: async () => {
      const service = createBookService()
      return service.getUserBooks(userId!)
    },
    enabled: !!userId,
  })
}

export function useBook(bookId: string | undefined) {
  return useQuery<BookWithMembers | null, Error>({
    queryKey: bookKeys.detail(bookId ?? ""),
    queryFn: async () => {
      const service = createBookService()
      return service.getBook(bookId!)
    },
    enabled: !!bookId,
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()

  return useMutation<BookRow, Error, CreateBookInput>({
    mutationFn: async (input) => {
      const service = createBookService()
      return service.createBook(input)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookKeys.all })
    },
  })
}

export function useAddCategory() {
  const queryClient = useQueryClient()
  return useMutation<BookRow, Error, { bookId: string; category: Category }>({
    mutationFn: async ({ bookId, category }) => {
      const service = createBookService()
      return service.addCategory(bookId, category)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: bookKeys.detail(variables.bookId) })
      void queryClient.invalidateQueries({ queryKey: bookKeys.bundle(variables.bookId) })
    },
  })
}

export function useSettleBook() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    {
      bookId: string
      members: MemberRow[]
      expenses: ExpenseWithDetails[]
      settlementCurrency?: string
      exchangeRate?: number
    }
  >({
    mutationFn: async ({ bookId, members, expenses, settlementCurrency, exchangeRate }) => {
      const service = createBookService()
      return service.settleBook(bookId, members, expenses, settlementCurrency, exchangeRate)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: bookKeys.detail(variables.bookId) })
      void queryClient.invalidateQueries({ queryKey: bookKeys.all })
      void queryClient.invalidateQueries({ queryKey: bookKeys.bundle(variables.bookId) })
      void queryClient.invalidateQueries({ queryKey: settlementKeys.byBook(variables.bookId) })
    },
  })
}

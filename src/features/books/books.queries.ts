"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateBookInput } from "@/domain/book/book.repository"
import { settlementKeys } from "@/features/settlements/settlements.queries"
import { createBookRepository } from "@/infrastructure/repository.factory"
import { IS_LOCAL } from "@/lib/env"
import type {
  BookBundle,
  BookRow,
  BookWithMembers,
  Category,
  ExpenseWithDetails,
  MemberRow,
} from "@/types/app.types"

import { fetchBookBundleLocal, fetchBookBundleRpc } from "./books.bundle"
import { bookKeys } from "./books.query-keys"
import { BookService } from "./books.service"

// 每次 queryFn 或 mutationFn 呼叫時建立新實例，避免 stale closure 問題
function createBookService(): BookService {
  const repo = createBookRepository()
  return new BookService(repo)
}

async function fetchBookBundle(bookId: string): Promise<BookBundle> {
  if (IS_LOCAL) {
    return fetchBookBundleLocal(bookId)
  }

  const { createClient } = await import("@/lib/supabase/client")
  const supabase = createClient()

  return fetchBookBundleRpc(supabase, bookId)
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

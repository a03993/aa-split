"use client"

import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateExpenseInput, UpdateExpenseInput } from "@/domain/expense/expense.repository"
import { bookKeys } from "@/features/books/books.queries"
import { LineNotificationService } from "@/infrastructure/notification/notification.service"
import { createExpenseRepository } from "@/infrastructure/repository.factory"
import type { Category, ExpenseRow, ExpenseWithDetails } from "@/types/app.types"

import { ExpenseService } from "./expenses.service"

export const expenseKeys = {
  all: ["expenses"] as const,
  byBook: (bookId: string) => ["expenses", "book", bookId] as const,
}

function invalidateExpenseAndBook(
  queryClient: QueryClient,
  bookId: string,
  pendingCategory: Category | undefined,
): void {
  void queryClient.invalidateQueries({ queryKey: expenseKeys.byBook(bookId) })
  void queryClient.invalidateQueries({ queryKey: bookKeys.bundle(bookId) })
  if (pendingCategory) {
    void queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) })
  }
}

function createExpenseService(): ExpenseService {
  const repo = createExpenseRepository()
  const notificationService = new LineNotificationService()
  return new ExpenseService(repo, notificationService)
}

export function useExpenses(bookId: string | undefined) {
  return useQuery<ExpenseWithDetails[], Error>({
    queryKey: expenseKeys.byBook(bookId ?? ""),
    queryFn: async () => {
      const service = createExpenseService()
      return service.getExpenses(bookId!)
    },
    enabled: !!bookId,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation<ExpenseRow, Error, { input: CreateExpenseInput; notifyGroup: boolean }>({
    mutationFn: async ({ input, notifyGroup }) => {
      const service = createExpenseService()
      return service.createExpense(input, notifyGroup)
    },
    onSuccess: (_data, variables) => {
      invalidateExpenseAndBook(queryClient, variables.input.bookId, variables.input.pendingCategory)
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation<ExpenseRow, Error, { input: UpdateExpenseInput; notifyGroup: boolean }>({
    mutationFn: async ({ input, notifyGroup }) => {
      const service = createExpenseService()
      return service.updateExpense(input, notifyGroup)
    },
    onSuccess: (_data, variables) => {
      invalidateExpenseAndBook(queryClient, variables.input.bookId, variables.input.pendingCategory)
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { expenseId: string; bookId: string }>({
    mutationFn: async ({ expenseId }) => {
      const service = createExpenseService()
      return service.deleteExpense(expenseId)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: expenseKeys.byBook(variables.bookId),
      })
      void queryClient.invalidateQueries({
        queryKey: bookKeys.bundle(variables.bookId),
      })
    },
  })
}

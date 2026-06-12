"use client"

import { useMemo } from "react"

import { useQuery } from "@tanstack/react-query"

import { createSettlementRepository } from "@/infrastructure/repository.factory"
import type { ExpenseWithDetails, MemberRow, SettlementRow } from "@/types/app.types"

import { type SettlementPlan, SettlementService } from "./settlements.service"

export const settlementKeys = {
  byBook: (bookId: string) => ["settlements", "book", bookId] as const,
}

function createSettlementService(): SettlementService {
  const repo = createSettlementRepository()
  return new SettlementService(repo)
}

export function useSettlements(bookId: string | undefined) {
  return useQuery<SettlementRow[], Error>({
    queryKey: settlementKeys.byBook(bookId ?? ""),
    queryFn: async () => {
      const service = createSettlementService()
      return service.getSettlements(bookId!)
    },
    enabled: !!bookId,
  })
}

/**
 * 從成員與費用資料推導結算計畫（餘額 + 轉帳清單）。
 * 純客戶端 memo，不發送 server 請求。
 */
export function useSettlementPlan(
  members: MemberRow[],
  expenses: ExpenseWithDetails[],
): SettlementPlan {
  return useMemo(() => {
    const service = createSettlementService()
    return service.calculatePlan(members, expenses)
  }, [members, expenses])
}

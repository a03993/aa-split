import type { SettlementRepository } from "@/domain/settlement/settlement.repository"
import type { SettlementInsert, SettlementRow } from "@/types/app.types"

import { MOCK_SETTLEMENTS } from "./mock-data"

// _mockSettlements 是跨模組共享的可變陣列，模擬資料庫持久化行為。
// 注意：MockBookRepository.settle() 也會直接操作此陣列，
// 兩個 repository 之間存在直接耦合，以確保 settle 操作的原子性（book 狀態與 settlement 資料同步）。
export const _mockSettlements: SettlementRow[] = MOCK_SETTLEMENTS.map((s) => ({ ...s }))

function delay(): Promise<void> {
  return new Promise((r) => setTimeout(r, 50))
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export class MockSettlementRepository implements SettlementRepository {
  async findByBookId(bookId: string): Promise<SettlementRow[]> {
    await delay()
    return _mockSettlements
      .filter((s) => s.book_id === bookId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  async createBatch(incoming: SettlementInsert[]): Promise<SettlementRow[]> {
    await delay()
    if (incoming.length === 0) return []

    const now = new Date().toISOString()
    const newRows: SettlementRow[] = incoming.map(
      (s): SettlementRow => ({
        id: s.id ?? generateId("mock-settlement"),
        book_id: s.book_id,
        payer_member_id: s.payer_member_id,
        receiver_member_id: s.receiver_member_id,
        amount: s.amount,
        created_at: s.created_at ?? now,
      }),
    )

    _mockSettlements.push(...newRows)
    return newRows.map((r) => ({ ...r }))
  }
}

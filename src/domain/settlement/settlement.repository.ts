import type { SettlementInsert, SettlementRow } from "@/types/app.types"

export interface SettlementRepository {
  findByBookId(bookId: string): Promise<SettlementRow[]>
  createBatch(settlements: SettlementInsert[]): Promise<SettlementRow[]>
}

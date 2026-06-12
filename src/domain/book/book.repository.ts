import type { BookRow, BookWithMembers, Category, SettlementInsert } from "@/types/app.types"

export interface CreateBookInput {
  name: string
  ownerUserId: string
  memberNames: string[]
  currency: string
}

export interface BookRepository {
  findById(id: string): Promise<BookWithMembers | null>
  findByUserId(userId: string): Promise<BookWithMembers[]>
  create(data: CreateBookInput): Promise<BookRow>
  settle(bookId: string, settlements: SettlementInsert[]): Promise<void>
  addCategory(bookId: string, category: Category): Promise<BookRow>
}

import type { BookRepository, CreateBookInput } from "@/domain/book/book.repository"
import { calculateBalances, calculateSettlement } from "@/domain/settlement/settlement.calculator"
import type {
  BookRow,
  BookWithMembers,
  Category,
  ExpenseWithDetails,
  MemberRow,
} from "@/types/app.types"

export class BookService {
  constructor(private repo: BookRepository) {}

  async getUserBooks(userId: string): Promise<BookWithMembers[]> {
    return this.repo.findByUserId(userId)
  }

  async getBook(bookId: string): Promise<BookWithMembers | null> {
    return this.repo.findById(bookId)
  }

  async createBook(input: CreateBookInput): Promise<BookRow> {
    return this.repo.create(input)
  }

  async addCategory(bookId: string, category: Category): Promise<BookRow> {
    return this.repo.addCategory(bookId, category)
  }

  /**
   * 結算帳本：
   *  1. 根據費用清單計算所有成員的淨餘額。
   *  2. 透過 calculateSettlement 推導出最少轉帳組合。
   *  3. 透過 repo.settle 寫入轉帳記錄並將帳本標記為已結算。
   */
  async settleBook(
    bookId: string,
    members: MemberRow[],
    expenses: ExpenseWithDetails[],
    settlementCurrency?: string,
    exchangeRate?: number,
  ): Promise<void> {
    const memberIds = members.map((m) => m.id)
    const balances = calculateBalances(expenses, memberIds)
    const transfers = calculateSettlement(balances)

    const settlements = transfers.map((t) => ({
      book_id: bookId,
      payer_member_id: t.fromMemberId,
      receiver_member_id: t.toMemberId,
      amount: t.amount,
    }))

    await this.repo.settle(bookId, settlements, settlementCurrency ?? null, exchangeRate ?? null)
  }
}

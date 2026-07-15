import type { BookRepository, CreateBookInput } from "@/domain/book/book.repository"
import type {
  BookRow,
  BookWithMembers,
  Category,
  Member,
  SettlementInsert,
} from "@/types/app.types"

import { MOCK_BOOKS, MOCK_BOOK_ID, MOCK_MEMBERS, MOCK_USER_ID, MOCK_USER_NAME } from "./mock-data"
import { _mockSettlements } from "./settlement.repository"

// books 與 members 是跨實例共享的可變陣列，模擬資料庫持久化行為。
const books: BookRow[] = MOCK_BOOKS.map((b) => ({ ...b }))
const members: Member[] = MOCK_MEMBERS.map((m) => ({ ...m }))

function delay(): Promise<void> {
  return new Promise((r) => setTimeout(r, 50))
}

function buildBookWithMembers(book: BookRow): BookWithMembers {
  return {
    ...book,
    members: members.filter((m) => m.book_id === book.id),
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export class MockBookRepository implements BookRepository {
  async findById(id: string): Promise<BookWithMembers | null> {
    await delay()

    const book = books.find((b) => b.id === id)

    if (!book) {
      return null
    }

    return buildBookWithMembers(book)
  }

  async findByUserId(userId: string): Promise<BookWithMembers[]> {
    await delay()

    const userBookIds = new Set(
      members.filter((m) => m.profile_id === userId).map((m) => m.book_id),
    )

    return books.filter((b) => userBookIds.has(b.id)).map(buildBookWithMembers)
  }

  async create(data: CreateBookInput): Promise<BookRow> {
    await delay()

    const now = new Date().toISOString()
    const newBook: BookRow = {
      id: generateId("mock-book"),
      name: data.name,
      owner_id: data.ownerUserId,
      settled_at: null,
      settlement_currency: null,
      exchange_rate: null,
      custom_categories: [],
      currency: data.currency,
      created_at: now,
      updated_at: now,
    }

    books.push(newBook)

    const ownerMember: Member = {
      id: generateId("mock-member-owner"),
      book_id: newBook.id,
      display_name: data.ownerUserId === MOCK_USER_ID ? MOCK_USER_NAME : data.ownerUserId,
      profile_id: data.ownerUserId,
      created_at: now,
      profile: null,
    }

    members.push(ownerMember)

    for (const name of data.memberNames) {
      const m: Member = {
        id: generateId("mock-member"),
        book_id: newBook.id,
        display_name: name,
        profile_id: null,
        created_at: now,
        profile: null,
      }
      members.push(m)
    }

    return { ...newBook }
  }

  async settle(
    bookId: string,
    settlements: SettlementInsert[],
    settlementCurrency?: string | null,
    exchangeRate?: number | null,
  ): Promise<void> {
    await delay()

    const book = books.find((b) => b.id === bookId)

    if (!book) {
      throw new Error(`MockBookRepository: book "${bookId}" not found`)
    }

    book.settled_at = new Date().toISOString()
    book.settlement_currency = settlementCurrency ?? null
    book.exchange_rate = exchangeRate ?? null
    book.updated_at = new Date().toISOString()

    // 直接寫入共享的 _mockSettlements 陣列，模擬 Supabase 版 settle() 在同一操作中
    // 同時更新 book.settled_at 並插入 settlement rows 的行為。
    if (settlements.length > 0) {
      const now = new Date().toISOString()

      settlements.forEach((s) => {
        _mockSettlements.push({
          id: s.id ?? generateId("mock-settlement"),
          book_id: s.book_id,
          payer_member_id: s.payer_member_id,
          receiver_member_id: s.receiver_member_id,
          amount: s.amount,
          created_at: s.created_at ?? now,
        })
      })
    }
  }

  async addCategory(bookId: string, category: Category): Promise<BookRow> {
    await delay()

    const book = books.find((b) => b.id === bookId)

    if (!book) {
      throw new Error(`MockBookRepository: book "${bookId}" not found`)
    }

    book.custom_categories = [...book.custom_categories, category]

    return { ...book }
  }
}

export { books as _mockBooks, members as _mockMembers }

export { MOCK_BOOK_ID }

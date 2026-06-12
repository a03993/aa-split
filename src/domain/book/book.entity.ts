import type { BookRow } from "@/types/app.types"

export function isSettled(book: BookRow): boolean {
  return book.settled_at !== null
}

export function isOwner(book: BookRow, userId: string): boolean {
  return book.owner_id === userId
}

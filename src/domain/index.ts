// Domain 層 — 公開 API 匯出入口
// 應用層與基礎設施層請從此檔（或各子 domain）匯入。
// 禁止在此匯入任何基礎設施層的關注點。

export type { CreateBookInput, BookRepository, CreateBookFormValues } from "./book"
export { isSettled, isOwner, createBookSchema } from "./book"

export type { MemberRepository } from "./member"
export { isClaimed, canClaim } from "./member"

export type { CreateExpenseInput, ExpenseRepository, CreateExpenseFormValues } from "./expense"
export {
  calculateEqualSplit,
  calculateCustomSplit,
  validateSplits,
  createExpenseSchema,
} from "./expense"

export type { Transfer, SettlementRepository } from "./settlement"
export { calculateBalances, calculateSettlement } from "./settlement"

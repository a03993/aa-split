import type { Database, Tables, TablesInsert, TablesUpdate } from "./database.types"

export type SplitMode = Database["public"]["Enums"]["split_mode"]

export type Category = {
  key: string
  label: string
  icon: string
}

export type ProfileRow = Tables<"profiles">
export type ProfileInsert = TablesInsert<"profiles">
export type ProfileUpdate = TablesUpdate<"profiles">

export type BookRow = Omit<Tables<"books">, "custom_categories"> & { custom_categories: Category[] }
export type BookInsert = Omit<TablesInsert<"books">, "custom_categories"> & {
  custom_categories?: Category[]
}
export type BookUpdate = Omit<TablesUpdate<"books">, "custom_categories"> & {
  custom_categories?: Category[]
}

export type MemberRow = Tables<"members">
export type MemberInsert = TablesInsert<"members">
export type MemberUpdate = TablesUpdate<"members">

export type ExpenseRow = Tables<"expenses">
export type ExpenseInsert = TablesInsert<"expenses">
export type ExpenseUpdate = TablesUpdate<"expenses">

export type ExpenseSplitRow = Tables<"expense_splits">
export type ExpenseSplitInsert = TablesInsert<"expense_splits">
export type ExpenseSplitUpdate = TablesUpdate<"expense_splits">

export type SettlementRow = Tables<"settlements">
export type SettlementInsert = TablesInsert<"settlements">

export interface Member extends MemberRow {
  profile: ProfileRow | null
}

export interface BookWithMembers extends BookRow {
  members: Member[]
}

export interface ExpenseWithDetails extends ExpenseRow {
  payer: MemberRow
  expense_splits: (ExpenseSplitRow & { member: MemberRow })[]
}

export interface DebtSummary {
  fromMember: MemberRow
  toMember: MemberRow
  amount: number
}

export interface BookBundle {
  book: BookWithMembers | null
  members: Member[]
  expenses: ExpenseWithDetails[]
  settlements: SettlementRow[]
}

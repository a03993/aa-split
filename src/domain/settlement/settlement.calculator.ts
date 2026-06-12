import type { ExpenseWithDetails } from "@/types/app.types"

export interface Transfer {
  fromMemberId: string
  toMemberId: string
  amount: number
}

/**
 * 計算每位成員在所有費用中的淨餘額。
 * 正值 = 應收款（債權人），負值 = 應付款（債務人）
 */
export function calculateBalances(
  expenses: ExpenseWithDetails[],
  memberIds: string[],
): Map<string, number> {
  const balances = new Map<string, number>()

  for (const memberId of memberIds) {
    balances.set(memberId, 0)
  }

  for (const expense of expenses) {
    const payerBalance = balances.get(expense.payer_member_id) ?? 0
    balances.set(expense.payer_member_id, payerBalance + expense.amount)

    for (const split of expense.expense_splits) {
      const splitBalance = balances.get(split.member_id) ?? 0
      balances.set(split.member_id, splitBalance - split.amount)
    }
  }

  return balances
}

/**
 * 貪婪演算法：反覆將最大債權人與最大債務人配對，
 * 以最少的轉帳次數完成所有餘額的結算。
 */
export function calculateSettlement(balances: Map<string, number>): Transfer[] {
  const THRESHOLD = 0.01

  const creditors: Array<{ memberId: string; balance: number }> = []
  const debtors: Array<{ memberId: string; balance: number }> = []

  for (const [memberId, balance] of balances) {
    if (balance > THRESHOLD) {
      creditors.push({ memberId, balance })
    } else if (balance < -THRESHOLD) {
      debtors.push({ memberId, balance })
    }
  }

  creditors.sort((a, b) => b.balance - a.balance)
  debtors.sort((a, b) => a.balance - b.balance)

  const transfers: Transfer[] = []

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0]
    const debtor = debtors[0]

    const transferAmount = Math.min(creditor.balance, -debtor.balance)
    const roundedAmount = Math.round(transferAmount * 100) / 100

    if (roundedAmount > 0) {
      transfers.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount: roundedAmount,
      })
    }

    creditor.balance -= transferAmount
    debtor.balance += transferAmount

    if (Math.abs(creditor.balance) < THRESHOLD) {
      creditors.shift()
    }
    if (Math.abs(debtor.balance) < THRESHOLD) {
      debtors.shift()
    }

    creditors.sort((a, b) => b.balance - a.balance)
    debtors.sort((a, b) => a.balance - b.balance)
  }

  return transfers
}

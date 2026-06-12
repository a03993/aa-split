import {
  type Transfer,
  calculateBalances,
  calculateSettlement,
} from "@/domain/settlement/settlement.calculator"
import type { SettlementRepository } from "@/domain/settlement/settlement.repository"
import type { DebtSummary, ExpenseWithDetails, MemberRow, SettlementRow } from "@/types/app.types"

export interface SettlementPlan {
  balances: Map<string, number>
  transfers: Transfer[]
  debtSummary: DebtSummary[]
}

export class SettlementService {
  constructor(private repo: SettlementRepository) {}

  calculatePlan(members: MemberRow[], expenses: ExpenseWithDetails[]): SettlementPlan {
    const memberIds = members.map((m) => m.id)
    const balances = calculateBalances(expenses, memberIds)
    const transfers = calculateSettlement(balances)

    const memberById = new Map<string, MemberRow>(members.map((m) => [m.id, m]))

    const debtSummary: DebtSummary[] = transfers
      .map((t): DebtSummary | null => {
        const fromMember = memberById.get(t.fromMemberId)
        const toMember = memberById.get(t.toMemberId)
        if (!fromMember || !toMember) {
          return null
        }
        return {
          fromMember,
          toMember,
          amount: t.amount,
        }
      })
      .filter((d): d is DebtSummary => d !== null)

    return { balances, transfers, debtSummary }
  }

  async getSettlements(bookId: string): Promise<SettlementRow[]> {
    return this.repo.findByBookId(bookId)
  }
}

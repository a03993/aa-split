import { calculateEqualSplit } from "@/domain/expense/expense.entity"
import type {
  CreateExpenseInput,
  ExpenseRepository,
  UpdateExpenseInput,
} from "@/domain/expense/expense.repository"
import type { NotificationService } from "@/infrastructure/notification/notification.service"
import type { ExpenseRow, ExpenseWithDetails } from "@/types/app.types"

export class ExpenseService {
  constructor(
    private repo: ExpenseRepository,
    private notificationService: NotificationService,
  ) {}

  async getExpenses(bookId: string): Promise<ExpenseWithDetails[]> {
    return this.repo.findByBookId(bookId)
  }

  async createExpense(input: CreateExpenseInput, notifyGroup: boolean): Promise<ExpenseRow> {
    const resolvedInput = this.resolveEqualSplits(input)
    const expense = await this.repo.create(resolvedInput)

    if (notifyGroup) {
      // 通知失敗不影響費用寫入結果，避免「DB 已成功但 UI 報錯」的不一致情況
      try {
        await this.notificationService.notifyExpenseAdded(input.bookId, input.title)
      } catch (err) {
        console.error("[ExpenseService] notifyExpenseAdded 失敗:", err)
      }
    }

    return expense
  }

  async updateExpense(input: UpdateExpenseInput, notifyGroup: boolean): Promise<ExpenseRow> {
    const resolvedInput = this.resolveEqualSplits(input)
    const expense = await this.repo.update(resolvedInput)

    if (notifyGroup) {
      // 通知失敗不影響費用更新結果
      try {
        await this.notificationService.notifyExpenseUpdated(input.bookId, input.title)
      } catch (err) {
        console.error("[ExpenseService] notifyExpenseUpdated 失敗:", err)
      }
    }

    return expense
  }

  async deleteExpense(expenseId: string): Promise<void> {
    return this.repo.delete(expenseId)
  }

  // equal 模式：將 splits 替換為自動計算的均分結果。
  // custom 模式：splits 已由呼叫端計算完畢，直接回傳原始 input。
  private resolveEqualSplits<T extends CreateExpenseInput | UpdateExpenseInput>(input: T): T {
    if (input.splitMode !== "equal") return input

    const memberIds = input.splits.map((s) => s.memberId)
    const amounts = calculateEqualSplit(input.amount, memberIds.length)
    const equalSplits = memberIds.map((memberId, index) => ({
      memberId,
      amount: amounts[index],
    }))
    return { ...input, splits: equalSplits }
  }
}

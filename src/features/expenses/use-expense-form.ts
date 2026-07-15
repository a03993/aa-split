import { useMemo, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  calculateCustomSplit,
  calculateEqualSplit,
  validateSplits,
} from "@/domain/expense/expense.entity"
import type { Category } from "@/types/app.types"

/**
 * UI 表單的中間狀態 schema。
 * 驗證使用者在表單填入的欄位（含 participantIds、splitMode），
 * 不含 splits（由 buildSubmitPayload 在 submit 時計算組裝）。
 *
 * 注意：domain/expense/expense.schema.ts 的 createExpenseSchema
 * 是為未來 Server Action / API boundary 驗證 API 入站資料所設計，
 * 兩者用途不同，不應合併。
 */
export const expenseFormSchema = z.object({
  date: z.string().min(1, "請選擇日期"),
  time: z.string().min(1, "請選擇時間"),
  category: z.string().min(1, "請選擇分類"),
  title: z.string().min(1, "請輸入標題"),
  amount: z.number({ invalid_type_error: "請輸入金額" }).positive("金額必須大於 0"),
  payerMemberId: z.string().min(1, "請選擇付款人"),
  participantIds: z.array(z.string()).min(1, "至少選擇 1 位參與者"),
  splitMode: z.enum(["equal", "custom"]),
})

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>

export const SPLIT_MODES = [
  { value: "equal", label: "均分" },
  { value: "custom", label: "自訂" },
] as const

interface UseExpenseFormOptions {
  defaultValues: ExpenseFormValues
  initialShares?: Record<string, number>
  initialManualAmounts?: Record<string, number | null>
  defaultIsNotify?: boolean
}

export function useExpenseForm({
  defaultValues,
  initialShares = {},
  initialManualAmounts = {},
  defaultIsNotify = false,
}: UseExpenseFormOptions) {
  const [isNotify, setIsNotify] = useState(defaultIsNotify)
  const [pendingCategories, setPendingCategories] = useState<Category[]>([])
  const [shares, setShares] = useState<Record<string, number>>(initialShares)
  const [manualAmounts, setManualAmounts] =
    useState<Record<string, number | null>>(initialManualAmounts)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues,
  })

  const splitMode = form.watch("splitMode")
  const participantIds = form.watch("participantIds")
  const amount = form.watch("amount")
  const formDate = form.watch("date")
  const formTime = form.watch("time")
  const formCategory = form.watch("category")
  const formPayerMemberId = form.watch("payerMemberId")

  const customSplitResults = useMemo<
    Array<{ memberId: string; amount: number; shares: number | null }>
  >(() => {
    if (splitMode !== "custom" || !amount) {
      return []
    }

    const participants = participantIds.map((id) => ({
      memberId: id,
      fixedAmount: manualAmounts[id] ?? undefined,
      shares: shares[id] ?? 1,
    }))

    return calculateCustomSplit(amount, participants)
  }, [amount, participantIds, shares, manualAmounts, splitMode])

  const splitAmounts = useMemo<Record<string, number>>(() => {
    return Object.fromEntries(customSplitResults.map((r) => [r.memberId, r.amount]))
  }, [customSplitResults])

  function toggleParticipant(memberId: string) {
    const current = form.getValues("participantIds")
    const next = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId]
    form.setValue("participantIds", next, { shouldValidate: true })
  }

  function createSplitHandlers(memberId: string) {
    const isParticipant = participantIds.includes(memberId)
    const isManual = manualAmounts[memberId] != null
    const currentShares = shares[memberId] ?? 1

    function onShareDecrement() {
      // 手動模式下 shares[id] 已被清除，視為從 1 開始，按 - 即移除
      const effectiveShares = isManual ? 1 : currentShares

      if (effectiveShares <= 1) {
        if (isParticipant) {
          toggleParticipant(memberId)
        }

        setManualAmounts((prev) => {
          const next = { ...prev }
          delete next[memberId]

          return next
        })

        setShares((prev) => {
          const next = { ...prev }
          delete next[memberId]

          return next
        })
      } else {
        setManualAmounts((prev) => ({ ...prev, [memberId]: null }))
        setShares((prev) => ({ ...prev, [memberId]: effectiveShares - 1 }))
      }
    }

    function onShareIncrement() {
      // 手動模式下 shares[id] 已被清除，按 + 從 0 開始
      const effectiveShares = isManual ? 0 : currentShares

      setManualAmounts((prev) => ({ ...prev, [memberId]: null }))

      if (!isParticipant) {
        toggleParticipant(memberId)
      }

      setShares((prev) => ({
        ...prev,
        [memberId]: isParticipant ? effectiveShares + 1 : 1,
      }))
    }

    function onAmountChange(val: number | null) {
      if (val === null) {
        // 金額清空視為移除參與者，清掉手動金額與份數
        if (isParticipant) {
          toggleParticipant(memberId)
        }

        setManualAmounts((prev) => {
          const next = { ...prev }
          delete next[memberId]

          return next
        })

        setShares((prev) => {
          const next = { ...prev }
          delete next[memberId]

          return next
        })
        return
      }
      if (!isParticipant) {
        toggleParticipant(memberId)
      }

      setManualAmounts((prev) => ({ ...prev, [memberId]: val }))
      setShares((prev) => {
        const next = { ...prev }
        delete next[memberId]

        return next
      })
    }

    return { onShareDecrement, onShareIncrement, onAmountChange }
  }

  function buildSubmitPayload(data: ExpenseFormValues): {
    splits: Array<{ memberId: string; amount: number; shares: number | null }>
    pendingCategory: Category | undefined
  } | null {
    let splits: Array<{ memberId: string; amount: number; shares: number | null }>

    if (data.splitMode === "equal") {
      const amounts = calculateEqualSplit(data.amount, data.participantIds.length)
      splits = data.participantIds.map((id, i) => ({ memberId: id, amount: amounts[i], shares: 1 }))
    } else {
      splits = customSplitResults.filter((splitResult) =>
        data.participantIds.includes(splitResult.memberId),
      )
      if (
        !validateSplits(
          data.amount,
          splits.map((split) => split.amount),
        )
      ) {
        form.setError("participantIds", { message: "分攤金額加總必須等於總金額" })
        return null
      }
    }

    const pendingCategory = pendingCategories.find((c) => c.key === data.category)

    return { splits, pendingCategory }
  }

  function resetSplitState() {
    setShares({})
    setManualAmounts({})
    setPendingCategories([])
    setIsNotify(defaultIsNotify)
  }

  return {
    form,
    splitMode,
    participantIds,
    amount,
    formDate,
    formTime,
    formCategory,
    formPayerMemberId,
    splitAmounts,
    isNotify,
    setIsNotify,
    pendingCategories,
    setPendingCategories,
    shares,
    manualAmounts,
    toggleParticipant,
    createSplitHandlers,
    buildSubmitPayload,
    resetSplitState,
  }
}

import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { type ExpenseFormValues, useExpenseForm } from "../use-expense-form"

const defaultValues: ExpenseFormValues = {
  date: "2024-01-15",
  time: "12:00",
  category: "food",
  title: "午餐",
  amount: 100,
  payerMemberId: "member-1",
  participantIds: ["member-1", "member-2", "member-3"],
  splitMode: "equal",
}

function setup(overrides?: Partial<Parameters<typeof useExpenseForm>[0]>) {
  return renderHook(() =>
    useExpenseForm({
      defaultValues,
      ...overrides,
    }),
  )
}

describe("useExpenseForm — toggleParticipant", () => {
  it("移除已在列表中的參與者", () => {
    const { result } = setup()
    act(() => {
      result.current.toggleParticipant("member-2")
    })
    expect(result.current.participantIds).toEqual(["member-1", "member-3"])
  })

  it("加入不在列表中的參與者", () => {
    const { result } = setup()
    act(() => {
      result.current.toggleParticipant("member-4")
    })
    expect(result.current.participantIds).toContain("member-4")
  })
})

describe("useExpenseForm — buildSubmitPayload (equal mode)", () => {
  it("equal 模式正確計算 splits", () => {
    const { result } = setup()
    let payload: ReturnType<typeof result.current.buildSubmitPayload> = null
    act(() => {
      payload = result.current.buildSubmitPayload(defaultValues)
    })
    expect(payload).not.toBeNull()
    const total = payload!.splits.reduce((sum, s) => sum + s.amount, 0)
    expect(Math.round(total * 100)).toBe(Math.round(defaultValues.amount * 100))
    expect(payload!.splits).toHaveLength(3)
    expect(payload!.splits[0].shares).toBe(1)
  })

  it("equal 模式 splits 每筆都有 memberId", () => {
    const { result } = setup()
    let payload: ReturnType<typeof result.current.buildSubmitPayload> = null
    act(() => {
      payload = result.current.buildSubmitPayload(defaultValues)
    })
    const ids = payload!.splits.map((s) => s.memberId)
    expect(ids).toEqual(expect.arrayContaining(["member-1", "member-2", "member-3"]))
  })
})

describe("useExpenseForm — buildSubmitPayload (custom mode)", () => {
  it("custom 模式份數分配：加總等於 amount", () => {
    const { result } = setup()
    // 切到 custom 模式
    act(() => {
      result.current.form.setValue("splitMode", "custom")
    })
    const customValues: ExpenseFormValues = { ...defaultValues, splitMode: "custom" }
    let payload: ReturnType<typeof result.current.buildSubmitPayload> = null
    act(() => {
      payload = result.current.buildSubmitPayload(customValues)
    })
    expect(payload).not.toBeNull()
    const total = payload!.splits.reduce((sum, s) => sum + s.amount, 0)
    expect(Math.round(total * 100)).toBe(Math.round(100 * 100))
  })

  it("custom 模式金額加總不符時回傳 null 並設定 form error", () => {
    // 只有 member-1、member-2 兩位參與者，各手動設定 90，加總 180 ≠ 100
    const twoParticipants: ExpenseFormValues = {
      ...defaultValues,
      splitMode: "custom",
      participantIds: ["member-1", "member-2"],
    }
    const { result } = setup({ defaultValues: twoParticipants })
    act(() => {
      result.current.form.setValue("participantIds", ["member-1", "member-2"])
      result.current.form.setValue("splitMode", "custom")
      result.current.createSplitHandlers("member-1").onAmountChange(90)
      result.current.createSplitHandlers("member-2").onAmountChange(90)
    })
    let payload: ReturnType<typeof result.current.buildSubmitPayload> = undefined as unknown as null
    act(() => {
      payload = result.current.buildSubmitPayload({
        ...twoParticipants,
        participantIds: ["member-1", "member-2"],
      })
    })
    expect(payload).toBeNull()
  })
})

describe("useExpenseForm — createSplitHandlers", () => {
  it("onShareIncrement 將成員加入 participantIds 並增加份數", () => {
    // 從只有兩人開始
    const twoParticipants: ExpenseFormValues = {
      ...defaultValues,
      participantIds: ["member-1", "member-2"],
    }
    const { result } = setup({ defaultValues: twoParticipants })
    act(() => {
      result.current.form.setValue("participantIds", ["member-1", "member-2"])
      result.current.createSplitHandlers("member-3").onShareIncrement()
    })
    expect(result.current.participantIds).toContain("member-3")
    expect(result.current.shares["member-3"]).toBe(1)
  })

  it("onShareDecrement 份數為 1 時移除參與者", () => {
    const { result } = setup()
    act(() => {
      result.current.createSplitHandlers("member-2").onShareDecrement()
    })
    expect(result.current.participantIds).not.toContain("member-2")
  })

  it("onShareDecrement 份數大於 1 時遞減份數", () => {
    const { result } = setup({ initialShares: { "member-1": 3 } })
    act(() => {
      result.current.createSplitHandlers("member-1").onShareDecrement()
    })
    expect(result.current.shares["member-1"]).toBe(2)
  })

  it("onAmountChange 設定手動金額並加入 participantIds", () => {
    const twoParticipants: ExpenseFormValues = {
      ...defaultValues,
      participantIds: ["member-1", "member-2"],
    }
    const { result } = setup({ defaultValues: twoParticipants })
    act(() => {
      result.current.form.setValue("participantIds", ["member-1", "member-2"])
      result.current.createSplitHandlers("member-3").onAmountChange(30)
    })
    expect(result.current.manualAmounts["member-3"]).toBe(30)
    expect(result.current.participantIds).toContain("member-3")
  })

  it("onAmountChange(null) 移除手動金額並移出 participantIds", () => {
    const { result } = setup({ initialManualAmounts: { "member-2": 50 } })
    act(() => {
      result.current.createSplitHandlers("member-2").onAmountChange(null)
    })
    expect(result.current.manualAmounts["member-2"]).toBeUndefined()
    expect(result.current.participantIds).not.toContain("member-2")
  })
})

describe("useExpenseForm — resetSplitState", () => {
  it("清空 shares、manualAmounts、pendingCategories", () => {
    const { result } = setup({
      initialShares: { "member-1": 2 },
      initialManualAmounts: { "member-2": 50 },
    })
    act(() => {
      result.current.resetSplitState()
    })
    expect(result.current.shares).toEqual({})
    expect(result.current.manualAmounts).toEqual({})
    expect(result.current.pendingCategories).toEqual([])
  })
})

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CreateBookSheet } from "../components/create-book-sheet"

const defaultProps = {
  onSubmit: vi.fn().mockResolvedValue(undefined),
  currentUserId: "user-1",
  currentUserName: "Alice",
}

async function openSheet() {
  await userEvent.click(screen.getByRole("button"))
}

describe("CreateBookSheet — 成員管理", () => {
  it("當前使用者的名稱顯示為不可移除的 badge", async () => {
    render(<CreateBookSheet {...defaultProps} />)
    await openSheet()
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("(你)")).toBeInTheDocument()
  })

  it("輸入成員名稱後按 Enter 新增成員 badge", async () => {
    render(<CreateBookSheet {...defaultProps} />)
    await openSheet()
    const input = screen.getByPlaceholderText("蒂娜、雪莉")
    await userEvent.type(input, "Bob{Enter}")
    expect(screen.getByText("Bob")).toBeInTheDocument()
    expect(input).toHaveValue("")
  })

  it("有輸入內容時出現新增按鈕", async () => {
    render(<CreateBookSheet {...defaultProps} />)
    await openSheet()
    const buttonsBefore = screen.getAllByRole("button").length
    const input = screen.getByPlaceholderText("蒂娜、雪莉")
    await userEvent.type(input, "Carol")
    const buttonsAfter = screen.getAllByRole("button").length
    expect(buttonsAfter).toBeGreaterThan(buttonsBefore)
  })

  it("重複名稱不會新增第二個 badge", async () => {
    render(<CreateBookSheet {...defaultProps} />)
    await openSheet()
    const input = screen.getByPlaceholderText("蒂娜、雪莉")
    await userEvent.type(input, "Bob{Enter}")
    await userEvent.type(input, "Bob{Enter}")
    expect(screen.getAllByText("Bob")).toHaveLength(1)
  })

  it("點擊 X 可移除成員", async () => {
    render(<CreateBookSheet {...defaultProps} />)
    await openSheet()
    const input = screen.getByPlaceholderText("蒂娜、雪莉")
    await userEvent.type(input, "Bob{Enter}")
    const bobBadge = screen.getByText("Bob").closest("div")!
    await userEvent.click(bobBadge.querySelector("button")!)
    expect(screen.queryByText("Bob")).not.toBeInTheDocument()
  })

  it("空白輸入不新增成員", async () => {
    render(<CreateBookSheet {...defaultProps} />)
    await openSheet()
    const input = screen.getByPlaceholderText("蒂娜、雪莉")
    await userEvent.type(input, "   {Enter}")
    expect(screen.queryAllByRole("button", { name: /移除/ })).toHaveLength(0)
  })
})

describe("CreateBookSheet — 表單提交", () => {
  it("未填名稱時點擊建立不呼叫 onSubmit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CreateBookSheet {...defaultProps} onSubmit={onSubmit} />)
    await openSheet()
    await userEvent.click(screen.getByRole("button", { name: "建立" }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("填入名稱後點擊建立可呼叫 onSubmit（成員為選填）", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CreateBookSheet {...defaultProps} onSubmit={onSubmit} />)
    await openSheet()
    await userEvent.type(screen.getByPlaceholderText("日本旅遊、週五聚餐"), "旅遊")
    await userEvent.click(screen.getByRole("button", { name: "建立" }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })

  it("提交時呼叫 onSubmit 並帶入正確資料", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CreateBookSheet {...defaultProps} onSubmit={onSubmit} />)
    await openSheet()
    await userEvent.type(screen.getByPlaceholderText("日本旅遊、週五聚餐"), "日本旅遊")
    await userEvent.type(screen.getByPlaceholderText("蒂娜、雪莉"), "Bob{Enter}")
    await userEvent.click(screen.getByRole("button", { name: "建立" }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "日本旅遊",
        ownerUserId: "user-1",
        memberNames: ["Bob"],
        currency: "TWD",
      })
    })
  })

  it("owner 名稱不出現在 memberNames 中", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CreateBookSheet {...defaultProps} onSubmit={onSubmit} />)
    await openSheet()
    await userEvent.type(screen.getByPlaceholderText("日本旅遊、週五聚餐"), "測試")
    await userEvent.click(screen.getByRole("button", { name: "建立" }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          memberNames: expect.not.arrayContaining(["Alice"]),
        }),
      )
    })
  })
})

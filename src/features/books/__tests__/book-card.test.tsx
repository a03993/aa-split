import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { BookWithMembers } from "@/types/app.types"

import { BookCard } from "../components/book-card"

const baseBook: BookWithMembers = {
  id: "book-1",
  name: "台北旅遊",
  owner_id: "user-1",
  created_at: "2026-06-08T00:00:00.000Z",
  updated_at: "2026-06-08T00:00:00.000Z",
  settled_at: null,
  custom_categories: [],
  currency: "TWD",
  members: [
    {
      id: "member-1",
      book_id: "book-1",
      display_name: "Alice",
      profile_id: "user-1",
      created_at: "2026-06-08T00:00:00.000Z",
      profile: null,
    },
    {
      id: "member-2",
      book_id: "book-1",
      display_name: "Bob",
      profile_id: "user-2",
      created_at: "2026-06-08T00:00:00.000Z",
      profile: null,
    },
  ],
}

describe("BookCard", () => {
  it("顯示帳本名稱", () => {
    render(<BookCard book={baseBook} href="/group/book-1" />)
    expect(screen.getByText("台北旅遊")).toBeInTheDocument()
  })

  it("連結指向正確的 href", () => {
    render(<BookCard book={baseBook} href="/group/book-1" />)
    expect(screen.getByRole("link")).toHaveAttribute("href", "/group/book-1")
  })

  it("顯示成員首字母 Avatar", () => {
    render(<BookCard book={baseBook} href="/group/book-1" />)
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
  })

  it("未結算時不顯示「已結算」Badge", () => {
    render(<BookCard book={baseBook} href="/group/book-1" />)
    expect(screen.queryByText("已結算")).not.toBeInTheDocument()
  })

  it("已結算時顯示「已結算」Badge", () => {
    const settledBook = { ...baseBook, settled_at: "2026-06-09T00:00:00.000Z" }
    render(<BookCard book={settledBook} href="/group/book-1" />)
    expect(screen.getByText("已結算")).toBeInTheDocument()
  })

  it("日期格式為 yyyy/MM/dd", () => {
    render(<BookCard book={baseBook} href="/group/book-1" />)
    expect(screen.getByText("2026/06/08")).toBeInTheDocument()
  })

  it("5 個成員時顯示 4 個 Avatar 和 +1", () => {
    const fiveMembers = Array.from({ length: 5 }, (_, i) => ({
      id: `member-${i}`,
      book_id: "book-1",
      display_name: `Member${i}`,
      profile_id: `user-${i}`,
      created_at: "2026-06-08T00:00:00.000Z",
      profile: null,
    }))
    render(<BookCard book={{ ...baseBook, members: fiveMembers }} href="/group/book-1" />)
    expect(screen.getByText((_, el) => el?.textContent === "+1")).toBeInTheDocument()
    expect(screen.queryAllByText("M")).toHaveLength(4)
  })

  it("6 個成員時顯示 4 個 Avatar 和 +2", () => {
    const sixMembers = Array.from({ length: 6 }, (_, i) => ({
      id: `member-${i}`,
      book_id: "book-1",
      display_name: `Member${i}`,
      profile_id: `user-${i}`,
      created_at: "2026-06-08T00:00:00.000Z",
      profile: null,
    }))
    render(<BookCard book={{ ...baseBook, members: sixMembers }} href="/group/book-1" />)
    expect(screen.getByText((_, el) => el?.textContent === "+2")).toBeInTheDocument()
    expect(screen.queryAllByText("M")).toHaveLength(4)
  })

  it("4 個以下成員時不顯示 +N", () => {
    render(<BookCard book={baseBook} href="/group/book-1" />)
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
  })
})

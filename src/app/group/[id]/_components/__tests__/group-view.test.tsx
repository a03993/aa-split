import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GroupView } from "../group-view"

const notFoundMock = vi.fn()
const routerReplaceMock = vi.fn()

vi.mock("next/navigation", () => ({
  notFound: () => {
    notFoundMock()
    // next/navigation 的 notFound() 實際上是拋出特殊錯誤中斷 render，這裡模擬同樣行為
    throw new Error("NEXT_NOT_FOUND")
  },
  useRouter: () => ({ replace: routerReplaceMock }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

const useRequireAuthMock = vi.fn()
vi.mock("@/features/auth/use-auth", () => ({
  useRequireAuth: () => useRequireAuthMock(),
}))

const useBookBundleMock = vi.fn()
const useSettleBookMock = vi.fn()
vi.mock("@/features/books/books.queries", () => ({
  useBookBundle: (...args: unknown[]) => useBookBundleMock(...args),
  useSettleBook: () => useSettleBookMock(),
}))

const mutationStub = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false })
vi.mock("@/features/expenses/expenses.queries", () => ({
  useCreateExpense: () => mutationStub(),
  useDeleteExpense: () => mutationStub(),
  useUpdateExpense: () => mutationStub(),
}))

vi.mock("@/features/members/members.queries", () => ({
  useClaimMember: () => mutationStub(),
  useRemoveMember: () => mutationStub(),
  useUnclaimMember: () => mutationStub(),
  useAddMembers: () => mutationStub(),
}))

vi.mock("@/features/settlements/settlements.queries", () => ({
  useSettlementPlan: () => ({ balances: new Map(), transfers: [], debtSummary: [] }),
}))

vi.mock("@/infrastructure/liff/liff.factory", () => ({
  createLiffService: () => ({}),
}))
vi.mock("@/infrastructure/share/share.service", () => ({
  WebShareService: vi.fn().mockImplementation(() => ({ shareToLine: vi.fn() })),
}))

vi.mock("../mascot", () => ({ Mascot: () => <div data-testid="mascot" /> }))
vi.mock("../toolbar", () => ({ Toolbar: () => <div data-testid="toolbar" /> }))
vi.mock("@/features/members/components/claim-dialog", () => ({
  ClaimDialog: (props: { open: boolean }) => (
    <div data-testid="claim-dialog" data-open={props.open} />
  ),
}))
vi.mock("@/features/members/components/member-dialog", () => ({
  MemberDialog: () => <div data-testid="member-dialog" />,
}))
vi.mock("@/features/expenses/components/expense-detail-dialog", () => ({
  ExpenseDetailDialog: () => <div data-testid="expense-detail-dialog" />,
}))

const book = {
  id: "book-1",
  name: "旅遊",
  owner_id: "user-owner",
  settled_at: null,
  custom_categories: [],
  currency: "TWD",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
}

function makeMember(id: string, profileId: string | null) {
  return {
    id,
    book_id: "book-1",
    display_name: id,
    profile_id: profileId,
    created_at: "2026-06-01T00:00:00Z",
    profile: null,
  }
}

function makeBundle(members: ReturnType<typeof makeMember>[]) {
  return { book, members, expenses: [], settlements: [] }
}

describe("GroupView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRequireAuthMock.mockReturnValue({ user: { id: "user-self" } })
    useSettleBookMock.mockReturnValue(mutationStub())
  })

  it("目前使用者尚未認領且有未認領成員時，自動開啟 ClaimDialog", () => {
    useBookBundleMock.mockReturnValue({
      data: makeBundle([makeMember("m-owner", "user-owner"), makeMember("m-pending", null)]),
      error: null,
      isPending: false,
    })

    render(<GroupView bookId="book-1" />)

    expect(screen.getByTestId("claim-dialog")).toHaveAttribute("data-open", "true")
  })

  it("目前使用者已認領時，不自動開啟 ClaimDialog", () => {
    useBookBundleMock.mockReturnValue({
      data: makeBundle([makeMember("m-owner", "user-owner"), makeMember("m-self", "user-self")]),
      error: null,
      isPending: false,
    })

    render(<GroupView bookId="book-1" />)

    expect(screen.getByTestId("claim-dialog")).toHaveAttribute("data-open", "false")
  })

  it("目前使用者非成員且沒有未認領成員時，仍自動開啟 ClaimDialog（提供訪客瀏覽選項）", () => {
    useBookBundleMock.mockReturnValue({
      data: makeBundle([makeMember("m-owner", "user-owner")]),
      error: null,
      isPending: false,
    })

    render(<GroupView bookId="book-1" />)

    expect(screen.getByTestId("claim-dialog")).toHaveAttribute("data-open", "true")
  })

  it("載入完成後找不到帳本時呼叫 notFound()", () => {
    useBookBundleMock.mockReturnValue({
      data: { book: undefined, members: [], expenses: [], settlements: [] },
      error: null,
      isPending: false,
    })

    expect(() => render(<GroupView bookId="book-1" />)).toThrow("NEXT_NOT_FOUND")
    expect(notFoundMock).toHaveBeenCalled()
  })

  it("資料載入中時顯示 loading 畫面，不渲染 Toolbar", () => {
    useBookBundleMock.mockReturnValue({ data: undefined, error: null, isPending: true })

    render(<GroupView bookId="book-1" />)

    expect(screen.getByText("載入帳本資料中...")).toBeInTheDocument()
    expect(screen.queryByTestId("toolbar")).not.toBeInTheDocument()
  })
})

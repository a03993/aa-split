"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { notFound, useRouter } from "next/navigation"

import { toast } from "sonner"

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { isOwner, isSettled } from "@/domain/book"
import type { CreateExpenseInput } from "@/domain/expense/expense.repository"
import { canClaim } from "@/domain/member"
import { useRequireAuth } from "@/features/auth/use-auth"
import { useBookBundle, useSettleBook } from "@/features/books/books.queries"
import { ExpenseDetailDialog } from "@/features/expenses/components/expense-detail-dialog"
import {
  useCreateExpense,
  useDeleteExpense,
  useUpdateExpense,
} from "@/features/expenses/expenses.queries"
import { ClaimDialog } from "@/features/members/components/claim-dialog"
import { MemberDialog } from "@/features/members/components/member-dialog"
import {
  useAddMembers,
  useClaimMember,
  useRemoveMember,
  useUnclaimMember,
} from "@/features/members/members.queries"
import { useSettlementPlan } from "@/features/settlements/settlements.queries"
import { createLiffService } from "@/infrastructure/liff/liff.factory"
import { WebShareService } from "@/infrastructure/share/share.service"
import { formatCurrency } from "@/lib/format-currency"
import type { ExpenseWithDetails } from "@/types/app.types"

import { Mascot } from "./mascot"
import { Toolbar } from "./toolbar"

const shareService = new WebShareService(createLiffService())
const MAX_VISIBLE_MEMBERS = 7

interface GroupViewProps {
  bookId: string
}

export function GroupView({ bookId }: GroupViewProps) {
  const { user } = useRequireAuth()
  const router = useRouter()

  // 一次取得 book + members + expenses + settlements，取代 4 個獨立 hook 各自的 round trip。
  const { data: bundle, error: bundleError, isLoading: isBundleLoading } = useBookBundle(bookId)
  const book = bundle?.book ?? null
  // useMemo 保證未變動時參考穩定，避免下游 useMemo（currentMember/unclaimedMembers/totalAmount）誤判每次重算。
  const members = useMemo(() => bundle?.members ?? [], [bundle])
  const expenses = useMemo(() => bundle?.expenses ?? [], [bundle])
  const settlementRecords = bundle?.settlements ?? []

  const claimMember = useClaimMember()
  const updateExpense = useUpdateExpense()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()
  const removeMember = useRemoveMember()
  const unclaimMember = useUnclaimMember()
  const addMembers = useAddMembers()
  const settleBook = useSettleBook()

  const settlementPlan = useSettlementPlan(members, expenses)
  // 同一次結算的 rows 共用同一組換算設定，取第一筆有值的即可代表整批
  const settledConversion = settlementRecords.find((r) => r.settlement_currency && r.exchange_rate)

  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null)

  const currentMember = useMemo(
    () => members.find((m) => m.profile_id === user?.id),
    [user, members],
  )

  const unclaimedMembers = useMemo(() => members.filter(canClaim), [members])

  const claimAutoOpenedRef = useRef(false)

  useEffect(() => {
    if (isBundleLoading) return
    if (currentMember || unclaimedMembers.length === 0) return
    if (claimAutoOpenedRef.current) return
    claimAutoOpenedRef.current = true
    setClaimDialogOpen(true)
  }, [isBundleLoading, currentMember, unclaimedMembers.length])

  const totalAmount = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses])

  const memberIdsInExpenses = useMemo(() => {
    const ids = new Set<string>()
    expenses.forEach((e) => {
      ids.add(e.payer_member_id)
      e.expense_splits.forEach((s) => ids.add(s.member_id))
    })
    return ids
  }, [expenses])

  function handleClaim(memberId: string) {
    claimMember.mutate(
      { memberId, bookId },
      {
        onSuccess: () => {
          setClaimDialogOpen(false)
          toast.success("已加入帳本")
        },
        onError: () => toast.error("加入帳本失敗，請稍後再試"),
      },
    )
  }

  function handleRemoveMember(memberId: string) {
    removeMember.mutate(
      { memberId, bookId },
      {
        onSuccess: () => toast.success("已移除成員"),
        onError: () => toast.error("移除成員失敗，請稍後再試"),
      },
    )
  }

  function handleUnclaim(memberId: string) {
    unclaimMember.mutate(
      { memberId, bookId },
      {
        onSuccess: () => toast.success("已解除連結"),
        onError: () => toast.error("解除連結失敗，請稍後再試"),
      },
    )
  }

  function handleLeaveMember(memberId: string, onSuccess: () => void) {
    removeMember.mutate(
      { memberId, bookId },
      {
        onSuccess: () => {
          onSuccess()
          router.replace("/")
        },
        onError: () => toast.error("離開帳本失敗，請稍後再試"),
      },
    )
  }

  function handleAddMembers(displayNames: string[], onSuccess: () => void) {
    addMembers.mutate(
      { bookId, displayNames },
      {
        onSuccess: () => {
          onSuccess()
          toast.success("已新增成員")
        },
        onError: () => toast.error("新增成員失敗，請稍後再試"),
      },
    )
  }

  async function handleShare() {
    if (!book) return
    try {
      await shareService.shareToLine(bookId, book.name)
    } catch (err) {
      console.error(err)
      toast.error("分享失敗，請稍後再試")
    }
  }

  async function handleSettleConfirm(settlementCurrency?: string, exchangeRate?: number) {
    if (members.length === 0) return
    // 不在這裡 catch：讓錯誤傳給 SettlementSheet 的 handleConfirm，
    // 由它決定失敗時保持 sheet 開啟並顯示錯誤 toast。
    await settleBook.mutateAsync({ bookId, members, expenses, settlementCurrency, exchangeRate })
    toast.success("結算完成")
  }

  function handleDeleteExpense(expenseId: string) {
    deleteExpense.mutate(
      { expenseId, bookId },
      {
        onSuccess: () => {
          setSelectedExpense(null)
          toast.success("已刪除費用")
        },
        onError: () => toast.error("刪除費用失敗，請稍後再試"),
      },
    )
  }

  function handleAddExpense(data: CreateExpenseInput, notifyGroup: boolean) {
    createExpense.mutate(
      { input: data, notifyGroup },
      {
        onSuccess: () => toast.success("已新增費用"),
        onError: () => toast.error("新增費用失敗，請稍後再試"),
      },
    )
  }

  if (!user) return null

  if (bundleError) throw bundleError

  if (isBundleLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner label="載入帳本資料中..." />
      </div>
    )
  }

  if (!book) {
    notFound()
  }

  const bookIsSettled = isSettled(book)
  const bookIsOwner = isOwner(book, user.id)

  const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS)
  const extraCount = members.length - MAX_VISIBLE_MEMBERS

  const memberTrigger = (
    <Button variant="ghost" className="-ml-2 -mr-2">
      <AvatarGroup>
        {visibleMembers.map((member) => (
          <Avatar key={member.id} size="md">
            {member.profile?.avatar_url && <AvatarImage src={member.profile.avatar_url} />}
            <AvatarFallback>{member.display_name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        ))}
        {extraCount > 0 && <AvatarGroupCount>+{extraCount}</AvatarGroupCount>}
      </AvatarGroup>
    </Button>
  )

  return (
    <div className="flex flex-1 flex-col bg-muted/50">
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <MemberDialog
          members={members}
          currentUserId={user.id}
          ownerUserId={book.owner_id}
          isOwner={bookIsOwner}
          isSettled={bookIsSettled}
          memberIdsInExpenses={memberIdsInExpenses}
          trigger={memberTrigger}
          onRemove={handleRemoveMember}
          onUnclaim={handleUnclaim}
          onLeave={handleLeaveMember}
          onAdd={handleAddMembers}
        />
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground">總金額</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(totalAmount, book.currency)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center pb-20">
        <Mascot />
      </div>

      <Toolbar
        isSettled={bookIsSettled}
        bookId={bookId}
        members={members}
        customCategories={book.custom_categories}
        currentMemberId={currentMember?.id}
        book={book}
        expenses={expenses}
        settlementPlan={settlementPlan}
        settledCurrency={settledConversion?.settlement_currency ?? null}
        settledExchangeRate={settledConversion?.exchange_rate ?? null}
        onAddExpense={handleAddExpense}
        onSettleConfirm={handleSettleConfirm}
        onSelectExpense={setSelectedExpense}
        onShare={handleShare}
      />

      <ClaimDialog
        open={claimDialogOpen}
        unclaimedMembers={unclaimedMembers}
        onClaim={handleClaim}
        onContinueAsGuest={() => setClaimDialogOpen(false)}
      />

      {selectedExpense && (
        <ExpenseDetailDialog
          open
          expense={selectedExpense}
          members={members}
          currency={book.currency}
          customCategories={book.custom_categories}
          isSettled={bookIsSettled}
          onOpenChange={(open) => {
            if (!open) setSelectedExpense(null)
          }}
          onUpdate={(data, notifyGroup) => {
            updateExpense.mutate(
              { input: data, notifyGroup },
              {
                onSuccess: () => {
                  setSelectedExpense(null)
                  toast.success("已更新費用")
                },
                onError: () => toast.error("更新費用失敗，請稍後再試"),
              },
            )
          }}
          onDelete={() => handleDeleteExpense(selectedExpense.id)}
        />
      )}
    </div>
  )
}

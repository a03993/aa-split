"use client"

import { useMemo, useState } from "react"

import { Calculator } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Transfer } from "@/domain/settlement/settlement.calculator"
import { CURRENCIES } from "@/lib/currencies"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"
import type { Member } from "@/types/app.types"

interface SettlementSheetProps {
  members: Member[]
  balances: Map<string, number>
  transfers: Transfer[]
  currency: string
  onConfirm: (settlementCurrency?: string, exchangeRate?: number) => Promise<void> | void
  isSettled?: boolean
  isGuest?: boolean
  settledCurrency?: string | null
  settledExchangeRate?: number | null
}

export function SettlementSheet({
  members,
  balances,
  transfers,
  currency,
  onConfirm,
  isSettled = false,
  isGuest = false,
  settledCurrency,
  settledExchangeRate,
}: SettlementSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSettleConfirmOpen, setIsSettleConfirmOpen] = useState(false)
  const [enableConversion, setEnableConversion] = useState(false)
  const [settlementCurrency, setSettlementCurrency] = useState(currency)
  const [exchangeRateInput, setExchangeRateInput] = useState("")
  const [rateError, setRateError] = useState("")

  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])

  function getMemberName(id: string) {
    return memberMap.get(id)?.display_name ?? id
  }

  // 已結算：讀取當初存下的匯率顯示；未結算：讀取使用者目前輸入中的匯率。
  // 資料庫的正式帳目（settlements.amount）仍以花費貨幣（currency）為準，
  // 但換算開啟時，使用者實際要照著轉帳的數字是換算後金額，UI 主從順序需對調顯示。
  const displayCurrency = isSettled ? (settledCurrency ?? currency) : settlementCurrency

  function getConvertedAmount(amount: number): number | null {
    if (isSettled) {
      if (!settledExchangeRate || settledExchangeRate <= 0) return null
      return amount * settledExchangeRate
    }
    if (!enableConversion) return null
    const rate = Number(exchangeRateInput)
    if (!exchangeRateInput || Number.isNaN(rate) || rate <= 0) return null
    return amount * rate
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setEnableConversion(false)
      setSettlementCurrency(currency)
      setExchangeRateInput("")
      setRateError("")
    }
    setIsOpen(nextOpen)
  }

  function handleSettle() {
    if (enableConversion) {
      const rate = Number(exchangeRateInput)
      if (!exchangeRateInput || Number.isNaN(rate) || rate <= 0) {
        setRateError("請輸入正確匯率")
        return
      }
    }
    setRateError("")
    setIsSettleConfirmOpen(true)
  }

  async function handleConfirm() {
    try {
      await onConfirm(
        enableConversion ? settlementCurrency : undefined,
        enableConversion ? Number(exchangeRateInput) : undefined,
      )
      // 成功後才關閉兩個 sheet
      setIsSettleConfirmOpen(false)
      handleOpenChange(false)
    } catch {
      // 失敗時保持 sheet 開啟，讓用戶可以重試
      toast.error("結算失敗，請稍後再試")
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button size="icon-lg">
            <Calculator />
          </Button>
        </SheetTrigger>
        <SheetContent showCloseButton={isGuest || isSettled} className="h-[90dvh]">
          <SheetHeader>
            <SheetTitle>結算</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            <div className="flex flex-col gap-1">
              <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">
                收支結果
              </p>
              {members.every((m) => (balances.get(m.id) ?? 0) === 0) ? (
                <p className="py-2 text-sm text-muted-foreground">所有人收支平衡</p>
              ) : (
                members.map((member) => {
                  const balance = balances.get(member.id) ?? 0
                  if (balance === 0) return null
                  const isPositive = balance > 0
                  const isNegative = balance < 0
                  const converted = getConvertedAmount(balance)

                  return (
                    <div key={member.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar size="md">
                          {member.profile?.avatar_url && (
                            <AvatarImage src={member.profile.avatar_url} />
                          )}
                          <AvatarFallback>
                            {member.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-base font-normal text-foreground">
                          {member.display_name}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isPositive && "text-success",
                            isNegative && "text-destructive",
                            !isPositive && !isNegative && "text-muted-foreground",
                          )}
                        >
                          {isPositive ? "+" : ""}
                          {converted !== null
                            ? formatCurrency(converted, displayCurrency)
                            : formatCurrency(balance, currency)}
                        </span>
                        <span
                          className={cn(
                            "text-xs text-muted-foreground",
                            converted === null && "invisible",
                          )}
                        >
                          {formatCurrency(balance, currency)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex flex-col gap-1">
              <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">
                轉帳結果
              </p>
              {transfers.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">無需轉帳</p>
              ) : (
                transfers.map((transfer, i) => {
                  const fromMember = memberMap.get(transfer.fromMemberId)
                  const toMember = memberMap.get(transfer.toMemberId)
                  const converted = getConvertedAmount(transfer.amount)
                  return (
                    <div
                      key={`${transfer.fromMemberId}-${transfer.toMemberId}-${i}`}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Avatar size="sm">
                          {fromMember?.profile?.avatar_url && (
                            <AvatarImage src={fromMember.profile.avatar_url} />
                          )}
                          <AvatarFallback>
                            {getMemberName(transfer.fromMemberId).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {getMemberName(transfer.fromMemberId)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <Avatar size="sm">
                          {toMember?.profile?.avatar_url && (
                            <AvatarImage src={toMember.profile.avatar_url} />
                          )}
                          <AvatarFallback>
                            {getMemberName(transfer.toMemberId).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {getMemberName(transfer.toMemberId)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-foreground">
                          {converted !== null
                            ? formatCurrency(converted, displayCurrency)
                            : formatCurrency(transfer.amount, currency)}
                        </span>
                        <span
                          className={cn(
                            "text-xs text-muted-foreground",
                            converted === null && "invisible",
                          )}
                        >
                          {formatCurrency(transfer.amount, currency)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {!isSettled && !isGuest && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="enable-conversion"
                    checked={enableConversion}
                    onCheckedChange={(checked: boolean | "indeterminate") => {
                      const isChecked = checked === true
                      setEnableConversion(isChecked)
                      setRateError("")
                      if (isChecked) {
                        const fallback =
                          CURRENCIES.find((c) => c.code !== currency)?.code ?? currency
                        setSettlementCurrency(fallback)
                      }
                    }}
                  />
                  <Label htmlFor="enable-conversion" className="cursor-pointer text-sm">
                    以其他貨幣結算
                  </Label>
                </div>

                {enableConversion && (
                  <div className="flex gap-3">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor="currency">結算貨幣</Label>
                      <Select value={settlementCurrency} onValueChange={setSettlementCurrency}>
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.filter((c) => c.code !== currency).map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.code} · {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor="rate">
                        匯率（1 {currency} = ? {settlementCurrency}）
                      </Label>
                      <Input
                        id="rate"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.0001"
                        placeholder="0"
                        value={exchangeRateInput}
                        className={cn(rateError && "border-destructive")}
                        onChange={(e) => {
                          setExchangeRateInput(e.target.value)
                          setRateError("")
                        }}
                      />
                      {rateError && <p className="text-xs text-destructive">{rateError}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isGuest && !isSettled && (
            <SheetFooter className="flex-col gap-2">
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => handleOpenChange(false)}>
                  取消
                </Button>
                <Button className="flex-1" onClick={handleSettle}>
                  確認結算
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={isSettleConfirmOpen} onOpenChange={setIsSettleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認結算</AlertDialogTitle>
            <AlertDialogDescription>
              確認要結算嗎？結算後帳本將無法編輯，此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            {/* preventDefault 阻止 Radix 自動關閉，由 handleConfirm 在成功後手動關閉 */}
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleConfirm()
              }}
            >
              確認
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

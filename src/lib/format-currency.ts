import { getCurrencySymbol } from "@/lib/currencies"

// 用 Intl 取得正確的小數位數/千分位，符號則換成 getCurrencySymbol 的自訂版本
// （避免 TWD 在 zh-TW locale 下顯示成跟 USD 一樣的 "$"）。
export function formatCurrency(amount: number, currency: string): string {
  const parts = new Intl.NumberFormat("zh-TW", { style: "currency", currency }).formatToParts(
    amount,
  )
  return parts
    .map((part) => (part.type === "currency" ? getCurrencySymbol(currency) : part.value))
    .join("")
}

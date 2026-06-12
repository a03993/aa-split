export const CURRENCIES = [
  { code: "TWD", label: "新台幣" },
  { code: "JPY", label: "日圓" },
  { code: "USD", label: "美元" },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]["code"]

export const DEFAULT_CURRENCY: CurrencyCode = "TWD"

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  TWD: "NT$",
  JPY: "JP¥",
  USD: "US$",
}

export function getCurrencySymbol(currency: string): string {
  if (currency in CURRENCY_SYMBOLS) {
    return CURRENCY_SYMBOLS[currency as CurrencyCode]
  }
  const part = new Intl.NumberFormat("zh-TW", { style: "currency", currency })
    .formatToParts(0)
    .find((p) => p.type === "currency")
  return part?.value ?? currency
}

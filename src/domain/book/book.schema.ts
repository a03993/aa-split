import { z } from "zod"

import { CURRENCIES } from "@/lib/currencies"

const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [string, ...string[]]

export const createBookSchema = z.object({
  bookTitle: z.string().min(1, "帳本名稱不能為空").max(20, "帳本名稱最多 20 個字元"),

  memberNames: z
    .array(z.string().min(1, "成員名稱不能為空").max(20, "成員名稱最多 20 個字元"))
    .min(0),

  currency: z.enum(CURRENCY_CODES, { message: "請選擇幣別" }),
})

export type CreateBookFormValues = z.infer<typeof createBookSchema>

import { z } from "zod"

const splitItemSchema = z.object({
  memberId: z.string().uuid("成員 ID 格式錯誤"),
  amount: z.number({ invalid_type_error: "請輸入金額" }).nonnegative("金額不能為負數"),
})

/**
 * API boundary 驗證 schema，用於 Server Action 或 API Route 接收費用建立請求時驗證入站資料。
 * 與 features/expenses/use-expense-form.ts 的 expenseFormSchema 用途不同：
 * - 此 schema 驗證已組裝完成的 API payload（含 splits、UUID 格式）
 * - expenseFormSchema 驗證 UI 表單中間狀態（含 participantIds，不含 splits）
 */
export const createExpenseSchema = z.object({
  title: z.string().min(1, "請輸入費用名稱"),
  category: z.string().min(1, "請選擇分類"),
  amount: z.number({ invalid_type_error: "請輸入金額" }).positive("金額必須大於 0"),
  payerMemberId: z.string().uuid("請選擇付款人"),
  splitMode: z.enum(["equal", "custom"], {
    errorMap: () => ({ message: "請選擇分攤方式" }),
  }),
  splits: z.array(splitItemSchema),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式應為 YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "時間格式應為 HH:MM 或 HH:MM:SS"),
})

export type CreateExpenseFormValues = z.infer<typeof createExpenseSchema>

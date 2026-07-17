// 雙重條件防護：
// - NEXT_PUBLIC_ENV=local：本地開發模式，使用 mock repository，不需要 Supabase 環境變數。
// - NODE_ENV !== 'production'：安全防護，確保即使 NEXT_PUBLIC_ENV=local 被誤帶上線，
//   正式環境仍強制使用 Supabase repository，防止以 mock 資料運行。
export const IS_LOCAL =
  process.env.NEXT_PUBLIC_ENV === "local" && process.env.NODE_ENV !== "production"

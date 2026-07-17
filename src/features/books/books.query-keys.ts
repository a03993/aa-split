// 沒有 "use client"：Server Component（如 group/[id]/page.tsx 的 prefetchQuery）
// 跟 client 端的 useBookBundle 都要引用同一份 key，兩邊 key 值必須完全一致，
// hydration 才配對得上。若寫進 "use client" 檔案，Server Component 沒辦法安全 import 這個值。
export const bookKeys = {
  all: ["books"] as const,
  byUser: (userId: string) => ["books", "user", userId] as const,
  detail: (bookId: string) => ["books", bookId] as const,
  bundle: (bookId: string) => ["books", "bundle", bookId] as const,
}

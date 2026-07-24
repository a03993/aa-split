import { cache } from "react"

import { IS_LOCAL } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { BookBundle } from "@/types/app.types"

import { fetchBookBundleLocal, fetchBookBundleRpc } from "./books.bundle"

// Server Component 專用：用帶 cookie 的 server client 在首屏 SSR 階段預抓資料，
// 透過 dehydrate 餵給 client 端 useBookBundle 的 cache，省掉一次 client round trip。
// generateMetadata 和 page 同一個 request 內都會呼叫這支，用同一個 bookId 查兩次
export const prefetchBookBundle = cache(async function prefetchBookBundle(
  bookId: string,
): Promise<BookBundle> {
  if (IS_LOCAL) {
    return fetchBookBundleLocal(bookId)
  }

  const supabase = await createClient()

  return fetchBookBundleRpc(supabase, bookId)
})

import type { BookRepository } from "@/domain/book/book.repository"
import type { ExpenseRepository } from "@/domain/expense/expense.repository"
import type { MemberRepository } from "@/domain/member/member.repository"
import type { SettlementRepository } from "@/domain/settlement/settlement.repository"

import {
  MockBookRepository,
  MockExpenseRepository,
  MockMemberRepository,
  MockSettlementRepository,
} from "./mock"

// 雙重條件防護：
// - NEXT_PUBLIC_ENV=local：本地開發模式，使用 mock repository，不需要 Supabase 環境變數。
// - NODE_ENV !== 'production'：安全防護，確保即使 NEXT_PUBLIC_ENV=local 被誤帶上線，
//   正式環境仍強制使用 Supabase repository，防止以 mock 資料運行。
const IS_LOCAL = process.env.NEXT_PUBLIC_ENV === "local" && process.env.NODE_ENV !== "production"

export function createBookRepository(): BookRepository {
  if (IS_LOCAL) {
    return new MockBookRepository()
  }
  // 使用 require() 而非靜態 import：防止本地模式下 Next.js bundle 解析 Supabase 環境變數，
  // 避免在未設定環境變數的情況下出現 build 錯誤。
  const { createClient } = require("@/lib/supabase/client") as {
    createClient: () => import("@supabase/supabase-js").SupabaseClient
  }
  const { SupabaseBookRepository } = require("./supabase/book.repository") as {
    SupabaseBookRepository: new (
      client: import("@supabase/supabase-js").SupabaseClient,
    ) => BookRepository
  }
  return new SupabaseBookRepository(createClient())
}

export function createMemberRepository(): MemberRepository {
  if (IS_LOCAL) {
    return new MockMemberRepository()
  }
  // 使用 require() 而非靜態 import：防止本地模式下 Next.js bundle 解析 Supabase 環境變數。
  const { createClient } = require("@/lib/supabase/client") as {
    createClient: () => import("@supabase/supabase-js").SupabaseClient
  }
  const { SupabaseMemberRepository } = require("./supabase/member.repository") as {
    SupabaseMemberRepository: new (
      client: import("@supabase/supabase-js").SupabaseClient,
    ) => MemberRepository
  }
  return new SupabaseMemberRepository(createClient())
}

export function createExpenseRepository(): ExpenseRepository {
  if (IS_LOCAL) {
    return new MockExpenseRepository()
  }
  // 使用 require() 而非靜態 import：防止本地模式下 Next.js bundle 解析 Supabase 環境變數。
  const { createClient } = require("@/lib/supabase/client") as {
    createClient: () => import("@supabase/supabase-js").SupabaseClient
  }
  const { SupabaseExpenseRepository } = require("./supabase/expense.repository") as {
    SupabaseExpenseRepository: new (
      client: import("@supabase/supabase-js").SupabaseClient,
    ) => ExpenseRepository
  }
  return new SupabaseExpenseRepository(createClient())
}

export function createSettlementRepository(): SettlementRepository {
  if (IS_LOCAL) {
    return new MockSettlementRepository()
  }
  // 使用 require() 而非靜態 import：防止本地模式下 Next.js bundle 解析 Supabase 環境變數。
  const { createClient } = require("@/lib/supabase/client") as {
    createClient: () => import("@supabase/supabase-js").SupabaseClient
  }
  const { SupabaseSettlementRepository } = require("./supabase/settlement.repository") as {
    SupabaseSettlementRepository: new (
      client: import("@supabase/supabase-js").SupabaseClient,
    ) => SettlementRepository
  }
  return new SupabaseSettlementRepository(createClient())
}

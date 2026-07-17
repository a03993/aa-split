import type { BookRepository } from "@/domain/book/book.repository"
import type { ExpenseRepository } from "@/domain/expense/expense.repository"
import type { MemberRepository } from "@/domain/member/member.repository"
import type { SettlementRepository } from "@/domain/settlement/settlement.repository"
import { IS_LOCAL } from "@/lib/env"

import {
  MockBookRepository,
  MockExpenseRepository,
  MockMemberRepository,
  MockSettlementRepository,
} from "./mock"

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

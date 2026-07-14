"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { bookKeys } from "@/features/books/books.queries"
import { createMemberRepository } from "@/infrastructure/repository.factory"
import type { Member, MemberRow } from "@/types/app.types"

import { MemberService } from "./members.service"

export const memberKeys = {
  all: ["members"] as const,
  byBook: (bookId: string) => ["members", "book", bookId] as const,
}

// 每次 mutation 都重新呼叫工廠函式建立新的 service 實例，避免 stale closure 問題。
// 不使用模組層級 singleton，以確保每次呼叫都取得最新的 Supabase client 狀態。
function createMemberService(): MemberService {
  const repo = createMemberRepository()
  return new MemberService(repo)
}

export function useMembers(bookId: string | undefined) {
  return useQuery<Member[], Error>({
    queryKey: memberKeys.byBook(bookId ?? ""),
    queryFn: async () => {
      const service = createMemberService()
      return service.getMembers(bookId!)
    },
    enabled: !!bookId,
  })
}

export function useClaimMember() {
  const queryClient = useQueryClient()

  return useMutation<MemberRow, Error, { memberId: string; bookId: string }>({
    mutationFn: async ({ memberId }) => {
      const service = createMemberService()
      return service.claimMember(memberId)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.byBook(variables.bookId) })
      // 同時清除帳本快取，因為 BookWithMembers 內嵌了 members 資料。
      void queryClient.invalidateQueries({ queryKey: ["books", variables.bookId] })
      void queryClient.invalidateQueries({ queryKey: bookKeys.bundle(variables.bookId) })
      // 同時清除首頁帳本列表快取，因為 claim/unclaim/加入/移除成員都會改變使用者能看到哪些帳本。
      void queryClient.invalidateQueries({ queryKey: bookKeys.all })
    },
  })
}

export function useAddMember() {
  const queryClient = useQueryClient()

  return useMutation<MemberRow, Error, { bookId: string; displayName: string }>({
    mutationFn: async ({ bookId, displayName }) => {
      const service = createMemberService()
      return service.addMember(bookId, displayName)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.byBook(variables.bookId) })
      // 同時清除帳本快取，因為 BookWithMembers 內嵌了 members 資料。
      void queryClient.invalidateQueries({ queryKey: ["books", variables.bookId] })
      void queryClient.invalidateQueries({ queryKey: bookKeys.bundle(variables.bookId) })
      // 同時清除首頁帳本列表快取，因為 claim/unclaim/加入/移除成員都會改變使用者能看到哪些帳本。
      void queryClient.invalidateQueries({ queryKey: bookKeys.all })
    },
  })
}

// 批次新增多位成員：並行發送所有請求，全部完成後才做一次 cache invalidation，
// 避免 N 人新增觸發 N 次 re-fetch。
// 已知限制：使用 Promise.all，任一請求失敗則整體視為失敗（不支援部分成功）。
// 已成功新增的成員仍會存入 DB，但 UI 不會反映，需用戶重試或手動刷新。
export function useAddMembers() {
  const queryClient = useQueryClient()

  return useMutation<MemberRow[], Error, { bookId: string; displayNames: string[] }>({
    mutationFn: async ({ bookId, displayNames }) => {
      const service = createMemberService()
      return Promise.all(displayNames.map((name) => service.addMember(bookId, name)))
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.byBook(variables.bookId) })
      void queryClient.invalidateQueries({ queryKey: ["books", variables.bookId] })
      void queryClient.invalidateQueries({ queryKey: bookKeys.bundle(variables.bookId) })
      // 同時清除首頁帳本列表快取，因為 claim/unclaim/加入/移除成員都會改變使用者能看到哪些帳本。
      void queryClient.invalidateQueries({ queryKey: bookKeys.all })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { memberId: string; bookId: string }>({
    mutationFn: async ({ memberId }) => {
      const service = createMemberService()
      return service.removeMember(memberId)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.byBook(variables.bookId) })
      // 同時清除帳本快取，因為 BookWithMembers 內嵌了 members 資料。
      void queryClient.invalidateQueries({ queryKey: ["books", variables.bookId] })
      void queryClient.invalidateQueries({ queryKey: bookKeys.bundle(variables.bookId) })
      // 同時清除首頁帳本列表快取，因為 claim/unclaim/加入/移除成員都會改變使用者能看到哪些帳本。
      void queryClient.invalidateQueries({ queryKey: bookKeys.all })
    },
  })
}

export function useUnclaimMember() {
  const queryClient = useQueryClient()

  return useMutation<MemberRow, Error, { memberId: string; bookId: string }>({
    mutationFn: async ({ memberId }) => {
      const service = createMemberService()
      return service.unclaimMember(memberId)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.byBook(variables.bookId) })
      // 同時清除帳本快取，因為 BookWithMembers 內嵌了 members 資料。
      void queryClient.invalidateQueries({ queryKey: ["books", variables.bookId] })
      void queryClient.invalidateQueries({ queryKey: bookKeys.bundle(variables.bookId) })
      // 同時清除首頁帳本列表快取，因為 claim/unclaim/加入/移除成員都會改變使用者能看到哪些帳本。
      void queryClient.invalidateQueries({ queryKey: bookKeys.all })
    },
  })
}

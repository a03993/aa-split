"use client"

import { useEffect } from "react"

import { useRouter } from "next/navigation"

import { useShallow } from "zustand/react/shallow"

import type { AuthUser } from "./auth.service"
import type { AuthStatus } from "./auth.store"
import { useAuthStore } from "./auth.store"

export function useAuth(): {
  user: AuthUser | null
  status: AuthStatus
  isAuthenticated: boolean
} {
  const { user, status } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      status: state.status,
    })),
  )

  return { user, status, isAuthenticated: status === "authenticated" }
}

export function useRequireAuth(): { user: AuthUser | null } {
  const { user, status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 只有真的無法自動登入（不在 LINE App 內 / 設定缺失 / bootstrap 失敗）才導頁。
    // "loading" 跟 "redirecting" 期間維持現狀（消費端顯示 Spinner），
    // 不能在 liff.login() 的自動 redirect 完成前搶先把使用者導去 landing。
    if (status === "out-of-client") {
      router.replace("/landing?reason=auth_required")
    }
  }, [status, router])

  return { user }
}

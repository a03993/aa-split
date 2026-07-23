"use client"

import { useEffect } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // loading/redirecting 期間不能導頁，會搶在 liff.login() 的自動 redirect 完成前跳走
    if (status === "out-of-client" || status === "error") {
      const search = searchParams.toString()
      const next = search ? `${pathname}?${search}` : pathname

      router.replace(`/login?next=${encodeURIComponent(next)}`)
    }
  }, [status, router, pathname, searchParams])

  return { user }
}

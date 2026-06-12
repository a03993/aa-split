"use client"

import { useEffect } from "react"

import { useRouter } from "next/navigation"

import { useShallow } from "zustand/react/shallow"

import type { AuthUser } from "./auth.service"
import { useAuthStore } from "./auth.store"

export function useAuth(): {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
} {
  const { user, isLoading } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isLoading: state.isLoading,
    })),
  )

  return { user, isLoading, isAuthenticated: user !== null }
}

export function useRequireAuth(): { user: AuthUser | null } {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/landing?reason=auth_required")
    }
  }, [isLoading, isAuthenticated, router])

  return { user }
}

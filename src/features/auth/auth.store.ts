import { create } from "zustand"

import type { AuthUser } from "./auth.service"

// redirecting：在 LINE App 內，liff.login() 正在把整頁導去 LINE 授權（非錯誤狀態）
// out-of-client：無法自動登入（不在 LINE App 內 / LIFF 設定缺失 / bootstrap 發生錯誤）
export type AuthStatus = "loading" | "authenticated" | "redirecting" | "out-of-client"

interface AuthState {
  user: AuthUser | null
  status: AuthStatus

  setAuthenticated: (user: AuthUser) => void
  setRedirecting: () => void
  setOutOfClient: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  setAuthenticated: (user) => set({ user, status: "authenticated" }),
  setRedirecting: () => set({ user: null, status: "redirecting" }),
  setOutOfClient: () => set({ user: null, status: "out-of-client" }),
}))

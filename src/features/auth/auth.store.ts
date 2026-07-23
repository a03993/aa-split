import { create } from "zustand"

import type { AuthUser } from "./auth.service"

// redirecting：在 LINE App 內，liff.login() 正在把整頁導去 LINE 授權（非錯誤狀態）
// out-of-client：無法自動登入（不在 LINE App 內 / LIFF 設定缺失）
// error：確定在 LINE App 內，但 bootstrap 過程發生非預期錯誤（網路、token exchange 等）
export type AuthStatus = "loading" | "authenticated" | "redirecting" | "out-of-client" | "error"

interface AuthState {
  user: AuthUser | null
  status: AuthStatus

  setAuthenticated: (user: AuthUser) => void
  setRedirecting: () => void
  setOutOfClient: () => void
  setError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  setAuthenticated: (user) => set({ user, status: "authenticated" }),
  setRedirecting: () => set({ user: null, status: "redirecting" }),
  setOutOfClient: () => set({ user: null, status: "out-of-client" }),
  setError: () => set({ user: null, status: "error" }),
}))

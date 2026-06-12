import { create } from "zustand"

import type { AuthUser } from "./auth.service"

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  // isInitialized：bootstrap 流程已執行完畢（無論成功/失敗）。
  // false  = 尚未初始化（頁面剛載入，bootstrap 還在進行）
  // true   = 已確認狀態（user 非 null 表示已登入，null 表示確認未登入）
  isInitialized: boolean

  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) =>
    set({
      user,
      isLoading: false,
      isInitialized: true,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}))

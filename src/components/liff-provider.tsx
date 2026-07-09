"use client"

import { useEffect, useRef } from "react"

import { AuthService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"
import { createLiffService } from "@/infrastructure/liff/liff.factory"
import { MOCK_USER_ID, MOCK_USER_NAME } from "@/infrastructure/mock"
import { createClient } from "@/lib/supabase/client"

interface LiffProviderProps {
  children: React.ReactNode
  liffId: string
}

/**
 * 掛載時啟動 LIFF + LINE 登入 + Supabase session 初始化流程。
 * 本地環境（NEXT_PUBLIC_ENV=local）使用 MockLiffService，不需要真實 LINE 登入。
 * 此元件本身不渲染載入畫面；消費端請從 useAuthStore 的 status 判斷載入狀態。
 */
export function LiffProvider({ children, liffId }: LiffProviderProps) {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const setRedirecting = useAuthStore((s) => s.setRedirecting)
  const setOutOfClient = useAuthStore((s) => s.setOutOfClient)
  const initialised = useRef(false)

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    async function bootstrap() {
      if (process.env.NEXT_PUBLIC_ENV !== "local" && !liffId) {
        console.error("[LiffProvider] NEXT_PUBLIC_LIFF_ID 未設定")
        setOutOfClient()
        return
      }

      // 安全防護：無論 NEXT_PUBLIC_ENV 的值為何，mock 登入在 NODE_ENV=production 時一律停用，
      // 防止環境變數設定錯誤導致正式環境以 mock 用戶身份運行。
      if (process.env.NEXT_PUBLIC_ENV === "local" && process.env.NODE_ENV !== "production") {
        setAuthenticated({
          id: MOCK_USER_ID,
          displayName: MOCK_USER_NAME,
          avatarUrl: "",
          lineUserId: null,
        })
        return
      }

      try {
        const liffService = createLiffService()
        const supabase = createClient()
        const authService = new AuthService(liffService, supabase)

        const result = await authService.initialize(liffId)
        switch (result.status) {
          case "authenticated":
            setAuthenticated(result.user)
            break
          case "redirecting":
            setRedirecting()
            break
          case "out-of-client":
            setOutOfClient()
            break
        }
      } catch (err) {
        console.error("[LiffProvider] bootstrap 錯誤:", err)
        setOutOfClient()
      }
    }

    void bootstrap()
    // liffId 是建置時常數（NEXT_PUBLIC_LIFF_ID），執行時不會變更。
    // 使用 initialised.current 防止重複執行；列出 deps 是為了滿足 exhaustive-deps lint 規則。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liffId, setAuthenticated, setRedirecting, setOutOfClient])

  return <>{children}</>
}

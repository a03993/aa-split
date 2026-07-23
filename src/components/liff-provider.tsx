"use client"

import { useEffect, useRef } from "react"

import { createAuthService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"
import { createLiffService } from "@/infrastructure/liff/liff.factory"
import { MOCK_USER_ID, MOCK_USER_NAME } from "@/infrastructure/mock"
import { createClient } from "@/lib/supabase/client"

interface LiffProviderProps {
  children: React.ReactNode
  liffId: string
}

// 本身不渲染載入畫面，消費端從 useAuthStore 的 status 判斷載入狀態。
export function LiffProvider({ children, liffId }: LiffProviderProps) {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const setRedirecting = useAuthStore((s) => s.setRedirecting)
  const setOutOfClient = useAuthStore((s) => s.setOutOfClient)
  const setError = useAuthStore((s) => s.setError)

  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) {
      return
    }

    initialized.current = true

    async function bootstrap() {
      if (process.env.NEXT_PUBLIC_ENV === "local") {
        // Mock 登入在 NODE_ENV=production 時一律停用，防止環境變數設錯導致正式環境跑 mock 用戶
        if (process.env.NODE_ENV !== "production") {
          setAuthenticated({
            id: MOCK_USER_ID,
            displayName: MOCK_USER_NAME,
            avatarUrl: "",
            lineUserId: null,
          })

          return
        }
      } else if (!liffId) {
        // 不是本地環境但缺失 liffId
        console.error("[LiffProvider] NEXT_PUBLIC_LIFF_ID 未設定")

        // 沒有 ID 可呼叫 liff.init()，用 UA 判斷是否在 LINE App 內
        const isLineClient = /\bLine\//.test(navigator.userAgent)

        if (isLineClient) {
          setError()
        } else {
          setOutOfClient()
        }
        return
      }

      // 正式環境且有 liffId
      const liffService = createLiffService()

      try {
        const supabase = createClient()
        const authService = createAuthService(liffService, supabase)

        const res = await authService.initialize(liffId)

        switch (res.status) {
          case "authenticated":
            setAuthenticated(res.user)
            break
          case "redirecting":
            setRedirecting()
            break
          case "out-of-client":
            setOutOfClient()
            break
        }
      } catch (err) {
        console.error(err)

        if (liffService.isInClient()) {
          setError()
        } else {
          setOutOfClient()
        }
      }
    }

    void bootstrap()
  }, [liffId, setAuthenticated, setRedirecting, setOutOfClient, setError])

  return <>{children}</>
}

"use client"

import { useEffect } from "react"

import type { Route } from "next"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/features/auth/use-auth"
import { createLiffService } from "@/infrastructure/liff/liff.factory"

// 只允許站內相對路徑，避免 next 參數被用來做 open redirect
// （例如 /login?next=https://evil.com 或 /login?next=//evil.com）。
function sanitizeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/"
  }
  return raw
}

export function LoginView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useAuth()
  const next = sanitizeNextPath(searchParams.get("next"))

  useEffect(() => {
    if (status === "authenticated") {
      // next 已由 sanitizeNextPath 驗證為站內相對路徑，此處轉型是安全的。
      router.replace(next as Route)
    }
  }, [status, next, router])

  const handleLineLogin = () => {
    const liffService = createLiffService()
    const redirectUri = `${window.location.origin}/login?next=${encodeURIComponent(next)}`

    liffService.login({ redirectUri })
  }

  if (status === "loading" || status === "redirecting" || status === "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner label="正在確認身分..." />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">登入 AA Split</h1>
        <p className="text-sm text-muted-foreground">選擇登入方式以繼續</p>
      </div>

      <Button className="w-full max-w-xs bg-[#06C755] text-white" onClick={handleLineLogin}>
        使用 LINE 登入
      </Button>
    </div>
  )
}

"use client"

import { useEffect } from "react"

import { useSearchParams } from "next/navigation"

import { toast } from "sonner"

export function LandingView() {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")

  useEffect(() => {
    if (reason === "auth_required") {
      // 使用 unique id 避免在 React 嚴格模式（Strict Mode）下重複顯示兩個 Toast
      toast.error("請先登入以使用此功能", {
        id: "auth-required-toast",
      })
    }
  }, [reason])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight">AA Split</h1>
      <p className="text-sm text-muted-foreground">請透過 LINE 開啟此應用程式</p>
    </div>
  )
}

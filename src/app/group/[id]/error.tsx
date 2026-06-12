"use client"

import { useEffect } from "react"

import { ErrorDisplay } from "@/components/error-display"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GroupError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorDisplay
      title="無法載入群組"
      message={error.message || "發生未知錯誤，請稍後再試"}
      onRetry={reset}
    />
  )
}

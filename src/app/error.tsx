"use client"

import { useEffect } from "react"

import { ErrorDisplay } from "@/components/error-display"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <ErrorDisplay title="發生錯誤" message={error.message} onRetry={reset} />
}

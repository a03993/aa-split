"use client"

import { Button } from "@/components/ui/button"

interface ErrorDisplayProps {
  title: string
  message?: string
  onRetry: () => void
}

export function ErrorDisplay({ title, message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <p className="text-xl font-semibold">{title}</p>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Button onClick={onRetry}>重試</Button>
    </div>
  )
}

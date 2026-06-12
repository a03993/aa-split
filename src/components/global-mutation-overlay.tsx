"use client"

import { useIsMutating } from "@tanstack/react-query"

import { Spinner } from "@/components/ui/spinner"

export function GlobalMutationOverlay() {
  const isMutating = useIsMutating()

  if (isMutating === 0) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60">
      <Spinner />
    </div>
  )
}

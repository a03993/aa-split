import Link from "next/link"

import { Button } from "@/components/ui/button"

// TODO: 目前為假文案，正式行銷文案待補。
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">AA Split</h1>
        <p className="text-sm text-muted-foreground">輕鬆記帳、公平分帳，跟朋友出遊不再算不清</p>
      </div>

      <Button asChild size="default" className="w-full max-w-xs">
        <Link href="/login">開始使用</Link>
      </Button>
    </div>
  )
}

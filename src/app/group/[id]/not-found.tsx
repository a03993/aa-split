import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function GroupNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <p className="text-xl font-semibold">找不到帳本</p>
      <p className="text-sm text-muted-foreground">此帳本不存在，或已被移除</p>
      <Button asChild>
        <Link href="/">回到首頁</Link>
      </Button>
    </div>
  )
}

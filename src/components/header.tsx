"use client"

import { useParams, usePathname, useRouter } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/use-auth"
import { useBook } from "@/features/books/books.queries"

function toStringParam(value: string | string[] | undefined): string {
  if (typeof value !== "string") {
    return ""
  }

  return value
}

export function Header() {
  const pathname = usePathname()
  const params = useParams()

  const bookId = toStringParam(params.id)
  const isGroupPage = pathname.startsWith("/group/")

  return (
    // pt-[env(safe-area-inset-top)]：有劉海時撐開 header 頂部，無劉海時 env() 為 0 不影響高度
    // min-h-14：確保基礎高度 56px，劉海機型會更高
    <header className="sticky top-0 z-10 flex min-h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 pt-[env(safe-area-inset-top)]">
      {isGroupPage && bookId ? <BookBreadcrumb bookId={bookId} /> : <Logo />}
      <UserMenu />
    </header>
  )
}

// TODO: 替換成正式 logo
function Logo() {
  return <span className="text-2xl font-bold tracking-tight text-foreground">AA</span>
}

function BookBreadcrumb({ bookId }: { bookId: string }) {
  const router = useRouter()
  const { data: book, isPending } = useBook(bookId)

  // TODO: pending 樣式
  if (isPending) {
    return <div className="h-5 w-32 animate-pulse rounded bg-muted" />
  }

  // 帳本不存在（已刪除/URL 錯誤）：跟非 group page 時一致，顯示 logo 而非留白
  if (!book) {
    return <Logo />
  }

  return (
    <div className="flex items-center">
      <Button variant="ghost" size="icon-md" onClick={() => router.replace("/")}>
        <ArrowLeft />
      </Button>
      <span className="font-semibold text-foreground">{book.name}</span>
    </div>
  )
}

// TODO: 加上 dropdown（個人檔案、收款方式等功能）
function UserMenu() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{user.displayName}</span>
      <Avatar size="md">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
        <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
  )
}

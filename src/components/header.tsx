"use client"

import { useParams, usePathname, useRouter } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/use-auth"
import { useBook } from "@/features/books/books.queries"

function CurrentUserDisplay() {
  const { user } = useAuth()
  if (!user) return null
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

function BookBreadcrumb({ bookId }: { bookId: string }) {
  const router = useRouter()
  const { data: book, isLoading } = useBook(bookId)

  if (isLoading) {
    return <div className="h-5 w-32 animate-pulse rounded bg-muted" />
  }
  if (!book) return null

  return (
    <div className="flex items-center">
      <Button variant="ghost" size="icon-md" onClick={router.back}>
        <ArrowLeft />
      </Button>
      <span className="font-semibold text-foreground">{book.name}</span>
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const params = useParams()

  const bookId = typeof params?.id === "string" ? params.id : ""
  const isGroupPage = pathname.startsWith("/group/")

  return (
    // pt-[env(safe-area-inset-top)]：有劉海時撐開 header 頂部，無劉海時 env() 為 0 不影響高度
    // min-h-14：確保基礎高度 56px，劉海機型會更高
    <header className="sticky top-0 z-10 flex min-h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 pt-[env(safe-area-inset-top)]">
      {isGroupPage && bookId ? (
        <BookBreadcrumb bookId={bookId} />
      ) : (
        <span className="text-2xl font-bold tracking-tight text-foreground">AA</span>
      )}
      <CurrentUserDisplay />
    </header>
  )
}

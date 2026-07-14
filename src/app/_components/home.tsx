"use client"

import { toast } from "sonner"

import { Spinner } from "@/components/ui/spinner"
import type { CreateBookInput } from "@/domain/book/book.repository"
import { useRequireAuth } from "@/features/auth/use-auth"
import { useCreateBook, useUserBooks } from "@/features/books/books.queries"
import { BookCard } from "@/features/books/components/book-card"
import { CreateBookSheet } from "@/features/books/components/create-book-sheet"

export function Home() {
  const { user } = useRequireAuth()
  const { data: books, isPending: isBooksPending } = useUserBooks(user?.id)
  const createBook = useCreateBook()

  const handleCreateBook = async (data: CreateBookInput) => {
    await createBook.mutateAsync(data)
    toast.success("已建立帳本")
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner label="正在確認身分..." />
      </div>
    )
  }

  if (isBooksPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner label="正在載入帳本..." />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {books && books.length > 0 ? (
          books.map((book) => <BookCard key={book.id} book={book} href={`/group/${book.id}`} />)
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 py-24 text-center">
            <p className="text-base font-semibold text-foreground">目前沒有任何帳本</p>
            <p className="text-sm text-muted-foreground">點擊右下角 + 立即建立新帳本</p>
          </div>
        )}
      </div>

      <CreateBookSheet
        currentUserId={user.id}
        currentUserName={user.displayName}
        onSubmit={handleCreateBook}
      />
    </>
  )
}

import type { Metadata } from "next"

import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query"

import { prefetchBookBundle } from "@/features/books/books.queries.server"
import { bookKeys } from "@/features/books/books.query-keys"
import { SHARE_INVITE_LABEL } from "@/infrastructure/share/share.service"

import { GroupView } from "./_components/group-view"

interface GroupPageProps {
  params: Promise<{ id: string }>
}

// LINE 分享連結預覽卡片抓的是網址的 OG title/description，不是 shareToLine 傳的 bookName
export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const { id } = await params
  const bundle = await prefetchBookBundle(id)
  const bookName = bundle.book?.name

  if (!bookName) {
    return {}
  }

  return {
    title: bookName,
    description: SHARE_INVITE_LABEL,
    openGraph: { title: bookName, description: SHARE_INVITE_LABEL },
  }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: bookKeys.bundle(id),
    queryFn: () => prefetchBookBundle(id),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GroupView bookId={id} />
    </HydrationBoundary>
  )
}

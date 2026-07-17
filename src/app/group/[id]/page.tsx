import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query"

import { prefetchBookBundle } from "@/features/books/books.queries.server"
import { bookKeys } from "@/features/books/books.query-keys"

import { GroupView } from "./_components/group-view"

interface GroupPageProps {
  params: Promise<{ id: string }>
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

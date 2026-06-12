import { GroupView } from "./_components/group-view"

interface GroupPageProps {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params

  return <GroupView bookId={id} />
}

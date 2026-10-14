import LeadDetailPage from '@/components/features/leads/LeadDetailPage'

export default async function LeadDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <LeadDetailPage id={id} />
}

import dynamic from 'next/dynamic'

const LeadsPage = dynamic(() => import('@/components/features/leads/LeadsPage'), {
  loading: () => <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Loading module...</div>
})

export default function Leads() {
  return <LeadsPage />
}

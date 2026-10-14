import dynamic from 'next/dynamic'

const CallOutcomesSettingsPage = dynamic(() => import('@/components/features/call-outcomes/CallOutcomesSettingsPage'), {
  loading: () => <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Loading module...</div>
})

export default function CallOutcomes() {
  return <CallOutcomesSettingsPage />
}

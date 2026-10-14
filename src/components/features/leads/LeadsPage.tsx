'use client'

import { PageHeader } from '@/components/reusable/PageHeader'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import FollowUpsTab from './FollowUpsTab'
import LeadsTab from './LeadsTab'

// Leads (everyone your calls reached, and where they stand) and Follow-ups
// (callbacks and team tasks). ?tab=follow-ups opens the second tab.
function LeadsPageInner() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const tab = params.get('tab') === 'follow-ups' ? 'follow-ups' : 'leads'

  const switchTab = (value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value === 'follow-ups') next.set('tab', 'follow-ups')
    else next.delete('tab')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
      <PageHeader
        title={t('leads_and_follow_ups', 'Leads & Follow-ups')}
        icon={<Target className="w-8 h-8 text-primary" />}
        showBackButton={false}
      />
      <p className="text-sm text-subtitle-color -mt-3">{t('leads_page_subtitle', 'What happened on your calls, who to call back, and where each person stands.')}</p>
      <Tabs value={tab} onValueChange={switchTab}>
        <TabsList className="h-12 p-1.5">
          <TabsTrigger value="leads" className="px-5 data-[state=active]:text-white">{t('leads', 'Leads')}</TabsTrigger>
          <TabsTrigger value="follow-ups" className="px-5 data-[state=active]:text-white">{t('follow_ups', 'Follow-ups')}</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === 'follow-ups' ? <FollowUpsTab /> : <LeadsTab />}
    </div>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <LeadsPageInner />
    </Suspense>
  )
}

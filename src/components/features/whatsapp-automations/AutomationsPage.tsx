'use client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import { useGetWaFlowsQuery } from '@/redux/api/whatsappAutomationApi'
import { Plus } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import AiSettingsTab from './AiSettingsTab'
import FlowList from './FlowList'
import HowItWorks from './HowItWorks'
import NewFlowDialog from './NewFlowDialog'

const TABS = ['automations', 'ai', 'help'] as const
type Tab = (typeof TABS)[number]

const AutomationsPage = () => {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'automations'
  const { hasPermission, isAdmin } = usePermission()
  const canCreate = isAdmin() || hasPermission(PERMISSIONS.CREATE_WHATSAPP_AUTOMATION)
  const { data, isLoading } = useGetWaFlowsQuery(undefined, { refetchOnMountOrArgChange: true })
  const [creating, setCreating] = useState(false)
  const flows = data?.data || []
  const live = flows.filter((f) => f.status === 'active').length

  const setTab = (t: string) => router.replace(t === 'automations' ? pathname : `${pathname}?tab=${t}`, { scroll: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-title">
            WhatsApp Automations
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">Beta</span>
          </h1>
          <p className="text-md text-subtitle-color mt-1">
            Chatbot flows that answer your customers on WhatsApp: menus, questions, bookings and hand-over to your team.
            {flows.length > 0 && <> {live} of {flows.length} live.</>}
          </p>
        </div>
        {tab === 'automations' && canCreate && (
          <Button type="button" onClick={() => setCreating(true)} className="text-white gap-1.5 shrink-0"><Plus className="w-4 h-4" /> New automation</Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger className="data-[state=active]:text-white" value="automations">Automations{flows.length ? ` (${flows.length})` : ''}</TabsTrigger>
          <TabsTrigger className="data-[state=active]:text-white" value="ai">AI auto-reply</TabsTrigger>
          <TabsTrigger className="data-[state=active]:text-white" value="help">How it works</TabsTrigger>
        </TabsList>
        <TabsContent value="automations" className="mt-6">
          <FlowList flows={flows} loading={isLoading} onNew={() => setCreating(true)} />
        </TabsContent>
        <TabsContent value="ai" className="mt-6">
          <AiSettingsTab />
        </TabsContent>
        <TabsContent value="help" className="mt-6">
          <HowItWorks />
        </TabsContent>
      </Tabs>

      {creating && <NewFlowDialog open={creating} onClose={() => setCreating(false)} templates={data?.templates || []} />}
    </div>
  )
}

export default AutomationsPage

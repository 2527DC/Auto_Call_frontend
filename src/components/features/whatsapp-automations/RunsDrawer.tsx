'use client'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { useGetWaFlowRunsQuery } from '@/redux/api/whatsappAutomationApi'
import { FlowRun } from '@/types/whatsappAutomation'
import { ChevronDown, ExternalLink, History, Loader2, RefreshCw, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export const RUN_STATUS: Record<FlowRun['status'], { label: string; tone: string }> = {
  active: { label: 'In progress', tone: 'bg-sky-500/10 text-sky-600' },
  completed: { label: 'Completed', tone: 'bg-emerald-500/10 text-emerald-600' },
  handed_off: { label: 'Handed over', tone: 'bg-amber-500/10 text-amber-600' },
  timed_out: { label: 'No reply', tone: 'bg-zinc-500/10 text-zinc-500' },
  stopped: { label: 'Stopped', tone: 'bg-zinc-500/10 text-zinc-500' },
  failed: { label: 'Failed', tone: 'bg-destructive/10 text-destructive' },
}

const REASONS: Record<string, string> = {
  end_of_flow: 'Reached the end',
  end_step: 'End step',
  handoff_step: 'Hand-over step',
  no_valid_answer: 'No valid answer',
  agent_replied: 'A team member replied',
  paused_by_agent: 'Paused from the inbox',
  resolved: 'Chat resolved',
  flow_paused: 'Automation paused',
  flow_deleted: 'Automation deleted',
  no_reply: 'Customer stopped replying',
}

const when = (d: string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const RunRow = ({ run }: { run: FlowRun }) => {
  const [open, setOpen] = useState(false)
  const status = RUN_STATUS[run.status]
  const vars = Object.entries(run.vars || {}).filter(([k]) => k !== 'last_message')
  return (
    <li className="border-b border-input-border-color">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/[0.03]" aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-title truncate">{run.customer?.name || run.customer?.phone || 'Customer'}</p>
          <p className="text-[11px] text-subtitle-color truncate">{when(run.created_at)}{run.step ? ` · at ${run.step}` : ''}</p>
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', status.tone)}>{status.label}</span>
        <ChevronDown className={cn('w-4 h-4 shrink-0 text-subtitle-color transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-3">
          {run.customer && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-subtitle-color">{run.customer.phone}</span>
              <Link href={`${ROUTES.WHATSAPP_INBOX}?c=${run.customer.conversation_id}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                Open chat <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
          {run.end_reason && <p className="text-xs text-subtitle-color">Ended: {REASONS[run.end_reason] || run.end_reason}</p>}
          {vars.length > 0 && (
            <div className="rounded-md bg-primary/[0.04] p-2 font-mono text-[11px] space-y-0.5">
              {vars.map(([k, v]) => <p key={k} className="break-all"><span className="text-primary">{k}</span> = {typeof v === 'object' ? JSON.stringify(v) : String(v)}</p>)}
            </div>
          )}
          {run.events.length > 0 && (
            <ol className="relative border-s border-input-border-color ms-1 space-y-1.5">
              {run.events.map((e, i) => (
                <li key={i} className="ms-3 text-[11px]">
                  <span className={cn('absolute -start-[4.5px] mt-1 h-2 w-2 rounded-full', e.type === 'error' ? 'bg-destructive' : e.type === 'end' ? 'bg-emerald-500' : 'bg-primary/60')} />
                  <span className="text-subtitle-color tabular-nums">{new Date(e.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>{' '}
                  <span className={cn('font-medium', e.type === 'error' ? 'text-destructive' : 'text-title')}>{e.type}</span>
                  {e.detail && <span className="text-subtitle-color"> · {e.detail}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </li>
  )
}

// Recent real conversations that went through this automation.
const RunsDrawer = ({ flowId, onClose }: { flowId: string; onClose: () => void }) => {
  const { data, isFetching, refetch } = useGetWaFlowRunsQuery(flowId, { refetchOnMountOrArgChange: true })
  const runs = data?.data || []
  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-input-border-color bg-bg-card">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-input-border-color">
        <History className="w-4 h-4 text-primary" />
        <p className="flex-1 text-sm font-semibold text-title">Runs <span className="text-subtitle-color font-normal">(last 100)</span></p>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => refetch()} aria-label="Refresh"><RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} /></Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isFetching && !runs.length ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-subtitle-color" /></div>
        ) : runs.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-subtitle-color">No customers have gone through this automation yet. Test runs from the builder aren&apos;t listed here.</p>
        ) : (
          <ul className="pb-20">{runs.map((r) => <RunRow key={r.id} run={r} />)}</ul>
        )}
      </div>
    </aside>
  )
}

export default RunsDrawer

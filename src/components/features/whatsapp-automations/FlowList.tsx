'use client'

import { DeleteConfirmationModal } from '@/components/reusable/DeleteConfirmationModal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'
import { useDeleteWaFlowMutation, useDuplicateWaFlowMutation, useSetWaFlowStatusMutation } from '@/redux/api/whatsappAutomationApi'
import { FlowValidation, WhatsappFlowSummary } from '@/types/whatsappAutomation'
import { AlertCircle, Copy, History, MoreVertical, Pencil, Plus, Trash2, Workflow, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const STATUS = {
  active: { label: 'Live', tone: 'bg-emerald-500/10 text-emerald-600' },
  paused: { label: 'Paused', tone: 'bg-amber-500/10 text-amber-600' },
  draft: { label: 'Draft', tone: 'bg-zinc-500/10 text-zinc-500' },
}

const Trigger = ({ flow }: { flow: WhatsappFlowSummary }) => {
  if (flow.trigger.type === 'first_message') return <span className="text-xs text-subtitle-color">First message from a new customer</span>
  if (flow.trigger.type === 'any_message') return <span className="text-xs text-subtitle-color">Any message (fallback)</span>
  const kws = flow.trigger.keywords || []
  return (
    <span className="flex flex-wrap items-center gap-1">
      <span className="text-[11px] text-subtitle-color">{flow.trigger.match === 'exact' ? 'Is' : 'Contains'}</span>
      {kws.length ? kws.slice(0, 5).map((k) => <span key={k} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{k}</span>) : <span className="text-[11px] text-destructive">no keyword</span>}
      {kws.length > 5 && <span className="text-[11px] text-subtitle-color">+{kws.length - 5}</span>}
    </span>
  )
}

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: string }) => (
  <div className="min-w-0">
    <p className={cn('text-base font-bold tabular-nums text-title', tone)}>{value.toLocaleString('en-IN')}</p>
    <p className="text-[10px] uppercase tracking-wide text-subtitle-color truncate">{label}</p>
  </div>
)

const FlowList = ({ flows, onNew, loading }: { flows: WhatsappFlowSummary[]; onNew: () => void; loading: boolean }) => {
  const router = useRouter()
  const { hasPermission, isAdmin } = usePermission()
  const canEdit = isAdmin() || hasPermission(PERMISSIONS.UPDATE_WHATSAPP_AUTOMATION)
  const canCreate = isAdmin() || hasPermission(PERMISSIONS.CREATE_WHATSAPP_AUTOMATION)
  const canDelete = isAdmin() || hasPermission(PERMISSIONS.DELETE_WHATSAPP_AUTOMATION)
  const [setStatus] = useSetWaFlowStatusMutation()
  const [duplicate] = useDuplicateWaFlowMutation()
  const [remove, { isLoading: deleting }] = useDeleteWaFlowMutation()
  const [toDelete, setToDelete] = useState<WhatsappFlowSummary | null>(null)
  const [blocked, setBlocked] = useState<{ flow: WhatsappFlowSummary; errors: FlowValidation['errors'] } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const open = (id: string, extra = '') => router.push(`${ROUTES.WHATSAPP_AUTOMATIONS}/${id}${extra}`)

  const toggle = async (flow: WhatsappFlowSummary) => {
    setBusy(flow.id)
    try {
      await setStatus({ id: flow.id, status: flow.status === 'active' ? 'paused' : 'active' }).unwrap()
      toast.success(flow.status === 'active' ? `"${flow.name}" paused` : `"${flow.name}" is live`)
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string; validation?: FlowValidation } }
      if (e.status === 422 && e.data?.validation) setBlocked({ flow, errors: e.data.validation.errors })
      else toast.error(e.data?.message || 'Could not change the status')
    } finally {
      setBusy(null)
    }
  }

  const copy = async (flow: WhatsappFlowSummary) => {
    try {
      const res = await duplicate(flow.id).unwrap()
      toast.success('Copied as a draft')
      open(res.data.id)
    } catch {
      toast.error('Could not copy the automation')
    }
  }

  if (!loading && flows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-input-border-color bg-bg-card px-6 py-14 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Workflow className="w-6 h-6" /></span>
        <h3 className="mt-4 text-lg font-semibold text-title">No automations yet</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-subtitle-color">Build a chatbot that greets customers, answers with buttons and menus, collects their details and books appointments on WhatsApp.</p>
        {canCreate && <Button type="button" onClick={onNew} className="mt-5 gap-1.5"><Plus className="w-4 h-4" /> Create your first automation</Button>}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
        {flows.map((flow) => {
          const status = STATUS[flow.status]
          return (
            <div key={flow.id} className="flex flex-col rounded-lg border border-input-border-color bg-bg-card transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3 p-4">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', flow.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary')}><Zap className="w-5 h-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`${ROUTES.WHATSAPP_AUTOMATIONS}/${flow.id}`} className="truncate text-base font-semibold text-title hover:text-primary">{flow.name}</Link>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', status.tone)}>{status.label}</span>
                  </div>
                  {flow.description && <p className="mt-0.5 text-xs text-subtitle-color line-clamp-1">{flow.description}</p>}
                  <div className="mt-2"><Trigger flow={flow} /></div>
                </div>
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <Switch
                      checked={flow.status === 'active'}
                      disabled={busy === flow.id}
                      onCheckedChange={() => toggle(flow)}
                      aria-label={flow.status === 'active' ? 'Pause automation' : 'Switch automation on'}
                    />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-bg-card border-input-border-color">
                      <DropdownMenuItem onClick={() => open(flow.id)}><Pencil className="w-4 h-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => open(flow.id, '?panel=runs')}><History className="w-4 h-4" /> Runs</DropdownMenuItem>
                      {canCreate && <DropdownMenuItem onClick={() => copy(flow)}><Copy className="w-4 h-4" /> Duplicate</DropdownMenuItem>}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setToDelete(flow)} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-auto grid grid-cols-5 gap-2 border-t border-input-border-color px-4 py-3">
                <Stat label="Runs" value={flow.stats?.runs || 0} />
                <Stat label="Done" value={flow.stats?.completed || 0} tone="text-emerald-600" />
                <Stat label="To team" value={flow.stats?.handed_off || 0} tone="text-amber-600" />
                <Stat label="Failed" value={flow.stats?.failed || 0} tone={flow.stats?.failed ? 'text-destructive' : undefined} />
                <Stat label="Now" value={flow.active_runs || 0} tone="text-sky-600" />
              </div>
              <p className="border-t border-input-border-color px-4 py-2 text-[11px] text-subtitle-color">
                Updated {new Date(flow.updated_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · priority {flow.priority}
              </p>
            </div>
          )
        })}
      </div>

      <DeleteConfirmationModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        isLoading={deleting}
        title="Delete this automation?"
        description={`"${toDelete?.name || ''}" stops answering customers, and chats in it are released to the inbox.`}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await remove(toDelete.id).unwrap()
            toast.success('Automation deleted')
          } catch {
            toast.error('Could not delete the automation')
          } finally {
            setToDelete(null)
          }
        }}
      />

      <Dialog open={!!blocked} onOpenChange={(o) => !o && setBlocked(null)}>
        <DialogContent className="sm:max-w-lg bg-bg-card border-input-border-color">
          <DialogHeader>
            <DialogTitle className="text-title">Fix these before going live</DialogTitle>
            <DialogDescription>&quot;{blocked?.flow.name}&quot; has problems that would break the chat for customers.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {blocked?.errors.map((e, i) => (
              <li key={i} className="flex gap-2 text-sm text-title"><AlertCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />{e.message}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBlocked(null)}>Close</Button>
            <Button type="button" onClick={() => blocked && open(blocked.flow.id)}>Open builder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FlowList

'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'
import { useAssignWaConversationMutation, useGetWaTeamMembersQuery, useSetWaBotMutation, useUpdateWaConversationMutation } from '@/redux/api/whatsappInboxApi'
import { ConversationStatus, WaConversationDetail } from '@/types/whatsappInbox'
import { ArrowLeft, Bot, BotOff, Check, CheckCircle2, ChevronDown, Clock, PanelRight, RotateCcw, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { apiMessage, conversationName, InitialsAvatar, memberName, useNow, windowLeft } from './helpers'

interface ThreadHeaderProps {
  conversation: WaConversationDetail
  canReply: boolean
  canAssign: boolean
  onBack: () => void
  onTogglePanel: () => void
  panelOpen: boolean
}

const STATUS_LABEL: Record<ConversationStatus, string> = { open: 'Open', pending: 'Pending', resolved: 'Resolved' }

const ThreadHeader = ({ conversation: c, canReply, canAssign, onBack, onTogglePanel, panelOpen }: ThreadHeaderProps) => {
  const { isTeamMember, user } = usePermission()
  const now = useNow()
  const { data: members } = useGetWaTeamMembersQuery(undefined, { skip: !canAssign })
  const [update, { isLoading: updating }] = useUpdateWaConversationMutation()
  const [assign] = useAssignWaConversationMutation()
  const [setBot, { isLoading: botBusy }] = useSetWaBotMutation()
  const name = conversationName(c)
  const left = windowLeft(c.window_expires_at, now)
  const assignee = memberName(c.assigned_member_id)

  const run = async (fn: () => Promise<unknown>, done: string, failMsg: string) => {
    try {
      await fn()
      toast.success(done)
    } catch (err) {
      toast.error(apiMessage(err, failMsg))
    }
  }

  const changeStatus = (status: ConversationStatus) =>
    run(() => update({ id: c.id, status }).unwrap(), `Chat marked ${STATUS_LABEL[status].toLowerCase()}`, 'Could not change the status')
  const changeAssignee = (memberId: string | null) =>
    run(() => assign({ id: c.id, member_id: memberId }).unwrap(), memberId ? 'Chat assigned' : 'Chat unassigned', 'Could not assign the chat')
  const toggleBot = (paused: boolean) =>
    run(() => setBot({ id: c.id, paused }).unwrap(), paused ? 'Automation paused for this chat' : 'Automation resumed for this chat', 'Could not change the bot')

  const memberOptions = isTeamMember() ? (members?.data || []).filter((m) => m.id === user?.id) : members?.data || []

  return (
    <div className="border-b border-input-border-color">
      <div className="flex items-center gap-2 px-2 py-2.5 sm:gap-3 sm:px-4">
        <button type="button" onClick={onBack} aria-label="Back to chats" className="rounded-full p-1.5 text-subtitle-color hover:bg-input-color lg:hidden">
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <InitialsAvatar name={name} className="hidden sm:inline-flex" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-title">{name}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-subtitle-color">
            <span className="hidden tabular-nums sm:inline">+{c.wa_id}</span>
            {c.phone_number_id?.display_phone_number && <span className="hidden md:inline">via {c.phone_number_id.display_phone_number}</span>}
            <span className={cn('inline-flex items-center gap-1 whitespace-nowrap font-semibold', left ? 'text-emerald-600' : 'text-amber-600')}>
              <Clock className="h-3 w-3" />
              <span className="sm:hidden">{left || 'Window closed'}</span>
              <span className="hidden sm:inline">{left ? `Reply window: ${left}` : 'Window closed: templates only'}</span>
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {canAssign && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 max-w-40" aria-label="Assign chat">
                  {assignee ? <InitialsAvatar name={assignee} size="sm" className="h-5 w-5 text-[9px]" /> : <UserPlus />}
                  <span className="hidden truncate md:inline">{assignee || 'Assign'}</span>
                  <ChevronDown className="opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-bg-card border-input-border-color">
                <DropdownMenuLabel className="text-xs text-subtitle-color">Assign to</DropdownMenuLabel>
                {memberOptions.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-subtitle-color">No team members can reply on WhatsApp yet. Give a team the &quot;Reply Whatsapp_inbox&quot; permission.</p>
                )}
                {memberOptions.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => changeAssignee(m.id)} className="gap-2">
                    <InitialsAvatar name={m.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{m.name}</span>
                    <span className="text-[11px] tabular-nums text-subtitle-color">{m.open_chats} open</span>
                    {c.assigned_member_id?.id === m.id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
                {c.assigned_member_id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => changeAssignee(null)}>Unassign</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canReply && (
            <Select value={c.status} onValueChange={(v) => changeStatus(v as ConversationStatus)} disabled={updating}>
              <SelectTrigger aria-label="Chat status" className={cn(
                'hidden h-7 w-auto gap-1.5 rounded-radius border px-2.5 text-xs font-semibold shadow-none sm:flex',
                c.status === 'open' && 'border-emerald-500/30 text-emerald-600',
                c.status === 'pending' && 'border-amber-500/30 text-amber-600',
                c.status === 'resolved' && 'border-input-border-color text-subtitle-color'
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-bg-card border-input-border-color">
                {(Object.keys(STATUS_LABEL) as ConversationStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {canReply && (c.status === 'resolved' ? (
            <Button type="button" variant="outline" size="sm" onClick={() => changeStatus('open')} className="gap-1.5" aria-label="Reopen chat">
              <RotateCcw /> <span className="hidden md:inline">Reopen</span>
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => changeStatus('resolved')} className="gap-1.5" aria-label="Resolve chat">
              <CheckCircle2 /> <span className="hidden md:inline">Resolve</span>
            </Button>
          ))}

          <button type="button" onClick={onTogglePanel} aria-label="Contact details" aria-pressed={panelOpen} title="Contact details" className={cn('rounded-full p-1.5 hover:bg-input-color', panelOpen ? 'text-primary' : 'text-subtitle-color')}>
            <PanelRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {c.active_run && !c.bot_paused && (
        <div className="flex items-center gap-2 border-t border-input-border-color bg-primary/5 px-4 py-1.5 text-xs">
          <Bot className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-subtitle-color">
            Automation running: <b className="text-title">{c.active_run.flow_name}</b>
            {c.active_run.step && <> · {c.active_run.step}</>}
            {c.active_run.waiting && <> · waiting for {c.active_run.waiting === 'delay' ? 'a timer' : 'the customer'}</>}
          </span>
          {canReply && (
            <button type="button" onClick={() => toggleBot(true)} disabled={botBusy} className="shrink-0 font-semibold text-primary hover:underline">Stop bot</button>
          )}
        </div>
      )}
      {c.bot_paused && (
        <div className="flex items-center gap-2 border-t border-input-border-color bg-amber-500/5 px-4 py-1.5 text-xs">
          <BotOff className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span className="min-w-0 flex-1 text-subtitle-color">Automation and AI are paused in this chat because a person took over.</span>
          {canReply && (
            <button type="button" onClick={() => toggleBot(false)} disabled={botBusy} className="shrink-0 font-semibold text-primary hover:underline">Resume bot</button>
          )}
        </div>
      )}
    </div>
  )
}

export default ThreadHeader

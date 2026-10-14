'use client'

import { NativeAudioWithOverlay } from '@/components/reusable/NativeAudioWithOverlay'
import LeadStatusBadge from '@/components/features/outcomes/LeadStatusBadge'
import OutcomeBadge from '@/components/features/outcomes/OutcomeBadge'
import { SENTIMENT_EMOJI, followUpReason, formatWhen, fromLocalInput, leadSource, outcomeSource, toLocalInput } from '@/components/features/outcomes/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textArea'
import { cn } from '@/lib/utils'
import {
  useAddLeadNoteMutation,
  useCreateFollowUpMutation,
  useGetLeadQuery,
  useSetLeadStatusMutation,
  useSetLeadTagsMutation,
  useUnlockLeadMutation,
} from '@/redux/api/outcomeApi'
import { FollowUpMode, LeadCall } from '@/types/outcomes'
import { ArrowLeft, Ban, Bot, CalendarClock, ChevronDown, Loader2, Lock, PhoneIncoming, PhoneOutgoing, Plus, Scissors, Users, X } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import FollowUpActions from './FollowUpActions'

const errorMessage = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message || fallback
const duration = (s: number) => (!s ? '0s' : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`)

function Card({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border border-input-border-color bg-bg-card p-4 sm:p-5', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function CallCard({ call }: { call: LeadCall }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const o = call.outcome
  return (
    <div className="rounded-lg border border-input-border-color p-3.5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-title">
          {call.direction === 'inbound' ? <PhoneIncoming className="h-4 w-4 shrink-0 text-incoming-color dark:text-emerald-400" /> : <PhoneOutgoing className="h-4 w-4 shrink-0 text-outgoing-color dark:text-rose-400" />}
          <span className="font-semibold">{formatWhen(call.created_at, t)}</span>
          <span className="text-subtitle-color">· {duration(call.duration)}{call.agent ? ` · ${call.agent}` : ''}{call.campaign ? ` · ${call.campaign}` : ''}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <OutcomeBadge outcome={o} />
          {o?.sentiment && <span title={o.sentiment}>{SENTIMENT_EMOJI[o.sentiment]}</span>}
        </div>
      </div>
      {o?.summary && <p className="text-sm text-title leading-relaxed">{o.summary}</p>}
      {o?.source && <p className="text-xs text-subtitle-color">{outcomeSource(o.source, t)}</p>}
      {!!o?.reasons?.length && o.reasons.some((r) => r.quote) && (
        <ul className="space-y-1">
          {o.reasons.filter((r) => r.quote).map((r, i) => <li key={i} className="text-xs italic text-subtitle-color border-l-2 border-primary/40 pl-2">“{r.quote}”</li>)}
        </ul>
      )}
      {o?.details && Object.keys(o.details).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(o.details).map(([k, v]) => <span key={k} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-title"><span className="text-subtitle-color">{k.replace(/_/g, ' ')}:</span> {String(v)}</span>)}
        </div>
      )}
      {call.recording_url && <NativeAudioWithOverlay src={call.recording_url} durationInSeconds={call.duration} className="w-full! max-w-[320px]" />}
      {!!call.transcript?.length && (
        <div>
          <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-sm font-semibold text-primary">
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
            {open ? t('hide_transcript', 'Hide transcript') : t('show_transcript', 'Show transcript')}
          </button>
          {open && (
            <div className="mt-2 space-y-1.5 rounded-md bg-primary/5 p-3">
              {call.transcript.map((m, i) => (
                <p key={i} className="text-sm text-title">
                  <span className="font-semibold">{m.role === 'agent' ? t('agent', 'Agent') : m.role === 'human' ? t('team_member', 'Team member') : t('caller', 'Caller')}: </span>
                  {m.interrupted ? (
                    <>{m.heard || '…'} <span className="inline-flex items-center gap-0.5 text-xs text-subtitle-color"><Scissors className="h-3 w-3" />{t('cut_off_by_caller', 'Cut off by the caller')}</span></>
                  ) : m.text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// One person: where they stand, what was collected, what's planned, and every call.
export default function LeadDetailPage({ id }: { id: string }) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useGetLeadQuery(id)
  const [setStatus, { isLoading: savingStatus }] = useSetLeadStatusMutation()
  const [unlock, { isLoading: unlocking }] = useUnlockLeadMutation()
  const [addNote, { isLoading: savingNote }] = useAddLeadNoteMutation()
  const [setTags] = useSetLeadTagsMutation()
  const [createFollowUp, { isLoading: creatingFu }] = useCreateFollowUpMutation()
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [note, setNote] = useState('')
  const [tag, setTag] = useState('')
  const [fuOpen, setFuOpen] = useState(false)
  const [fuDue, setFuDue] = useState(toLocalInput(new Date(Date.now() + 3600000)))
  const [fuMode, setFuMode] = useState<FollowUpMode>('team')
  const [fuNote, setFuNote] = useState('')

  if (isLoading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  if (isError || !data?.data) {
    return (
      <div className="space-y-3 p-6 text-center">
        <p className="text-title font-semibold">{t('lead_not_found', 'This lead could not be found.')}</p>
        <Link href="/leads" className="text-primary font-semibold hover:underline">{t('back_to_leads', 'Back to leads')}</Link>
      </div>
    )
  }
  const lead = data.data
  const info = lead.lead
  const dnc = info.status === 'do_not_call' || !!info.dnc?.at
  const tags = info.tags || []
  const history = [...(info.history || [])].reverse()
  const notes = [...(info.notes || [])].reverse()
  const statusLabel = (k?: string) => lead.statuses.find((s) => s.key === k)?.label || k || ''

  const saveStatus = async () => {
    if (!newStatus) return
    try {
      await setStatus({ id, status: newStatus, note: statusNote.trim() || undefined }).unwrap()
      toast.success(t('status_updated', 'Status updated'))
      setNewStatus('')
      setStatusNote('')
    } catch (e) {
      toast.error(errorMessage(e, t('update_failed', 'Could not update')))
    }
  }
  const saveTags = async (next: string[]) => {
    try { await setTags({ id, tags: next }).unwrap() } catch (e) { toast.error(errorMessage(e, t('update_failed', 'Could not update'))) }
  }
  const saveNote = async () => {
    if (!note.trim()) return
    try { await addNote({ id, text: note.trim() }).unwrap(); setNote('') } catch (e) { toast.error(errorMessage(e, t('update_failed', 'Could not update'))) }
  }
  const saveFollowUp = async () => {
    try {
      const res = await createFollowUp({ contact_id: id, due_at: fromLocalInput(fuDue), mode: fuMode, note: fuNote.trim() || undefined }).unwrap()
      toast.success(res.message || t('follow_up_added', 'Follow-up added'))
      setFuOpen(false)
      setFuNote('')
    } catch (e) {
      toast.error(errorMessage(e, t('update_failed', 'Could not update')))
    }
  }

  // "ai (suggested interested)" -> "AI — suggested Interested"
  const sourceLabel = (s?: string) => {
    const m = /^(\w+)(?: \(suggested (\w+)\))?$/.exec(s || '')
    if (!m) return s || ''
    const who = outcomeSource(m[1], t) || m[1]
    return m[2] ? `${who} — ${t('suggested', 'suggested')} ${statusLabel(m[2])}` : who
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-subtitle-color hover:text-primary">
        <ArrowLeft className="h-4 w-4" />{t('back_to_leads', 'Back to leads')}
      </Link>

      {/* Who and where they stand */}
      <section className="rounded-lg border border-input-border-color bg-bg-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-title truncate">{lead.name || lead.phone_number}</h1>
            <p className="text-sm text-subtitle-color">
              {[lead.name ? lead.phone_number : null, lead.email || null, leadSource(lead.source, t), `${info.calls || 0} ${t('calls_lower', 'call(s)')}`].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LeadStatusBadge status={info.status} label={info.status_label} statuses={lead.statuses} locked={info.locked} className="text-sm" />
            {info.locked && (
              <Button variant="ghost" size="sm" className="h-8 text-xs text-subtitle-color" disabled={unlocking}
                onClick={async () => { try { await unlock(id).unwrap(); toast.success(t('lead_unlocked', 'Calls may update the status again')) } catch (e) { toast.error(errorMessage(e, t('update_failed', 'Could not update'))) } }}
                title={t('unlock_hint', 'You set this status; later calls only suggest a change.')}>
                <Lock className="h-3.5 w-3.5 mr-1" />{t('let_calls_update', 'Let calls update it')}
              </Button>
            )}
          </div>
        </div>

        {dnc && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <Ban className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{t('dnc_banner', 'Do not call: this person asked not to be contacted. Calls, retries and messages to them are stopped.')}{info.dnc?.reason ? ` (${info.dnc.reason})` : ''}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="h-10 sm:w-[220px] bg-bg-card border-input-border-color text-title rounded-radius"><SelectValue placeholder={t('change_status', 'Change status')} /></SelectTrigger>
            <SelectContent>{lead.statuses.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          {newStatus && (
            <>
              <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder={dnc && newStatus !== 'do_not_call' ? t('dnc_reason_needed', 'Why can we contact them again? (needed)') : t('note_optional', 'Note (optional)')} className="h-10 flex-1 bg-bg-card border-input-border-color" />
              <Button className="h-10 bg-primary text-white" onClick={saveStatus} disabled={savingStatus}>{savingStatus && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('save', 'Save')}</Button>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        {/* Calls */}
        <Card title={t('calls', 'Calls')} className="lg:col-span-2">
          {lead.calls.length ? <div className="space-y-3">{lead.calls.map((c) => <CallCard key={c.id} call={c} />)}</div>
            : <p className="text-sm text-subtitle-color">{t('no_calls_yet', 'No calls yet.')}</p>}
        </Card>

        {/* What to do next comes first on a phone */}
        <div className="space-y-5 order-first lg:order-none">
        <Card title={t('details_collected', 'Details collected')}>
          {info.details && Object.keys(info.details).length ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              {Object.entries(info.details).map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-subtitle-color capitalize">{k.replace(/_/g, ' ')}</dt><dd className="text-title font-semibold break-words">{String(v)}</dd></div>
              ))}
            </dl>
          ) : <p className="text-sm text-subtitle-color">{t('no_details_yet', 'Nothing collected yet.')}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {tags.map((x) => (
              <span key={x} className="inline-flex items-center gap-1 rounded-md border border-input-border-color px-2 py-0.5 text-xs text-title">
                #{x}<button type="button" onClick={() => saveTags(tags.filter((y) => y !== x))} aria-label={t('remove', 'Remove')}><X className="h-3 w-3" /></button>
              </span>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); if (tag.trim()) { saveTags([...tags, tag.trim()]); setTag('') } }} className="flex items-center gap-1">
              <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={t('add_tag', 'Add tag')} maxLength={30} className="h-7 w-28 text-xs bg-bg-card border-input-border-color" />
            </form>
          </div>
        </Card>

        <Card title={t('follow_ups', 'Follow-ups')} action={!dnc && (
          <Button size="sm" variant="outline" className="h-8 gap-1 border-input-border-color" onClick={() => setFuOpen(!fuOpen)}><Plus className="h-3.5 w-3.5" />{t('add', 'Add')}</Button>
        )}>
          {fuOpen && (
            <div className="mb-3 space-y-2 rounded-md bg-primary/5 p-3">
              <Input type="datetime-local" value={fuDue} onChange={(e) => setFuDue(e.target.value)} className="h-9 bg-bg-card border-input-border-color" />
              <Select value={fuMode} onValueChange={(v) => setFuMode(v as FollowUpMode)}>
                <SelectTrigger className="h-9 bg-bg-card border-input-border-color text-title rounded-radius"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">{t('fu_mode_team', 'My team')}</SelectItem>
                  <SelectItem value="ai_call">{t('fu_mode_ai', 'The AI agent calls')}</SelectItem>
                </SelectContent>
              </Select>
              <Input value={fuNote} onChange={(e) => setFuNote(e.target.value)} placeholder={t('what_to_do', 'What to do, e.g. send the brochure')} className="h-9 bg-bg-card border-input-border-color" />
              <Button size="sm" className="w-full bg-primary text-white" onClick={saveFollowUp} disabled={creatingFu}>{creatingFu && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}{t('add_follow_up', 'Add follow-up')}</Button>
            </div>
          )}
          {lead.follow_ups.length ? (
            <ul className="space-y-3">
              {lead.follow_ups.map((f) => {
                const open = ['pending', 'in_progress'].includes(f.status)
                return (
                  <li key={f.id} className={cn('space-y-1.5', !open && 'opacity-60')}>
                    <div className="flex items-center gap-1.5 text-sm text-title">
                      {f.mode === 'ai_call' ? <Bot className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
                      <span className="font-semibold">{followUpReason(f.reason, t)}</span>
                    </div>
                    <p className={cn('flex items-center gap-1 text-xs', open && new Date(f.due_at) < new Date() ? 'text-destructive' : 'text-subtitle-color')}>
                      <CalendarClock className="h-3 w-3" />{open ? formatWhen(f.due_at, t) : `${f.status} · ${formatWhen(f.closed_at, t)}`}
                    </p>
                    {f.note && <p className="text-xs text-subtitle-color">{f.note}</p>}
                    {open && <FollowUpActions followUp={f} compact />}
                  </li>
                )
              })}
            </ul>
          ) : <p className="text-sm text-subtitle-color">{t('no_follow_ups_planned', 'Nothing planned.')}</p>}
        </Card>

        <Card title={t('notes', 'Notes')}>
          <div className="space-y-2">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('add_note_placeholder', 'Add a note for your team')} className="min-h-16 bg-bg-card border-input-border-color" />
            <Button size="sm" className="bg-primary text-white" onClick={saveNote} disabled={!note.trim() || savingNote}>{savingNote && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}{t('add_note', 'Add note')}</Button>
          </div>
          {notes.length > 0 && (
            <ul className="mt-3 space-y-2">
              {notes.map((n, i) => <li key={i} className="text-sm text-title"><span className="block text-xs text-subtitle-color">{formatWhen(n.at, t)}</span>{n.text}</li>)}
            </ul>
          )}
        </Card>

        <Card title={t('status_history', 'Status history')}>
          {history.length ? (
            <ol className="space-y-2">
              {history.map((h, i) => (
                <li key={i} className="text-sm text-title">
                  <span className="block text-xs text-subtitle-color">{formatWhen(h.at, t)} · {sourceLabel(h.source)}</span>
                  {h.to && h.from !== h.to ? <>{statusLabel(h.from)} → <b>{statusLabel(h.to)}</b></> : (h.note || statusLabel(h.to))}
                  {h.note && h.to && h.from !== h.to && <span className="block text-xs text-subtitle-color">{h.note}</span>}
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-subtitle-color">{t('no_changes_yet', 'No changes yet.')}</p>}
        </Card>

        {lead.appointments.length > 0 && (
          <Card title={t('appointments', 'Appointments')}>
            <ul className="space-y-1.5">
              {lead.appointments.map((a) => <li key={a._id} className="text-sm text-title">{new Date(a.appointment_date).toLocaleDateString('en-IN')} {a.appointment_time} · <span className="capitalize text-subtitle-color">{a.status}</span></li>)}
            </ul>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}

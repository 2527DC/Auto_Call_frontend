'use client'

import { NativeAudioWithOverlay } from '@/components/reusable/NativeAudioWithOverlay'
import OutcomeBadge from '@/components/features/outcomes/OutcomeBadge'
import { SENTIMENT_EMOJI, formatWhen, outcomeSource } from '@/components/features/outcomes/format'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textArea'
import { cn } from '@/lib/utils'
import { useGetOutcomeSettingsQuery, useReanalyzeCallMutation, useSetCallOutcomeMutation } from '@/redux/api/outcomeApi'
import { CallLog } from '@/types/flow'
import { format } from 'date-fns'
import { Eye, Loader2, PhoneIncoming, PhoneOutgoing, RefreshCw, Scissors, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const formatDuration = (seconds: number) => {
  if (!seconds) return '0s'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const errorMessage = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message || fallback

// Everything about one call: what happened (outcome, summary, reasons and
// the details collected), what the caller said, and the conversation.
export default function CallDetailDialog({ call }: { call: CallLog }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [note, setNote] = useState('')
  const { data: settingsData } = useGetOutcomeSettingsQuery(undefined, { skip: !open })
  const [setOutcome, { isLoading: saving }] = useSetCallOutcomeMutation()
  const [reanalyze, { isLoading: analysing }] = useReanalyzeCallMutation()

  // The API sends "id" (its JSON drops _id).
  const callId = call.id || call._id
  const outcome = call.outcome
  const outcomes = (settingsData?.data?.settings?.outcomes || []).filter((o) => !o.archived)
  const inbound = call.direction === 'inbound'
  const number = inbound ? call.from_number : call.to_number
  const contactId = call.contact_id && typeof call.contact_id === 'object' ? call.contact_id._id || (call.contact_id as { id?: string }).id : (call.contact_id as unknown as string | null)
  const agentName = call.agent_id && typeof call.agent_id === 'object' ? call.agent_id.name : null
  const campaignName = call.campaign_id && typeof call.campaign_id === 'object' ? call.campaign_id.name : null
  const signals = (call.live_signals || []).filter((s) => s.type !== 'set_outcome')

  const signalLabel = (type: string) => ({
    not_interested: t('signal_not_interested', 'Not interested'),
    not_interested_offered_later: t('signal_offered_later', 'Said not interested — offered a better time'),
    call_later: t('signal_call_later', 'Asked to be called later'),
    do_not_call: t('signal_do_not_call', 'Asked not to be called again'),
    wrong_person: t('signal_wrong_person', 'Wrong number / wrong person'),
    wants_human: t('signal_wants_human', 'Wanted to talk to a person'),
    couldnt_understand: t('signal_couldnt_understand', "The agent couldn't understand"),
  } as Record<string, string>)[type] || type

  const endReason = (reason?: string | null) => {
    if (!reason) return null
    if (reason === 'caller_hung_up') return t('end_caller_hung_up', 'The caller hung up')
    return reason.charAt(0).toUpperCase() + reason.slice(1)
  }

  const saveOutcome = async () => {
    if (!newKey) return
    try {
      const res = await setOutcome({ id: callId, key: newKey, note: note.trim() || undefined }).unwrap()
      toast.success(res.message || t('outcome_updated', 'Outcome updated'))
      setEditing(false)
      setNote('')
    } catch (e) {
      toast.error(errorMessage(e, t('outcome_update_failed', 'Could not update the outcome')))
    }
  }

  const runAnalysis = async () => {
    try {
      const res = await reanalyze(callId).unwrap()
      toast.success(res.message || t('call_analysed_again', 'Call analysed again'))
    } catch (e) {
      toast.error(errorMessage(e, t('analysis_failed', 'Could not analyse the call')))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary bg-primary/10 hover:text-white transition-colors" title={t('call_details', 'Call details')}>
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]! gap-0! max-w-[calc(100%-1.5rem)]! sm:p-6 p-4 border-none bg-bg-card max-h-[90vh] overflow-y-auto no-scrollbar rounded-modal-radius">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="flex items-center gap-2 text-title">
            {inbound ? <PhoneIncoming className="h-5 w-5 shrink-0 text-incoming-color dark:text-emerald-400" /> : <PhoneOutgoing className="h-5 w-5 shrink-0 text-outgoing-color dark:text-rose-400" />}
            <span className="truncate">{call.lead_name || number}</span>
          </DialogTitle>
          <DialogDescription className="text-subtitle-color text-sm">
            {[number !== call.lead_name ? number : null, inbound ? t('incoming', 'Incoming') : t('outgoing', 'Outgoing'), format(new Date(call.created_at), 'MMM dd, yyyy HH:mm'), formatDuration(call.duration), agentName || campaignName].filter(Boolean).join(' · ')}
          </DialogDescription>
        </DialogHeader>

        {/* What happened */}
        <section className="mt-5 rounded-lg border border-input-border-color p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <OutcomeBadge outcome={outcome} />
              {outcome?.sentiment && <span title={outcome.sentiment}>{SENTIMENT_EMOJI[outcome.sentiment]}</span>}
              {outcome?.source && (
                <span className="text-xs text-subtitle-color">
                  {outcomeSource(outcome.source, t)}
                  {outcome.source === 'ai' && typeof outcome.confidence === 'number' ? ` · ${Math.round(outcome.confidence * 100)}% ${t('sure', 'sure')}` : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {contactId && (
                <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 border-input-border-color">
                  <Link href={`/leads/${contactId}`}><UserRound className="h-3.5 w-3.5" />{t('open_lead', 'Open lead')}</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8 gap-1.5 border-input-border-color" onClick={runAnalysis} disabled={analysing}>
                {analysing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {t('reanalyse', 'Re-analyse')}
              </Button>
            </div>
          </div>

          {outcome?.summary && <p className="text-sm text-title leading-relaxed">{outcome.summary}</p>}
          {outcome?.note && <p className="text-xs text-subtitle-color">{t('outcome_note', 'Note')}: {outcome.note}</p>}
          {outcome?.error && <p className="text-xs text-destructive">{outcome.error}</p>}

          {!!outcome?.reasons?.length && (
            <ul className="space-y-2">
              {outcome.reasons.map((r, i) => (
                <li key={i} className="text-sm text-title">
                  {r.text}
                  {r.quote && <span className="block mt-0.5 italic text-subtitle-color border-l-2 border-primary/40 pl-2">“{r.quote}”</span>}
                </li>
              ))}
            </ul>
          )}

          {outcome?.details && Object.keys(outcome.details).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-subtitle-color mb-1.5">{t('details_collected', 'Details collected')}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(outcome.details).map(([k, v]) => (
                  <span key={k} className="rounded-md bg-primary/10 px-2 py-1 text-xs text-title">
                    <span className="text-subtitle-color">{k.replace(/_/g, ' ')}:</span> {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {outcome?.follow_up?.at && (
            <p className="text-sm text-title">{t('follow_up_at', 'Follow up')}: <b>{formatWhen(outcome.follow_up.at, t)}</b>{outcome.follow_up.note ? ` — ${outcome.follow_up.note}` : ''}</p>
          )}
          {outcome?.ai_suggestion?.key && outcome.ai_suggestion.key !== outcome.key && (
            <p className="text-xs text-subtitle-color">
              {t('ai_suggested', 'AI suggested')}: {outcome.ai_suggestion.label || outcome.ai_suggestion.key}
              {outcome.ai_suggestion.why ? ` (${outcome.ai_suggestion.why})` : ''}
              {outcome.ai_suggestion.summary ? <span className="block italic">“{outcome.ai_suggestion.summary}”</span> : null}
            </p>
          )}

          {!editing ? (
            <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => { setEditing(true); setNewKey(outcome?.key || '') }}>
              {t('change_outcome', 'Change outcome')}
            </button>
          ) : (
            <div className="space-y-2 rounded-lg bg-primary/5 p-3">
              <Select value={newKey} onValueChange={setNewKey}>
                <SelectTrigger className="h-10 bg-bg-card border-input-border-color text-title rounded-radius">
                  <SelectValue placeholder={t('choose_outcome', 'Choose an outcome')} />
                </SelectTrigger>
                <SelectContent>
                  {outcomes.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('outcome_note_placeholder', 'Note (optional), e.g. booked on WhatsApp')} className="min-h-16 bg-bg-card border-input-border-color" />
              <p className="text-xs text-subtitle-color">{t('outcome_lock_hint', 'Your choice is kept; analysing the call again only suggests.')}</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="border-input-border-color" onClick={() => setEditing(false)}>{t('cancel', 'Cancel')}</Button>
                <Button size="sm" className="bg-primary text-white" onClick={saveOutcome} disabled={!newKey || saving}>
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}{t('save', 'Save')}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* What the caller made clear during the call */}
        {(signals.length > 0 || call.end_reason) && (
          <section className="mt-4 space-y-1.5">
            {signals.map((s, i) => (
              <p key={i} className="text-sm text-title">
                <span className="font-semibold">{signalLabel(s.type)}</span>
                {s.said && <span className="italic text-subtitle-color"> — “{s.said}”</span>}
                {s.callback_at && <span className="text-subtitle-color"> · {t('call_back', 'call back')} {formatWhen(s.callback_at, t)}</span>}
              </p>
            ))}
            {call.end_reason && <p className="text-xs text-subtitle-color">{t('call_ended', 'Call ended')}: {endReason(call.end_reason)}</p>}
          </section>
        )}

        {call.recording_url && (
          <section className="mt-4">
            <NativeAudioWithOverlay src={call.recording_url} durationInSeconds={call.duration} className="w-full!" />
          </section>
        )}

        {/* The conversation */}
        <section className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtitle-color mb-3">{t('call_transcript', 'Call Transcript')}</p>
          {Array.isArray(call.transcript) && call.transcript.length > 0 ? (
            <div className="flex flex-col gap-4 pb-2">
              {call.transcript.map((msg, idx, arr) => {
                const isVirtualCall = arr.some((m) => m?.role === 'human')
                const isRightSide = isVirtualCall ? msg?.role === 'human' : msg?.role === 'user'
                const time = msg?.timestamp ? format(new Date(msg.timestamp), 'hh:mm a') : ''
                return (
                  <div key={idx} className={cn('flex flex-col w-full', isRightSide ? 'items-end' : 'items-start')}>
                    <span className={cn('text-xs font-bold text-slate-500 mb-1', isRightSide ? 'text-right' : 'text-left')}>
                      {msg.role ? msg.role.charAt(0).toUpperCase() + msg.role.slice(1) : 'Unknown'}
                    </span>
                    <div className={cn(
                      'flex max-w-[85%] flex-col gap-1 px-4 py-3 text-[15px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
                      isRightSide ? 'bg-primary text-white rounded-2xl rounded-tr-sm' : 'bg-primary/10 text-primary dark:text-title rounded-2xl rounded-tl-sm'
                    )}>
                      {msg.interrupted ? (
                        <>
                          <span className="leading-relaxed whitespace-pre-wrap">{msg.heard || '…'}</span>
                          <span className="flex items-center gap-1 text-xs opacity-80"><Scissors className="h-3 w-3" />{t('cut_off_by_caller', 'Cut off by the caller')}</span>
                          <details className="text-xs opacity-80">
                            <summary className="cursor-pointer">{t('full_sentence', 'Full sentence')}</summary>
                            <span className="whitespace-pre-wrap">{msg.text}</span>
                          </details>
                        </>
                      ) : (
                        <span className="leading-relaxed whitespace-pre-wrap">{msg.text}</span>
                      )}
                      {time && <span className={cn('text-xs mt-1 text-right', isRightSide ? 'text-white' : 'text-subtitle-color')}>{time}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center text-sm justify-center min-h-[120px] w-full text-center text-subtitle-color">
              {t('no_transcript_available', 'No transcript available.')}
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import OutcomeBadge from '@/components/features/outcomes/OutcomeBadge'
import { formatWhen } from '@/components/features/outcomes/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetCallLogsQuery } from '@/redux/api/callApi'
import { useAnalyzePastCallsMutation, useTestOutcomeOnCallMutation } from '@/redux/api/outcomeApi'
import { OutcomeTestResult } from '@/types/outcomes'
import { AlertTriangle, FlaskConical, History, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const errorMessage = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message || fallback
const today = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)

// Check the saved outcomes on a real past call (nothing is saved), and
// analyse calls made before outcomes were turned on. Both use the saved
// settings, so `unsaved` warns when the page has changes not saved yet.
export default function TryOutcomes({ unsaved = false }: { unsaved?: boolean }) {
  const { t } = useTranslation()
  const { data: calls } = useGetCallLogsQuery({ limit: 20, status: 'completed', sortColumn: 'created_at', sortOrder: 'desc' })
  const [test, { isLoading: testing }] = useTestOutcomeOnCallMutation()
  const [analysePast, { isLoading: queueing }] = useAnalyzePastCallsMutation()
  const [callId, setCallId] = useState('')
  const [result, setResult] = useState<OutcomeTestResult | null>(null)
  const [from, setFrom] = useState(new Date(Date.now() - 7 * 86400000 + 330 * 60000).toISOString().slice(0, 10))
  const [to, setTo] = useState(today())

  const runTest = async () => {
    setResult(null)
    try {
      const res = await test({ call_id: callId }).unwrap()
      setResult(res.data)
    } catch (e) {
      toast.error(errorMessage(e, t('test_failed', 'Could not test on this call')))
    }
  }

  const runPast = async () => {
    try {
      const res = await analysePast({ from: new Date(`${from}T00:00:00+05:30`).toISOString(), to: new Date(`${to}T23:59:59+05:30`).toISOString() }).unwrap()
      toast.success(res.message || t('calls_queued', 'Calls queued for analysis'))
    } catch (e) {
      toast.error(errorMessage(e, t('analysis_failed', 'Could not analyse the calls')))
    }
  }

  const field = 'h-10 bg-bg-card border-input-border-color text-title rounded-radius'
  return (
    <div className="space-y-4">
    {unsaved && (
      <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{t('test_uses_saved', 'These use your saved settings. Save your changes first to test them.')}
      </p>
    )}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-lg border border-input-border-color bg-bg-card p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-title"><FlaskConical className="h-4 w-4 text-primary" />{t('try_on_past_call', 'Try it on a past call')}</h2>
          <p className="text-sm text-subtitle-color">{t('try_on_past_call_hint', 'Pick a recent call and see which outcome the AI would choose now. Nothing on the call changes.')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={callId} onValueChange={setCallId}>
            <SelectTrigger className={`${field} flex-1`}><SelectValue placeholder={t('choose_call', 'Choose a call')} /></SelectTrigger>
            <SelectContent>
              {(calls?.data || []).map((c) => (
                <SelectItem key={c.id || c._id} value={c.id || c._id}>{c.lead_name || (c.direction === 'inbound' ? c.from_number : c.to_number)} · {formatWhen(c.created_at, t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="h-10 bg-primary text-white" disabled={!callId || testing} onClick={runTest}>{testing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('try_it', 'Try it')}</Button>
        </div>
        {result && (
          <div className="rounded-lg bg-primary/5 p-3 space-y-2 text-sm">
            {result.waiting ? <p className="text-subtitle-color">{result.waiting}</p> : (
              <>
                <OutcomeBadge outcome={{ key: result.key, label: result.label, result: result.result, reached: result.reached }} showLock={false} />
                {result.summary && <p className="text-title">{result.summary}</p>}
                {result.reasons?.filter((r) => r.quote).map((r, i) => <p key={i} className="text-xs italic text-subtitle-color border-l-2 border-primary/40 pl-2">“{r.quote}”</p>)}
                {result.details && Object.keys(result.details).length > 0 && (
                  <p className="text-xs text-title">{Object.entries(result.details).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ')}</p>
                )}
                {result.ai_suggestion?.key && <p className="text-xs text-subtitle-color">{t('ai_suggested', 'AI suggested')}: {result.ai_suggestion.key}{result.ai_suggestion.why ? ` (${result.ai_suggestion.why})` : ''}</p>}
                {result.error && <p className="text-xs text-destructive">{result.error}</p>}
              </>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-input-border-color bg-bg-card p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-title"><History className="h-4 w-4 text-primary" />{t('analyse_past_calls', 'Analyse past calls')}</h2>
          <p className="text-sm text-subtitle-color">{t('analyse_past_calls_hint_long', 'Gives outcomes to calls made before this was turned on. Up to 200 calls per run; calls that already have one are skipped.')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <label className="flex-1 space-y-1"><span className="text-xs text-subtitle-color">{t('from', 'From')}</span><Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={field} /></label>
          <label className="flex-1 space-y-1"><span className="text-xs text-subtitle-color">{t('to', 'To')}</span><Input type="date" value={to} min={from} max={today()} onChange={(e) => setTo(e.target.value)} className={field} /></label>
          <Button variant="outline" className="h-10 border-input-border-color" disabled={!from || !to || queueing} onClick={runPast}>{queueing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('analyse', 'Analyse')}</Button>
        </div>
      </section>
    </div>
    </div>
  )
}

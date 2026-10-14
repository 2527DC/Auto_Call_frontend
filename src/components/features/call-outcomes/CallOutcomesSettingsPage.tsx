'use client'

import { PageHeader } from '@/components/reusable/PageHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textArea'
import { cn } from '@/lib/utils'
import { useApplyOutcomePresetMutation, useGetOutcomeSettingsQuery, useUpdateOutcomeSettingsMutation } from '@/redux/api/outcomeApi'
import { FollowUpMode, OutcomeSettings } from '@/types/outcomes'
import { Check, ListChecks, Loader2 } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import OutcomesEditor from './OutcomesEditor'
import TryOutcomes from './TryOutcomes'

const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati']
const errorMessage = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message || fallback

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-input-border-color bg-bg-card p-4 sm:p-5 space-y-3">
      <div>
        <h2 className="text-base font-bold text-title">{title}</h2>
        {hint && <p className="text-sm text-subtitle-color">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

// What the AI decides after each call: the outcomes, the lead statuses they
// lead to, who follows up, and the morning summary.
export default function CallOutcomesSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useGetOutcomeSettingsQuery()
  const [save, { isLoading: saving }] = useUpdateOutcomeSettingsMutation()
  const [applyPreset, { isLoading: applying }] = useApplyOutcomePresetMutation()
  const [draft, setDraft] = useState<OutcomeSettings | null>(null)
  const [dirty, setDirty] = useState(false)
  const [presetToApply, setPresetToApply] = useState<string | null>(null)

  const loaded = data?.data?.settings
  useEffect(() => {
    if (loaded && !dirty) setDraft(JSON.parse(JSON.stringify(loaded)))
  }, [loaded, dirty])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (isLoading || !draft) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  const presets = data?.data?.presets || []
  const templates = data?.data?.whatsapp_templates || []
  const change = (patch: Partial<OutcomeSettings>) => { setDraft({ ...draft, ...patch }); setDirty(true) }
  const followUp = draft.follow_up
  const digest = draft.digest || { enabled: false, email: '', whatsapp_template_id: null, whatsapp_to: '' }
  const setFollowUp = (patch: Partial<OutcomeSettings['follow_up']>) => change({ follow_up: { ...followUp, ...patch } })
  const setDigest = (patch: Partial<NonNullable<OutcomeSettings['digest']>>) => change({ digest: { ...digest, ...patch } })

  const onSave = async () => {
    try {
      await save({
        outcomes: draft.outcomes, lead_statuses: draft.lead_statuses, success_description: draft.success_description,
        follow_up: draft.follow_up, summary_language: draft.summary_language, digest: draft.digest,
      }).unwrap()
      toast.success(t('call_outcomes_saved', 'Call outcomes saved'))
      setDirty(false)
    } catch (e) {
      toast.error(errorMessage(e, t('save_failed', 'Could not save')))
    }
  }

  const onApplyPreset = async () => {
    if (!presetToApply) return
    try {
      const res = await applyPreset({ preset: presetToApply }).unwrap()
      toast.success(res.message || t('preset_applied', 'Preset applied'))
      setPresetToApply(null)
      setDirty(false)
    } catch (e) {
      toast.error(errorMessage(e, t('save_failed', 'Could not save')))
    }
  }

  const num = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Number(v) || min))
  const field = 'h-10 bg-bg-card border-input-border-color text-title rounded-radius'

  return (
    <div className="w-full space-y-5 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
      <PageHeader
        title={t('call_outcomes', 'Call Outcomes')}
        icon={<ListChecks className="w-8 h-8 text-primary" />}
        showBackButton={false}
      />
      <p className="text-sm text-subtitle-color -mt-3">{t('call_outcomes_subtitle', "After each call, the AI picks one of these outcomes, updates the person's lead status and plans the follow-up.")}</p>

      <Section title={t('business_type', 'Type of business')} hint={t('business_type_hint', 'Names your outcomes and statuses for your kind of business.')}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {presets.map((p) => {
            const current = draft.preset === p.key
            return (
              <div key={p.key} className={cn('flex flex-col justify-between gap-3 rounded-lg border p-3.5', current ? 'border-primary bg-primary/5' : 'border-input-border-color')}>
                <div>
                  <p className="font-semibold text-title flex items-center gap-1.5">{current && <Check className="h-4 w-4 text-primary" />}{p.label}</p>
                  <p className="text-xs text-subtitle-color mt-1">{p.success}</p>
                </div>
                {!current && <Button type="button" variant="outline" size="sm" className="self-start border-input-border-color" onClick={() => setPresetToApply(p.key)}>{t('use_this', 'Use this')}</Button>}
              </div>
            )
          })}
        </div>
      </Section>

      <Section title={t('what_counts_as_success', 'What counts as success')} hint={t('success_hint', 'The AI marks a call "Goal achieved" when this happens. Each agent can have its own.')}>
        <Textarea value={draft.success_description} maxLength={500} onChange={(e) => change({ success_description: e.target.value })} className="min-h-20 bg-bg-card border-input-border-color" />
      </Section>

      <Section title={t('outcomes', 'Outcomes')} hint={t('outcomes_hint', 'Rename them, say what happens next, or add your own. The description tells the AI when to pick it.')}>
        <OutcomesEditor outcomes={draft.outcomes} statuses={draft.lead_statuses} onChange={(outcomes) => change({ outcomes })} />
      </Section>

      <Section title={t('lead_statuses', 'Lead statuses')} hint={t('lead_statuses_hint', 'Where each person stands across all calls. You can rename them.')}>
        <div className="grid gap-2 sm:grid-cols-2">
          {draft.lead_statuses.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <Input value={s.label} maxLength={40} onChange={(e) => change({ lead_statuses: draft.lead_statuses.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className={field} />
              <span className="w-16 shrink-0 text-xs text-subtitle-color">{({ open: t('kind_open', 'Open'), won: t('kind_won', 'Won'), lost: t('kind_lost', 'Lost'), closed: t('kind_closed', 'Closed') } as Record<string, string>)[s.kind]}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('follow_ups', 'Follow-ups')} hint={t('follow_ups_settings_hint', 'When someone asks to be called back, or wasn\'t reached.')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-title">{t('who_follows_up', 'Who follows up')}</span>
            <Select value={followUp.mode} onValueChange={(v) => setFollowUp({ mode: v as FollowUpMode })}>
              <SelectTrigger className={field}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ai_call">{t('fu_mode_ai_calls_back', 'The AI agent calls back')}</SelectItem>
                <SelectItem value="team">{t('fu_mode_team', 'My team')}</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-title">{t('max_ai_attempts', 'AI call attempts per follow-up')}</span>
            <Input type="number" min={1} max={5} value={followUp.max_attempts} onChange={(e) => setFollowUp({ max_attempts: num(e.target.value, 1, 5) })} className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-title">{t('retry_after_hours', 'Try a dropped call again after (hours)')}</span>
            <Input type="number" min={1} max={72} value={followUp.retry_after_hours} onChange={(e) => setFollowUp({ retry_after_hours: num(e.target.value, 1, 72) })} className={field} />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-title">{t('max_unreached', 'Mark "Unreachable" after this many calls not answered')}</span>
            <Input type="number" min={1} max={10} value={followUp.max_unreached} onChange={(e) => setFollowUp({ max_unreached: num(e.target.value, 1, 10) })} className={field} />
          </label>
        </div>
        <p className="text-xs text-subtitle-color">{t('calling_hours_hint', 'AI calls are only placed within calling hours (10 AM – 9 PM).')}</p>
      </Section>

      <Section title={t('summary_language', 'Summary language')} hint={t('summary_language_hint', 'The language the AI writes call summaries in.')}>
        <Select value={draft.summary_language} onValueChange={(v) => change({ summary_language: v })}>
          <SelectTrigger className={cn(field, 'sm:w-[240px]')}><SelectValue /></SelectTrigger>
          <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </Section>

      <Section title={t('morning_summary', 'Morning summary')} hint={t('morning_summary_hint', "Sent at 9 AM: yesterday's calls, good leads and today's follow-ups.")}>
        <label className="flex items-center gap-2 text-sm text-title"><Switch checked={digest.enabled} onCheckedChange={(v) => setDigest({ enabled: v })} />{t('send_morning_summary', 'Send me a morning summary')}</label>
        {digest.enabled && (
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-title">{t('email', 'Email')}</span>
              <Input type="email" value={digest.email} onChange={(e) => setDigest({ email: e.target.value })} placeholder="you@business.com" className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-title">{t('whatsapp_template', 'WhatsApp template')}</span>
              <Select value={digest.whatsapp_template_id || '__none'} onValueChange={(v) => setDigest({ whatsapp_template_id: v === '__none' ? null : v })}>
                <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">{t('none', 'None')}</SelectItem>
                  {templates.map((tp) => <SelectItem key={tp.id} value={tp.id}>{tp.name} ({tp.language})</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="block text-xs text-subtitle-color">{t('digest_template_hint', 'An approved template with one variable for the summary text.')}</span>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-title">{t('whatsapp_number', 'WhatsApp number')}</span>
              <Input value={digest.whatsapp_to} onChange={(e) => setDigest({ whatsapp_to: e.target.value })} placeholder="+91 98450 12345" className={field} disabled={!digest.whatsapp_template_id} />
            </label>
          </div>
        )}
      </Section>

      <TryOutcomes />

      {/* Save bar */}
      <div className={cn('sticky bottom-20 z-10 flex flex-wrap items-center justify-end gap-3 rounded-lg border bg-bg-card px-4 py-3 shadow-lg', dirty ? 'border-primary/40' : 'border-input-border-color dark:border-white/10')}>
        {dirty && <span className="text-sm text-subtitle-color mr-auto">{t('unsaved_changes', 'You have unsaved changes')}</span>}
        {dirty && <Button variant="outline" className="border-input-border-color" onClick={() => { setDirty(false); setDraft(JSON.parse(JSON.stringify(loaded))) }}>{t('discard', 'Discard')}</Button>}
        <Button className="bg-primary text-white" disabled={!dirty || saving} onClick={onSave}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('save_changes', 'Save changes')}</Button>
      </div>

      <Dialog open={!!presetToApply} onOpenChange={(v) => !v && setPresetToApply(null)}>
        <DialogContent className="sm:max-w-[440px]! max-w-[calc(100%-1.5rem)]! bg-bg-card border-none rounded-modal-radius">
          <DialogHeader className="text-left">
            <DialogTitle className="text-title">{t('use_preset_title', 'Use "{{name}}"?', { name: presets.find((p) => p.key === presetToApply)?.label })}</DialogTitle>
            <DialogDescription className="text-subtitle-color">{t('use_preset_desc', 'Renames your outcomes and statuses for this kind of business. Outcomes you added yourself are kept.')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" className="border-input-border-color" onClick={() => setPresetToApply(null)}>{t('cancel', 'Cancel')}</Button>
            <Button className="bg-primary text-white" disabled={applying} onClick={onApplyPreset}>{applying && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('use_this', 'Use this')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

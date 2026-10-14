'use client'

import LeadStatusBadge from '@/components/features/outcomes/LeadStatusBadge'
import { PageHeader } from '@/components/reusable/PageHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textArea'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { cn } from '@/lib/utils'
import { useApplyOutcomePresetMutation, useGetOutcomeSettingsQuery, useUpdateOutcomeSettingsMutation } from '@/redux/api/outcomeApi'
import { FollowUpMode, OutcomeSettings } from '@/types/outcomes'
import { AlertTriangle, Check, CircleCheck, Clock, ListChecks, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import OutcomesEditor from './OutcomesEditor'
import TryOutcomes from './TryOutcomes'

const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati']
const errorMessage = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message || fallback

type Digest = NonNullable<OutcomeSettings['digest']>
type Editable = Pick<OutcomeSettings, 'outcomes' | 'lead_statuses' | 'success_description' | 'follow_up' | 'summary_language'> & { digest: Digest }
type TabKey = 'outcomes' | 'statuses' | 'follow_ups' | 'summaries' | 'test'

// Only the fields this page edits, so "unsaved changes" means a real difference.
const editable = (s: OutcomeSettings): Editable => JSON.parse(JSON.stringify({
  outcomes: s.outcomes,
  lead_statuses: s.lead_statuses,
  success_description: s.success_description || '',
  follow_up: s.follow_up,
  summary_language: s.summary_language,
  digest: s.digest || { enabled: false, email: '', whatsapp_template_id: null, whatsapp_to: '' },
}))
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-input-border-color bg-bg-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-title">{title}</h2>
          {hint && <p className="text-sm text-subtitle-color">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// A number box that can be cleared while typing; it settles within min–max on blur.
function NumberField({ value, min, max, onChange, className }: { value: number; min: number; max: number; onChange: (n: number) => void; className?: string }) {
  const [text, setText] = useState(String(value))
  useEffect(() => { setText(String(value)) }, [value])
  return (
    <Input type="number" inputMode="numeric" min={min} max={max} value={text} className={className}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value)
        if (e.target.value !== '' && Number.isInteger(n) && n >= min && n <= max) onChange(n)
      }}
      onBlur={() => {
        const n = Math.min(max, Math.max(min, Math.round(Number(text)) || min))
        setText(String(n))
        if (n !== value) onChange(n)
      }} />
  )
}

// What the AI decides after each call: the outcomes, the lead statuses they
// lead to, who follows up, and the morning summary.
export default function CallOutcomesSettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data, isLoading } = useGetOutcomeSettingsQuery()
  const [save, { isLoading: saving }] = useUpdateOutcomeSettingsMutation()
  const [applyPreset, { isLoading: applying }] = useApplyOutcomePresetMutation()
  // `saved` is what the server has; `draft` is what's on screen.
  const [form, setForm] = useState<{ saved: Editable; draft: Editable } | null>(null)
  const [tab, setTab] = useState<TabKey>('outcomes')
  const [presetToApply, setPresetToApply] = useState<string | null>(null)
  const saved = form?.saved
  const draft = form?.draft
  const dirty = !!form && !same(form.draft, form.saved)
  const { pendingHref, clearPending } = useUnsavedChangesGuard(dirty)

  const loaded = data?.data?.settings
  // Fresh data from the server replaces the screen, unless you're mid-edit.
  useEffect(() => {
    if (loaded) setForm((prev) => (prev && !same(prev.draft, prev.saved) ? prev : { saved: editable(loaded), draft: editable(loaded) }))
  }, [loaded])

  if (isLoading || !draft || !saved) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  const presets = data?.data?.presets || []
  const templates = data?.data?.whatsapp_templates || []
  const currentPreset = loaded?.preset
  const change = (patch: Partial<Editable>) => setForm({ saved, draft: { ...draft, ...patch } })
  const followUp = draft.follow_up
  const digest = draft.digest
  const setFollowUp = (patch: Partial<OutcomeSettings['follow_up']>) => change({ follow_up: { ...followUp, ...patch } })
  const setDigest = (patch: Partial<Digest>) => change({ digest: { ...digest, ...patch } })

  const TABS: { key: TabKey; label: string; changed: boolean }[] = [
    { key: 'outcomes', label: t('outcomes', 'Outcomes'), changed: !same(draft.outcomes, saved.outcomes) || draft.success_description !== saved.success_description },
    { key: 'statuses', label: t('lead_statuses', 'Lead statuses'), changed: !same(draft.lead_statuses, saved.lead_statuses) },
    { key: 'follow_ups', label: t('follow_ups', 'Follow-ups'), changed: !same(draft.follow_up, saved.follow_up) },
    { key: 'summaries', label: t('summaries', 'Summaries'), changed: draft.summary_language !== saved.summary_language || !same(draft.digest, saved.digest) },
    { key: 'test', label: t('test_it', 'Test it'), changed: false },
  ]
  const changedTabs = TABS.filter((x) => x.changed)

  // The same checks the server makes, shown before saving.
  const issues: { tab: TabKey; message: string }[] = []
  for (const o of draft.outcomes) {
    if (!o.label.trim()) issues.push({ tab: 'outcomes', message: t('issue_outcome_name', 'An outcome has no name') })
    else if (!o.system && !o.description.trim()) issues.push({ tab: 'outcomes', message: t('issue_outcome_description', '"{{name}}" needs a description: the AI uses it to recognise the outcome', { name: o.label }) })
  }
  if (draft.lead_statuses.some((s) => !s.label.trim())) issues.push({ tab: 'statuses', message: t('issue_status_name', 'A lead status has no name') })
  if (digest.enabled && digest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(digest.email.trim())) issues.push({ tab: 'summaries', message: t('issue_digest_email', 'Enter a valid email for the morning summary') })
  else if (digest.enabled && !digest.email.trim() && !(digest.whatsapp_template_id && digest.whatsapp_to.trim())) issues.push({ tab: 'summaries', message: t('issue_digest_target', 'Add an email, or a WhatsApp template and number, for the morning summary') })

  const onSave = async (): Promise<boolean> => {
    if (issues.length) {
      setTab(issues[0].tab)
      toast.error(issues[0].message)
      return false
    }
    try {
      await save({
        outcomes: draft.outcomes, lead_statuses: draft.lead_statuses, success_description: draft.success_description,
        follow_up: draft.follow_up, summary_language: draft.summary_language, digest: draft.digest,
      }).unwrap()
      setForm({ saved: JSON.parse(JSON.stringify(draft)), draft })
      toast.success(t('call_outcomes_saved', 'Call outcomes saved'))
      return true
    } catch (e) {
      toast.error(errorMessage(e, t('save_failed', 'Could not save')))
      return false
    }
  }
  const onDiscard = () => setForm({ saved, draft: JSON.parse(JSON.stringify(saved)) })

  const onApplyPreset = async () => {
    if (!presetToApply) return
    try {
      const res = await applyPreset({ preset: presetToApply }).unwrap()
      setForm({ saved: editable(res.data), draft: editable(res.data) })
      toast.success(res.message || t('preset_applied', 'Preset applied'))
      setPresetToApply(null)
    } catch (e) {
      toast.error(errorMessage(e, t('save_failed', 'Could not save')))
    }
  }

  const leave = async (how: 'save' | 'discard') => {
    const href = pendingHref
    if (!href) return
    if (how === 'save' && !(await onSave())) { clearPending(); return }
    if (how === 'discard') onDiscard()
    clearPending()
    router.push(href)
  }

  const field = 'h-10 bg-bg-card border-input-border-color text-title rounded-radius'
  const kindLabel: Record<string, string> = { open: t('kind_open', 'Open'), won: t('kind_won', 'Won'), lost: t('kind_lost', 'Lost'), closed: t('kind_closed', 'Closed') }

  return (
    <div className="w-full space-y-5 pb-28 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
      <PageHeader
        title={t('call_outcomes', 'Call Outcomes')}
        icon={<ListChecks className="w-8 h-8 text-primary" />}
        showBackButton={false}
        endContent={dirty ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400"><span className="h-2 w-2 rounded-full bg-amber-500" />{t('unsaved_changes', 'Unsaved changes')}</span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-subtitle-color"><CircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{t('all_changes_saved', 'All changes saved')}</span>
        )}
      />
      <p className="text-sm text-subtitle-color -mt-3">{t('call_outcomes_subtitle', "After each call, the AI picks one of these outcomes, updates the person's lead status and plans the follow-up.")}</p>

      <Section title={t('business_type', 'Type of business')} hint={t('business_type_hint_short', 'Starts your outcomes and lead statuses with names that fit your business. Changing it is saved straight away.')}>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {presets.map((p) => {
            const current = currentPreset === p.key
            return (
              <button key={p.key} type="button" disabled={current} onClick={() => setPresetToApply(p.key)}
                className={cn('rounded-lg border px-3 py-2.5 text-left transition-colors',
                  current ? 'border-primary bg-primary/5 cursor-default' : 'border-input-border-color hover:border-primary/50 hover:bg-primary/5')}>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-title">
                  {current && <Check className="h-4 w-4 shrink-0 text-primary" />}{p.label}
                  {current && <span className="ml-auto text-xs font-medium text-primary">{t('in_use', 'In use')}</span>}
                </span>
                <span className="mt-0.5 block text-xs text-subtitle-color line-clamp-2">{p.success}</span>
              </button>
            )
          })}
        </div>
      </Section>

      <div className="max-w-full overflow-x-auto">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="h-12 p-1.5">
            {TABS.map((x) => (
              <TabsTrigger key={x.key} value={x.key} className="gap-1.5 px-4 data-[state=active]:text-white">
                {x.label}
                {x.changed && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label={t('unsaved_changes', 'Unsaved changes')} />}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {tab === 'outcomes' && (
        <>
          <Section title={t('what_counts_as_success', 'What counts as success')} hint={t('success_hint', 'The AI marks a call "Goal achieved" when this happens. Each agent can have its own.')}>
            <Textarea value={draft.success_description} maxLength={500} onChange={(e) => change({ success_description: e.target.value })} className="min-h-20 bg-bg-card border-input-border-color" />
          </Section>
          <Section title={t('outcomes', 'Outcomes')} hint={t('outcomes_hint_short', 'What the AI can pick after a call. Click one to rename it, describe when to use it, or change what happens next.')}>
            <OutcomesEditor outcomes={draft.outcomes} savedKeys={saved.outcomes.map((o) => o.key)} statuses={draft.lead_statuses} onChange={(outcomes) => change({ outcomes })} />
          </Section>
        </>
      )}

      {tab === 'statuses' && (
        <Section title={t('lead_statuses', 'Lead statuses')} hint={t('lead_statuses_hint_long', "Where each person stands across all their calls. Each outcome moves the person to one of these. Rename them to match how your team talks.")}>
          <div className="grid gap-x-6 gap-y-2.5 md:grid-cols-2">
            {draft.lead_statuses.map((s, i) => (
              <div key={s.key} className="flex items-center gap-3">
                <Input value={s.label} maxLength={40} onChange={(e) => change({ lead_statuses: draft.lead_statuses.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                  className={cn(field, !s.label.trim() && 'border-destructive/60')} aria-label={t('status_name', 'Status name')} />
                <LeadStatusBadge status={s.key} label={kindLabel[s.kind]} statuses={draft.lead_statuses} className="w-20 shrink-0 justify-center text-xs" />
              </div>
            ))}
          </div>
          <dl className="grid gap-x-6 gap-y-1 rounded-md bg-primary/5 p-3 text-xs sm:grid-cols-2">
            <div><dt className="inline font-semibold text-title">{kindLabel.open}: </dt><dd className="inline text-subtitle-color">{t('kind_open_hint', 'still being worked on')}</dd></div>
            <div><dt className="inline font-semibold text-title">{kindLabel.won}: </dt><dd className="inline text-subtitle-color">{t('kind_won_hint', 'the goal was reached; calls never move them back')}</dd></div>
            <div><dt className="inline font-semibold text-title">{kindLabel.lost}: </dt><dd className="inline text-subtitle-color">{t('kind_lost_hint', 'not going ahead for now')}</dd></div>
            <div><dt className="inline font-semibold text-title">{kindLabel.closed}: </dt><dd className="inline text-subtitle-color">{t('kind_closed_hint', 'never contacted again (Do not call)')}</dd></div>
          </dl>
        </Section>
      )}

      {tab === 'follow_ups' && (
        <Section title={t('follow_ups', 'Follow-ups')} hint={t('follow_ups_settings_hint_long', "What happens when someone asks to be called back, shows interest, or wasn't reached.")}>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-title">{t('who_follows_up', 'Who follows up')}</span>
              <Select value={followUp.mode} onValueChange={(v) => setFollowUp({ mode: v as FollowUpMode })}>
                <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_call">{t('fu_mode_ai_calls_back', 'The AI agent calls back')}</SelectItem>
                  <SelectItem value="team">{t('fu_mode_team', 'My team')}</SelectItem>
                </SelectContent>
              </Select>
              <span className="block text-xs text-subtitle-color">{t('who_follows_up_hint', 'For callbacks. Each agent can override this in its "After the call" settings.')}</span>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-title">{t('max_ai_attempts', 'AI call attempts per follow-up')}</span>
              <NumberField value={followUp.max_attempts} min={1} max={5} onChange={(n) => setFollowUp({ max_attempts: n })} className={field} />
              <span className="block text-xs text-subtitle-color">{t('max_ai_attempts_hint', 'If nobody answers this many times, the follow-up goes to your team. 1–5.')}</span>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-title">{t('retry_after_hours', 'Try a dropped call again after (hours)')}</span>
              <NumberField value={followUp.retry_after_hours} min={1} max={72} onChange={(n) => setFollowUp({ retry_after_hours: n })} className={field} />
              <span className="block text-xs text-subtitle-color">{t('retry_after_hours_hint', 'Also the gap between AI callback attempts. 1–72.')}</span>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-title">{t('max_unreached', 'Mark "Unreachable" after this many calls not answered')}</span>
              <NumberField value={followUp.max_unreached} min={1} max={10} onChange={(n) => setFollowUp({ max_unreached: n })} className={field} />
              <span className="block text-xs text-subtitle-color">{t('max_unreached_hint', 'Counts calls in a row that nobody picked up. 1–10.')}</span>
            </label>
          </div>
          <p className="flex items-center gap-1.5 rounded-md bg-primary/5 px-3 py-2 text-xs text-subtitle-color">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />{t('calling_hours_hint_long', 'AI callbacks and retries are only placed within calling hours (10 AM – 9 PM India time). A callback asked for outside them moves to the next allowed time.')}
          </p>
        </Section>
      )}

      {tab === 'summaries' && (
        <>
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
            {issues.some((x) => x.tab === 'summaries') && <p className="text-xs text-destructive">{issues.find((x) => x.tab === 'summaries')?.message}</p>}
          </Section>
        </>
      )}

      {tab === 'test' && <TryOutcomes unsaved={dirty} />}

      {/* Shown only when something changed; covers every tab. */}
      {dirty && (
        <div role="region" aria-label={t('unsaved_changes', 'Unsaved changes')}
          className="sticky bottom-20 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-primary/40 bg-bg-card px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="mr-auto min-w-0">
            <p className="text-sm font-semibold text-title">{t('unsaved_changes', 'Unsaved changes')}</p>
            <p className="text-xs text-subtitle-color">
              {t('changed_in', 'Changed: {{tabs}}', { tabs: changedTabs.map((x) => x.label).join(', ') })}
              {issues.length > 0 && (
                <button type="button" onClick={() => setTab(issues[0].tab)} className="ml-2 inline-flex items-center gap-1 font-semibold text-destructive hover:underline">
                  <AlertTriangle className="h-3 w-3" />{t('n_to_fix', '{{n}} to fix', { n: issues.length })}
                </button>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-input-border-color" disabled={saving} onClick={onDiscard}>{t('discard_changes', 'Discard changes')}</Button>
            <Button className="bg-primary text-white" disabled={saving} onClick={onSave}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('save_changes', 'Save changes')}</Button>
          </div>
        </div>
      )}

      <Dialog open={!!presetToApply} onOpenChange={(v) => !v && setPresetToApply(null)}>
        <DialogContent className="sm:max-w-[440px]! max-w-[calc(100%-1.5rem)]! bg-bg-card border-none rounded-modal-radius">
          <DialogHeader className="text-left">
            <DialogTitle className="text-title">{t('use_preset_title', 'Use "{{name}}"?', { name: presets.find((p) => p.key === presetToApply)?.label })}</DialogTitle>
            <DialogDescription className="text-subtitle-color">{t('use_preset_desc', 'Renames your outcomes and statuses for this kind of business. Outcomes you added yourself are kept.')}</DialogDescription>
          </DialogHeader>
          {dirty && (
            <p className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{t('preset_drops_changes', 'Your unsaved changes on this page will be replaced.')}
            </p>
          )}
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" className="border-input-border-color" onClick={() => setPresetToApply(null)}>{t('cancel', 'Cancel')}</Button>
            <Button className="bg-primary text-white" disabled={applying} onClick={onApplyPreset}>{applying && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('use_this', 'Use this')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingHref} onOpenChange={(v) => !v && clearPending()}>
        <DialogContent className="sm:max-w-[460px]! max-w-[calc(100%-1.5rem)]! bg-bg-card border-none rounded-modal-radius">
          <DialogHeader className="text-left">
            <DialogTitle className="text-title">{t('leave_unsaved_title', 'Save your changes first?')}</DialogTitle>
            <DialogDescription className="text-subtitle-color">{t('leave_unsaved_desc', 'You changed {{tabs}}. If you leave without saving, those changes are lost.', { tabs: changedTabs.map((x) => x.label).join(', ') })}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="ghost" className="text-subtitle-color sm:mr-auto" onClick={clearPending}>{t('keep_editing', 'Keep editing')}</Button>
            <Button variant="outline" className="border-input-border-color" onClick={() => leave('discard')}>{t('discard_and_leave', 'Discard and leave')}</Button>
            <Button className="bg-primary text-white" disabled={saving} onClick={() => leave('save')}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('save_and_leave', 'Save and leave')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

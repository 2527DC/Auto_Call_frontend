'use client'

import { outcomeDot } from '@/components/features/outcomes/OutcomeBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { LeadStatusDefinition, OutcomeDefinition, OutcomeNextStep, OutcomeResult } from '@/types/outcomes'
import { AlertTriangle, Archive, ArchiveRestore, ArrowRight, Ban, ChevronDown, Lock, Plus } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  outcomes: OutcomeDefinition[]
  // Keys already saved on the server; only unsaved outcomes may change key.
  savedKeys: string[]
  statuses: LeadStatusDefinition[]
  onChange: (next: OutcomeDefinition[]) => void
}

// "Needs a loan" -> "needs_a_loan", unique among the existing keys.
const keyFrom = (label: string, taken: string[]) => {
  const base = (label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^[^a-z]+/, '') || 'outcome').slice(0, 34)
  let key = base
  for (let i = 2; taken.includes(key); i++) key = `${base}_${i}`
  return key
}

// The client's outcomes: what each means (good/bad), what happens next, and
// the lead status it sets. Each is one line until opened. Rule-set ones (no
// answer, busy…) can only be renamed.
export default function OutcomesEditor({ outcomes, savedKeys, statuses, onChange }: Props) {
  const { t } = useTranslation()
  const [showArchived, setShowArchived] = useState(false)
  // Rows are tracked by position: keys of unsaved outcomes follow their name.
  const [open, setOpen] = useState<number[]>([])
  const toggle = (i: number) => setOpen(open.includes(i) ? open.filter((x) => x !== i) : [...open, i])

  const update = (i: number, patch: Partial<OutcomeDefinition>) => onChange(outcomes.map((o, j) => (j === i ? { ...o, ...patch } : o)))
  const rename = (i: number, label: string) => {
    const o = outcomes[i]
    if (savedKeys.includes(o.key)) return update(i, { label })
    update(i, { label, key: keyFrom(label, outcomes.filter((_, j) => j !== i).map((x) => x.key)) })
  }

  const addOutcome = () => {
    const label = t('new_outcome', 'New outcome')
    const key = keyFrom(label, outcomes.map((o) => o.key))
    setOpen([...open, outcomes.length])
    onChange([...outcomes, {
      key, label, description: '', reached: true, result: 'neutral', next_step: 'none',
      stops_calls: false, lead_status: 'contacted', system: false, archived: false, order: outcomes.length,
    }])
  }

  const RESULTS: { value: OutcomeResult; label: string }[] = [
    { value: 'good', label: t('result_good', 'Good') },
    { value: 'neutral', label: t('result_neutral', 'Neutral') },
    { value: 'bad', label: t('result_bad', 'Bad') },
  ]
  const NEXT: { value: OutcomeNextStep; label: string }[] = [
    { value: 'none', label: t('next_none', 'Nothing') },
    { value: 'retry', label: t('next_retry', 'Try again later') },
    { value: 'follow_up', label: t('next_follow_up', 'Follow up') },
    { value: 'team_task', label: t('next_team_task', 'Task for the team') },
  ]
  const statusLabel = (key?: string | null) => statuses.find((s) => s.key === key)?.label

  const indexed = outcomes.map((o, i) => ({ o, i }))
  const aiPicked = indexed.filter(({ o }) => !o.archived && !o.system)
  const automatic = indexed.filter(({ o }) => !o.archived && o.system)
  const archived = indexed.filter(({ o }) => o.archived)
  const allOpen = aiPicked.length > 0 && aiPicked.every(({ i }) => open.includes(i))
  const field = 'h-9 bg-bg-card border-input-border-color text-title rounded-radius text-sm'
  const chip = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs whitespace-nowrap'

  const row = ({ o, i }: { o: OutcomeDefinition; i: number }) => {
    const isOpen = open.includes(i)
    const missing = !o.system && !o.description.trim()
    const next = NEXT.find((n) => n.value === o.next_step)
    return (
      <div key={i} className={cn('rounded-lg border transition-colors', isOpen ? 'border-primary/40 bg-primary/[0.03]' : 'border-input-border-color', o.archived && 'opacity-70')}>
        <button type="button" onClick={() => toggle(i)} aria-expanded={isOpen}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
          <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', outcomeDot(o))} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-title">{o.label || t('untitled', 'Untitled')}</span>
            {!o.system && o.description.trim() && <span className="block truncate text-xs text-subtitle-color">{o.description}</span>}
          </span>
          <span className="hidden sm:flex flex-wrap items-center justify-end gap-1.5">
            {missing && <span className={cn(chip, 'bg-destructive/10 text-destructive')}><AlertTriangle className="h-3 w-3" />{t('needs_description', 'Needs a description')}</span>}
            {o.system && <span className={cn(chip, 'text-subtitle-color')}><Lock className="h-3 w-3" />{t('automatic', 'Automatic')}</span>}
            {!o.system && next && o.next_step !== 'none' && <span className={cn(chip, 'bg-primary/10 text-title')}>{next.label}</span>}
            {!o.system && statusLabel(o.lead_status) && <span className={cn(chip, 'border border-input-border-color text-subtitle-color')}><ArrowRight className="h-3 w-3" />{statusLabel(o.lead_status)}</span>}
            {o.stops_calls && <span className={cn(chip, 'bg-destructive/10 text-destructive')}><Ban className="h-3 w-3" />{t('stops_contact_short', 'Stops contact')}</span>}
          </span>
          {missing && <AlertTriangle className="sm:hidden h-4 w-4 shrink-0 text-destructive" />}
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-subtitle-color transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="space-y-3 border-t border-input-border-color px-3 pb-3 pt-3">
            <label className="block space-y-1">
              <span className="text-xs text-subtitle-color">{t('outcome_name', 'Outcome name')}</span>
              <Input value={o.label} maxLength={60} onChange={(e) => rename(i, e.target.value)} className={cn(field, 'font-semibold', !o.label.trim() && 'border-destructive/60')} autoFocus={!savedKeys.includes(o.key)} />
            </label>
            {o.system ? (
              <p className="flex items-center gap-1.5 text-xs text-subtitle-color"><Lock className="h-3 w-3" />{t('system_outcome_hint', 'Set automatically from the call status, without the AI. You can only rename it.')}</p>
            ) : (
              <>
                <label className="block space-y-1">
                  <span className="text-xs text-subtitle-color">{t('when_to_pick', 'When should the AI pick this?')}</span>
                  <Input value={o.description} maxLength={300} onChange={(e) => update(i, { description: e.target.value })}
                    placeholder={t('outcome_description_placeholder', 'e.g. "Interested, but needs a home loan first"')}
                    className={cn(field, missing && 'border-destructive/60')} />
                  {missing && <span className="block text-xs text-destructive">{t('outcome_description_needed', 'Needed: the AI uses this to recognise the outcome.')}</span>}
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="space-y-1">
                    <span className="text-xs text-subtitle-color">{t('result', 'Result')}</span>
                    <Select value={o.result} onValueChange={(v) => update(i, { result: v as OutcomeResult })}>
                      <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                      <SelectContent>{RESULTS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-subtitle-color">{t('then', 'Then')}</span>
                    <Select value={o.next_step} onValueChange={(v) => update(i, { next_step: v as OutcomeNextStep })}>
                      <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                      <SelectContent>{NEXT.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-subtitle-color">{t('lead_status_becomes', 'Lead status becomes')}</span>
                    <Select value={o.lead_status || '__keep'} onValueChange={(v) => update(i, { lead_status: v === '__keep' ? null : v })}>
                      <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__keep">{t('keep_status', 'Keep as it is')}</SelectItem>
                        {statuses.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <label className="flex items-center gap-2 text-sm text-title" title={t('person_reached_hint', 'Off for outcomes where nobody real was spoken to')}>
                    <Switch checked={o.reached} onCheckedChange={(v) => update(i, { reached: v })} />{t('person_reached', 'Person reached')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-title">
                    <Switch checked={o.stops_calls} onCheckedChange={(v) => update(i, { stops_calls: v })} />{t('stops_calls', 'Stop all contact')}
                  </label>
                  <Button type="button" variant="ghost" size="sm" className="ml-auto h-8 text-subtitle-color" onClick={() => update(i, { archived: !o.archived })}>
                    {o.archived ? <ArchiveRestore className="h-4 w-4 mr-1" /> : <Archive className="h-4 w-4 mr-1" />}
                    {o.archived ? t('restore', 'Restore') : t('archive', 'Archive')}
                  </Button>
                </div>
                {o.stops_calls && <p className="text-xs text-destructive">{t('stops_calls_warning', 'People with this outcome are never called or messaged again, until you change their status.')}</p>}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const groupTitle = (title: string, hint: string, action?: ReactNode) => (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h3 className="text-sm font-bold text-title">{title}</h3>
        <p className="text-xs text-subtitle-color">{hint}</p>
      </div>
      {action}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {groupTitle(
          t('outcomes_ai_group', 'Picked by the AI ({{n}})', { n: aiPicked.length }),
          t('outcomes_ai_group_hint', 'For calls where someone answered. The AI reads the conversation and picks one.'),
          aiPicked.length > 0 && (
            <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => setOpen(allOpen ? [] : aiPicked.map(({ i }) => i))}>
              {allOpen ? t('collapse_all', 'Collapse all') : t('expand_all', 'Expand all')}
            </button>
          ),
        )}
        {aiPicked.map(row)}
        <Button type="button" variant="outline" className="w-full gap-1.5 border-dashed border-input-border-color text-subtitle-color hover:text-title" onClick={addOutcome}>
          <Plus className="h-4 w-4" />{t('add_outcome', 'Add outcome')}
        </Button>
      </div>

      <div className="space-y-2">
        {groupTitle(
          t('outcomes_auto_group', 'Automatic ({{n}})', { n: automatic.length }),
          t('outcomes_auto_group_hint', "Set from the call status when nobody talked, for example no answer or busy. Free, no AI."),
        )}
        {automatic.map(row)}
      </div>

      {archived.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-1 text-sm font-semibold text-subtitle-color">
            <ChevronDown className={cn('h-4 w-4 transition-transform', showArchived && 'rotate-180')} />
            {t('archived_outcomes', 'Archived ({{n}})', { n: archived.length })}
          </button>
          {showArchived && <div className="mt-2 space-y-2">{archived.map(row)}</div>}
        </div>
      )}
    </div>
  )
}

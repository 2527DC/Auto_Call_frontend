'use client'

import { outcomeDot } from '@/components/features/outcomes/OutcomeBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { LeadStatusDefinition, OutcomeDefinition, OutcomeNextStep, OutcomeResult } from '@/types/outcomes'
import { Archive, ArchiveRestore, ChevronDown, Lock, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  outcomes: OutcomeDefinition[]
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
// the lead status it sets. Rule-set ones (no answer, busy…) can only be renamed.
export default function OutcomesEditor({ outcomes, statuses, onChange }: Props) {
  const { t } = useTranslation()
  const [showArchived, setShowArchived] = useState(false)
  // Outcomes added here and not saved yet: their key follows their name.
  const [fresh, setFresh] = useState<string[]>([])
  const update = (key: string, patch: Partial<OutcomeDefinition>) => onChange(outcomes.map((o) => (o.key === key ? { ...o, ...patch } : o)))
  const rename = (key: string, label: string) => {
    if (!fresh.includes(key)) return update(key, { label })
    const next = keyFrom(label, outcomes.filter((o) => o.key !== key).map((o) => o.key))
    setFresh(fresh.map((k) => (k === key ? next : k)))
    update(key, { label, key: next })
  }

  const addOutcome = () => {
    const label = t('new_outcome', 'New outcome')
    const key = keyFrom(label, outcomes.map((o) => o.key))
    setFresh([...fresh, key])
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

  const active = outcomes.filter((o) => !o.archived)
  const archived = outcomes.filter((o) => o.archived)
  const field = 'h-9 bg-bg-card border-input-border-color text-title rounded-radius text-sm'

  const row = (o: OutcomeDefinition) => (
    <div key={outcomes.indexOf(o)} className={cn('rounded-lg border border-input-border-color p-3 space-y-2.5', o.archived && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', outcomeDot(o))} />
        <Input value={o.label} maxLength={60} onChange={(e) => rename(o.key, e.target.value)} className={cn(field, 'flex-1 min-w-[180px] font-semibold')} aria-label={t('outcome_name', 'Outcome name')} />
        {o.system ? (
          <span className="flex items-center gap-1 text-xs text-subtitle-color"><Lock className="h-3 w-3" />{t('set_from_call_status', 'Set from the call status')}</span>
        ) : (
          <Button type="button" variant="ghost" size="sm" className="h-8 text-subtitle-color" onClick={() => update(o.key, { archived: !o.archived })}>
            {o.archived ? <ArchiveRestore className="h-4 w-4 mr-1" /> : <Archive className="h-4 w-4 mr-1" />}
            {o.archived ? t('restore', 'Restore') : t('archive', 'Archive')}
          </Button>
        )}
      </div>
      {!o.system && (
        <>
          <Input value={o.description} maxLength={300} onChange={(e) => update(o.key, { description: e.target.value })}
            placeholder={t('outcome_description_placeholder', 'When should the AI pick this? e.g. "Interested, but needs a home loan first"')}
            className={cn(field, !o.description.trim() && 'border-destructive/50')} />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs text-subtitle-color">{t('result', 'Result')}</span>
              <Select value={o.result} onValueChange={(v) => update(o.key, { result: v as OutcomeResult })}>
                <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                <SelectContent>{RESULTS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-subtitle-color">{t('then', 'Then')}</span>
              <Select value={o.next_step} onValueChange={(v) => update(o.key, { next_step: v as OutcomeNextStep })}>
                <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                <SelectContent>{NEXT.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-subtitle-color">{t('lead_status', 'Lead status')}</span>
              <Select value={o.lead_status || '__keep'} onValueChange={(v) => update(o.key, { lead_status: v === '__keep' ? null : v })}>
                <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__keep">{t('keep_status', 'Keep as it is')}</SelectItem>
                  {statuses.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <div className="space-y-1.5">
              <span className="text-xs text-subtitle-color">{t('options', 'Options')}</span>
              <label className="flex items-center gap-2 text-sm text-title"><Switch checked={o.reached} onCheckedChange={(v) => update(o.key, { reached: v })} />{t('person_reached', 'Person reached')}</label>
              <label className="flex items-center gap-2 text-sm text-title"><Switch checked={o.stops_calls} onCheckedChange={(v) => update(o.key, { stops_calls: v })} />{t('stops_calls', 'Stop all contact')}</label>
            </div>
          </div>
          {o.stops_calls && <p className="text-xs text-destructive">{t('stops_calls_warning', 'People with this outcome are never called or messaged again, until you change their status.')}</p>}
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-3">
      {active.map(row)}
      <Button type="button" variant="outline" className="gap-1.5 border-dashed border-input-border-color" onClick={addOutcome}>
        <Plus className="h-4 w-4" />{t('add_outcome', 'Add outcome')}
      </Button>
      {archived.length > 0 && (
        <div className="pt-2">
          <button type="button" onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-1 text-sm font-semibold text-subtitle-color">
            <ChevronDown className={cn('h-4 w-4 transition-transform', showArchived && 'rotate-180')} />
            {t('archived_outcomes', 'Archived ({{n}})', { n: archived.length })}
          </button>
          {showArchived && <div className="mt-2 space-y-3">{archived.map(row)}</div>}
        </div>
      )}
    </div>
  )
}

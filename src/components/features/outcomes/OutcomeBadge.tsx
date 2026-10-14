'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CallOutcome, OutcomeResult } from '@/types/outcomes'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Colour by what the outcome means: good, bad or neutral; grey when nobody was reached.
const TONE: Record<OutcomeResult | 'unreached' | 'pending', string> = {
  good: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
  bad: 'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400',
  neutral: 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400',
  unreached: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-zinc-300 dark:border-white/15',
  pending: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-white/10',
}

export const outcomeTone = (outcome?: Pick<CallOutcome, 'result' | 'reached'> | null) =>
  !outcome?.result ? TONE.pending : outcome.reached === false ? TONE.unreached : TONE[outcome.result] || TONE.neutral

// A solid dot in the same colour, readable on light and dark cards.
const DOT: Record<OutcomeResult | 'unreached', string> = { good: 'bg-emerald-500', bad: 'bg-rose-500', neutral: 'bg-amber-500', unreached: 'bg-slate-400' }
export const outcomeDot = (outcome?: Pick<CallOutcome, 'result' | 'reached'> | null) =>
  outcome?.reached === false ? DOT.unreached : DOT[outcome?.result as OutcomeResult] || DOT.neutral

interface OutcomeBadgeProps {
  outcome?: CallOutcome | null
  className?: string
  showLock?: boolean
}

// The call's outcome, or "Analysing…" / "Not analysed".
export function OutcomeBadge({ outcome, className, showLock = true }: OutcomeBadgeProps) {
  const { t } = useTranslation()
  if (!outcome?.key) {
    const analysing = outcome?.state && ['pending', 'processing', 'waiting_transcript'].includes(outcome.state)
    return (
      <Badge variant="outline" className={cn('w-fit font-semibold px-2.5 py-0.5', TONE.pending, className)}>
        {analysing ? t('outcome_analysing', 'Analysing…') : t('outcome_not_analysed', 'Not analysed')}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className={cn('w-fit font-semibold px-2.5 py-0.5 gap-1 max-w-full', outcomeTone(outcome), className)} title={outcome.summary || undefined}>
      {showLock && outcome.locked && <Lock className="h-3 w-3 shrink-0" aria-label={t('set_by_a_person', 'Set by a person')} />}
      <span className="truncate">{outcome.label}</span>
    </Badge>
  )
}

export default OutcomeBadge

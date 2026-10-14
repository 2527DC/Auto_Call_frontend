'use client'

import { formatCount } from './chartTheme'
import { TrendCard } from './TrendCard'
import { DashboardOutcomes, OutcomeResult } from '@/types/outcomes'
import { CalendarClock } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

const DOT: Record<OutcomeResult, string> = { good: 'bg-emerald-500', bad: 'bg-rose-500', neutral: 'bg-amber-500' }

// What the period's calls led to: calls → reached → good result → goal
// achieved, the commonest outcomes, and follow-ups waiting today.
export function OutcomesCard({ outcomes, className }: { outcomes: DashboardOutcomes; className?: string }) {
  const { t } = useTranslation()
  const { funnel, top, follow_ups } = outcomes
  // Shares of the analysed calls (calls made before outcomes were on have none).
  const pct = (n: number) => (funnel.analysed ? Math.round((n / funnel.analysed) * 100) : 0)
  const steps = [
    { label: t('funnel_analysed', 'Analysed calls'), value: funnel.analysed, bar: 'bg-primary/25' },
    { label: t('funnel_reached', 'Reached'), value: funnel.reached, bar: 'bg-primary/45' },
    { label: t('funnel_good', 'Good result'), value: funnel.good, bar: 'bg-primary/70' },
    { label: t('funnel_goal', 'Goal achieved'), value: funnel.goal_achieved, bar: 'bg-primary' },
  ]
  const nothing = !funnel.analysed && !follow_ups.due_today && !follow_ups.overdue

  return (
    <TrendCard
      className={className}
      title={t('call_outcomes', 'Call Outcomes')}
      subtitle={t('call_outcomes_dashboard_desc', 'What your calls led to in the selected period.')}
      actions={
        <Link href="/leads?tab=follow-ups" className="inline-flex items-center gap-1.5 rounded-lg border border-input-border-color px-3 py-1.5 text-sm font-semibold text-title hover:border-primary/50">
          <CalendarClock className="h-4 w-4 text-primary" />
          {t('follow_ups_today', '{{n}} due today', { n: follow_ups.due_today })}
          {follow_ups.overdue > 0 && <span className="text-destructive">· {t('follow_ups_overdue', '{{n}} overdue', { n: follow_ups.overdue })}</span>}
        </Link>
      }
    >
      {nothing ? (
        <p className="mt-6 text-sm text-subtitle-color">{t('outcomes_empty', 'Outcomes appear here after your calls are analysed.')}</p>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <ul className="space-y-3">
            <li className="text-xs text-subtitle-color">{t('funnel_of_calls', '{{a}} of {{n}} calls in this period were analysed', { a: formatCount(funnel.analysed), n: formatCount(funnel.calls) })}</li>
            {steps.map((s) => (
              <li key={s.label}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-title">{s.label}</span>
                  <span className="text-subtitle-color"><b className="text-title">{formatCount(s.value)}</b> · {pct(s.value)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-primary/5">
                  <div className={`h-2.5 rounded-full ${s.bar}`} style={{ width: `${Math.max(pct(s.value), s.value ? 2 : 0)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtitle-color">{t('top_outcomes', 'Top outcomes')}</p>
            {top.length ? (
              <ul className="space-y-2">
                {top.map((o) => (
                  <li key={o.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-title"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${o.reached === false ? 'bg-slate-400' : DOT[o.result] || DOT.neutral}`} /><span className="truncate">{o.label}</span></span>
                    <b className="text-title">{formatCount(o.count)}</b>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-subtitle-color">{t('no_outcomes_yet', 'No analysed calls in this period.')}</p>}
          </div>
        </div>
      )}
    </TrendCard>
  )
}

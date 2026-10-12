'use client'

import { ROUTES } from '@/constants/routes'
import { CreditStats } from '@/types/dashboard'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ApexChart } from './ApexChart'
import { CHART_COLORS, formatCount, mergeOptions, useChartTheme } from './chartTheme'
import { TrendCard } from './TrendCard'

// How many call credits the client has left, and how fast they are using them.
export function CreditsCard({ credits }: { credits: CreditStats }) {
  const { t } = useTranslation()
  const { base, isDark } = useChartTheme()
  const total = credits.total_credits || 0
  const left = Math.max(0, credits.available_credits || 0)
  const leftPercent = total ? Math.min(100, Math.round((left / total) * 100)) : 0
  const color = leftPercent <= 10 ? CHART_COLORS.rose : leftPercent <= 25 ? CHART_COLORS.amber : CHART_COLORS.violet

  const options = mergeOptions(base, {
    chart: { type: 'radialBar', sparkline: { enabled: true } },
    colors: [color],
    plotOptions: {
      radialBar: {
        startAngle: -120,
        endAngle: 120,
        hollow: { size: '68%' },
        track: { background: isDark ? 'rgba(148, 163, 184, 0.12)' : '#F1F5F9', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, offsetY: 24, fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B' },
          value: { show: true, offsetY: -14, fontSize: '26px', fontWeight: 700, color: isDark ? '#F8FAFC' : '#1D293D', formatter: () => formatCount(left) },
        },
      },
    },
    stroke: { lineCap: 'round' },
    labels: [t('credits_left', 'credits left')],
  })

  return (
    <TrendCard title={t('call_credits', 'Call credits')} subtitle={t('call_credits_desc', '1 credit is about 1 minute of AI calling.')}>
      <div className="flex h-full flex-col">
        <div className="mx-auto h-[210px] w-full max-w-[260px]">
          <ApexChart type="radialBar" options={options} series={[leftPercent]} height={210} />
        </div>
        <dl className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-input-border-color bg-input-border-color text-center">
          <div className="bg-bg-card px-2 py-2.5">
            <dt className="text-xs text-subtitle-color">{t('left', 'Left')}</dt>
            <dd className="text-sm font-semibold text-title">{leftPercent}%</dd>
          </div>
          <div className="bg-bg-card px-2 py-2.5">
            <dt className="text-xs text-subtitle-color">{t('used_this_month', 'Used this month')}</dt>
            <dd className="text-sm font-semibold text-title">{formatCount(credits.monthly_credits_used || 0)}</dd>
          </div>
          <div className="bg-bg-card px-2 py-2.5">
            <dt className="text-xs text-subtitle-color">{t('plan_total', 'Plan total')}</dt>
            <dd className="text-sm font-semibold text-title">{formatCount(total)}</dd>
          </div>
        </dl>
        {leftPercent <= 25 && (
          <Link
            href={ROUTES.BILLING}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {total ? t('top_up_credits', 'Top up credits') : t('choose_a_plan', 'Choose a plan')}
          </Link>
        )}
      </div>
    </TrendCard>
  )
}

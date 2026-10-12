'use client'

import { AdminTrends } from '@/types/dashboard'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApexChart } from './ApexChart'
import {
  CHART_COLORS,
  formatCount,
  formatPercent,
  formatRupees,
  formatRupeesCompact,
  mergeOptions,
  SHARE_COLORS,
  useChartTheme,
} from './chartTheme'
import { DeltaBadge } from './DeltaBadge'
import { EmptyChart, Headline, Segmented, TrendCard } from './TrendCard'

type View = 'revenue' | 'payments' | 'signups'

const CHART_HEIGHT = 300
const BEST_LABEL = { hour: 'Best hour', day: 'Best day', month: 'Best month' } as const

// Admin revenue: the trend over the chosen period, and which plans it came from.
export function RevenueOverview({ trends }: { trends: AdminTrends }) {
  const { t } = useTranslation()
  const { base, isDark } = useChartTheme()
  const [view, setView] = useState<View>('revenue')
  const { trend, summary, compareLabel, revenueByPlan } = trends

  const best = trend.reduce((top, point) => (point.revenue > (top?.revenue ?? 0) ? point : top), null as (typeof trend)[number] | null)
  const averagePayment = summary.payments.current ? summary.revenue.current / summary.payments.current : 0

  const views = {
    revenue: { name: t('revenue', 'Revenue'), color: CHART_COLORS.violet, key: 'revenue', money: true },
    payments: { name: t('payments', 'Payments'), color: CHART_COLORS.sky, key: 'payments', money: false },
    signups: { name: t('sign_ups', 'Sign-ups'), color: CHART_COLORS.emerald, key: 'signups', money: false },
  } as const
  const active = views[view]
  const totals = { revenue: summary.revenue, payments: summary.payments, signups: summary.signups }[view]
  const format = active.money ? formatRupees : formatCount
  const hasData = trend.some((point) => point[active.key] > 0)
  // ApexCharts can drop the series when the axis changes in place, so a new period remounts the chart.
  const chartKey = `${trends.bucket}-${trend.length}-${trend[0]?.label}`

  // Monthly revenue reads best as a line; daily and hourly revenue is mostly gaps, so it shows as bars.
  const asArea = active.money && trends.bucket === 'month'

  const options = mergeOptions(base, {
    chart: { type: asArea ? 'area' : 'bar' },
    colors: [active.color],
    stroke: asArea ? { curve: 'monotoneCubic', width: 2.5 } : { width: 0 },
    fill: asArea
      ? { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: isDark ? 0.35 : 0.3, opacityTo: 0.02, stops: [0, 95] } }
      : { opacity: 1 },
    markers: { size: 0, hover: { size: 5 } },
    plotOptions: { bar: { columnWidth: trend.length > 20 ? '65%' : '40%', borderRadius: 4, borderRadiusApplication: 'end' } },
    xaxis: { categories: trend.map((point) => point.label), tickAmount: Math.min(trend.length, 12) },
    yaxis: { labels: { formatter: active.money ? formatRupeesCompact : formatCount } },
    tooltip: {
      y: {
        formatter: (value: number, { dataPointIndex }: { dataPointIndex: number }) => {
          if (!active.money) return formatCount(value)
          const payments = trend[dataPointIndex]?.payments || 0
          return `${formatRupees(value)} · ${payments} ${payments === 1 ? t('payment', 'payment') : t('payments_lower', 'payments')}`
        },
      },
    },
  })

  const planTotal = revenueByPlan.reduce((total, plan) => total + plan.revenue, 0)
  const donutOptions = mergeOptions(base, {
    chart: { type: 'donut' },
    labels: revenueByPlan.map((plan) => plan.name),
    colors: SHARE_COLORS,
    stroke: { width: 2, colors: [isDark ? '#120724' : '#ffffff'] },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '74%',
          labels: {
            show: true,
            name: { show: true, offsetY: 22, fontSize: '12px', fontWeight: 500, color: isDark ? '#94A3B8' : '#64748B' },
            value: { show: true, offsetY: -10, fontSize: '22px', fontWeight: 700, color: isDark ? '#F8FAFC' : '#1D293D', formatter: (value: string) => formatRupeesCompact(Number(value)) },
            total: { show: true, showAlways: true, label: t('total', 'Total'), fontSize: '12px', fontWeight: 500, color: isDark ? '#94A3B8' : '#64748B', formatter: () => formatRupeesCompact(planTotal) },
          },
        },
      },
    },
    tooltip: { y: { formatter: (value: number) => formatRupees(value) } },
  })

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <TrendCard
        className="xl:col-span-2"
        title={t('revenue_overview', 'Revenue overview')}
        subtitle={t('revenue_overview_desc', 'Payments received for plans and top-ups, in the selected period.')}
        actions={
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'revenue', label: views.revenue.name },
              { value: 'payments', label: views.payments.name },
              { value: 'signups', label: views.signups.name },
            ]}
          />
        }
        headline={<Headline value={format(totals.current)} delta={<DeltaBadge {...totals} compareLabel={compareLabel} />} />}
        stats={[
          { label: t('payments_received', 'Payments received'), value: formatCount(summary.payments.current) },
          { label: t('average_payment', 'Average payment'), value: averagePayment ? formatRupees(averagePayment) : '—' },
          {
            label: t(BEST_LABEL[trends.bucket].toLowerCase().replace(' ', '_'), BEST_LABEL[trends.bucket]),
            value: best ? formatRupees(best.revenue) : '—',
            hint: best?.label,
          },
          {
            label: t('monthly_recurring_revenue', 'Monthly recurring revenue'),
            value: formatRupees(summary.mrr),
            hint: `${summary.recurringSubscribers} ${t('recurring_subscriptions', 'recurring subscriptions')}`,
          },
        ]}
      >
        {hasData ? (
          <div style={{ height: CHART_HEIGHT }}>
            <ApexChart
              key={`${view}-${chartKey}`}
              type={asArea ? 'area' : 'bar'}
              options={options}
              series={[{ name: active.name, data: trend.map((point) => point[active.key]) }]}
              height={CHART_HEIGHT}
            />
          </div>
        ) : (
          <EmptyChart message={t('no_data_in_period', 'No data in this period')} height={CHART_HEIGHT} />
        )}
      </TrendCard>

      <TrendCard
        title={t('revenue_by_plan', 'Revenue by plan')}
        subtitle={t('revenue_by_plan_desc', 'Which plans the money came from.')}
      >
        {revenueByPlan.length ? (
          <div className="flex h-full flex-col">
            <div className="h-[220px]">
              <ApexChart type="donut" options={donutOptions} series={revenueByPlan.map((plan) => plan.revenue)} height={220} />
            </div>
            <ul className="mt-4 space-y-2.5">
              {revenueByPlan.slice(0, 6).map((plan, index) => (
                <li key={plan.name} className="flex items-center gap-3 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: SHARE_COLORS[index % SHARE_COLORS.length] }} />
                  <span className="min-w-0 flex-1 truncate font-medium text-title">{plan.name}</span>
                  <span className="text-xs text-subtitle-color">{formatPercent(planTotal ? (plan.revenue / planTotal) * 100 : 0)}</span>
                  <span className="w-24 text-right font-semibold text-title">{formatRupees(plan.revenue)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyChart message={t('no_payments_in_period', 'No payments in this period')} height={220} />
        )}
      </TrendCard>
    </div>
  )
}

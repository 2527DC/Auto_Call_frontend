'use client'

import { PeriodValue } from '@/types/dashboard'
import { useTranslation } from 'react-i18next'
import { ApexChart } from './ApexChart'
import { CHART_COLORS, formatCount, formatMinutes, formatPercent, mergeOptions, useChartTheme } from './chartTheme'
import { DeltaBadge } from './DeltaBadge'
import { EmptyChart, Headline, TrendCard } from './TrendCard'

interface CallPoint {
  label: string
  inbound: number
  outbound: number
  answered: number
  minutes: number
}

interface CallActivityCardProps {
  title: string
  subtitle: string
  trend: CallPoint[]
  summary: { calls: PeriodValue; minutes: PeriodValue; answered: PeriodValue }
  compareLabel: string
  className?: string
}

const CHART_HEIGHT = 280

const formatDuration = (minutes: number) => {
  const seconds = Math.round(minutes * 60)
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
}

// Inbound and outbound calls per day or month, with answer rate and talk time.
export function CallActivityCard({ title, subtitle, trend, summary, compareLabel, className }: CallActivityCardProps) {
  const { t } = useTranslation()
  const { base } = useChartTheme()
  const { calls, minutes, answered } = summary
  const inbound = trend.reduce((total, point) => total + point.inbound, 0)
  const answerRate = calls.current ? (answered.current / calls.current) * 100 : 0

  const options = mergeOptions(base, {
    chart: { type: 'bar', stacked: true },
    colors: [CHART_COLORS.emerald, CHART_COLORS.violet],
    plotOptions: {
      bar: {
        columnWidth: trend.length > 20 ? '70%' : '45%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },
    xaxis: { categories: trend.map((point) => point.label), tickAmount: Math.min(trend.length, 12) },
    yaxis: { labels: { formatter: (value: number) => formatCount(value) } },
    tooltip: { y: { formatter: (value: number) => `${formatCount(value)} ${t('calls', 'calls')}` } },
  })

  const series = [
    { name: t('inbound', 'Inbound'), data: trend.map((point) => point.inbound) },
    { name: t('outbound', 'Outbound'), data: trend.map((point) => point.outbound) },
  ]

  return (
    <TrendCard
      className={className}
      title={title}
      subtitle={subtitle}
      headline={<Headline value={formatCount(calls.current)} delta={<DeltaBadge {...calls} compareLabel={compareLabel} />} />}
      legend={[
        { label: t('inbound', 'Inbound'), color: CHART_COLORS.emerald },
        { label: t('outbound', 'Outbound'), color: CHART_COLORS.violet },
      ]}
      stats={[
        { label: t('answered', 'Answered'), value: formatCount(answered.current), hint: `${formatPercent(answerRate)} ${t('of_calls', 'of calls')}` },
        { label: t('talk_time', 'Talk time'), value: formatMinutes(minutes.current), hint: <DeltaBadge {...minutes} /> },
        { label: t('avg_call', 'Average call'), value: answered.current ? formatDuration(minutes.current / answered.current) : '—' },
        {
          label: t('inbound_outbound', 'Inbound / outbound'),
          value: calls.current ? `${Math.round((inbound / calls.current) * 100)}% / ${100 - Math.round((inbound / calls.current) * 100)}%` : '—',
        },
      ]}
    >
      {calls.current ? (
        <div style={{ height: CHART_HEIGHT }}>
          <ApexChart key={`${trend.length}-${trend[0]?.label}`} type="bar" options={options} series={series} height={CHART_HEIGHT} />
        </div>
      ) : (
        <EmptyChart message={t('no_calls_in_period', 'No calls in this period')} height={CHART_HEIGHT} />
      )}
    </TrendCard>
  )
}

'use client'

import { UserTrends } from '@/types/dashboard'
import { useTranslation } from 'react-i18next'
import { ApexChart } from './ApexChart'
import { CHART_COLORS, formatCount, mergeOptions, useChartTheme } from './chartTheme'
import { EmptyChart, Headline, TrendCard } from './TrendCard'

const CHART_HEIGHT = 260

// Voice and SMS campaigns started per day or month.
export function CampaignActivityCard({ trends, className }: { trends: UserTrends; className?: string }) {
  const { t } = useTranslation()
  const { base } = useChartTheme()
  const { trend } = trends
  const ai = trend.reduce((total, point) => total + point.aiCampaigns, 0)
  const sms = trend.reduce((total, point) => total + point.smsCampaigns, 0)

  const options = mergeOptions(base, {
    chart: { type: 'bar', stacked: true },
    colors: [CHART_COLORS.violet, CHART_COLORS.amber],
    plotOptions: {
      bar: { columnWidth: trend.length > 20 ? '70%' : '45%', borderRadius: 4, borderRadiusApplication: 'end', borderRadiusWhenStacked: 'last' },
    },
    xaxis: { categories: trend.map((point) => point.label), tickAmount: Math.min(trend.length, 12) },
    yaxis: { labels: { formatter: (value: number) => formatCount(value) } },
  })

  return (
    <TrendCard
      className={className}
      title={t('campaign_activity', 'Campaign activity')}
      subtitle={t('campaign_activity_desc', 'Voice and SMS campaigns started in the selected period.')}
      headline={<Headline value={formatCount(ai + sms)} />}
      legend={[
        { label: `${t('voice_campaigns', 'Voice campaigns')} · ${formatCount(ai)}`, color: CHART_COLORS.violet },
        { label: `${t('sms_campaigns', 'SMS campaigns')} · ${formatCount(sms)}`, color: CHART_COLORS.amber },
      ]}
    >
      {ai + sms ? (
        <div style={{ height: CHART_HEIGHT }}>
          <ApexChart
            key={`${trend.length}-${trend[0]?.label}`}
            type="bar"
            options={options}
            series={[
              { name: t('voice_campaigns', 'Voice campaigns'), data: trend.map((point) => point.aiCampaigns) },
              { name: t('sms_campaigns', 'SMS campaigns'), data: trend.map((point) => point.smsCampaigns) },
            ]}
            height={CHART_HEIGHT}
          />
        </div>
      ) : (
        <EmptyChart message={t('no_campaigns_in_period', 'No campaigns in this period')} height={CHART_HEIGHT} />
      )}
    </TrendCard>
  )
}

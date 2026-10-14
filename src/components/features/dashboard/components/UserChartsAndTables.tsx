'use client'

import { UserChartsAndTablesProps } from '@/types/dashboard'
import { CallActivityCard, CampaignActivityCard, CreditsCard, OutcomesCard } from '../charts'
import { RecentActivityCard } from './RecentActivityCard'
import { RecentCampaignsCard } from './RecentCampaignsCard'
import { RecentContactsCard } from './RecentContactsCard'
import { RecentSmsCampaignsCard } from './RecentSmsCampaignsCard'
import { RecentTeamMembersCard } from './RecentTeamMembersCard'

export function UserChartsAndTables({ stats, cardVariants, t }: UserChartsAndTablesProps) {
  const { trends, credits, outcomes } = stats

  return (
    <div className="space-y-8">
      {/* Call activity and credits left */}
      {trends && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <CallActivityCard
            className={credits ? 'xl:col-span-2' : 'xl:col-span-3'}
            title={t('call_activity', 'Call activity')}
            subtitle={t('call_activity_desc', 'Calls your agents made and received in the selected period.')}
            trend={trends.trend}
            summary={trends.summary}
            compareLabel={trends.compareLabel}
          />
          {credits && <CreditsCard credits={credits} />}
        </div>
      )}

      {/* What the calls led to, and follow-ups waiting */}
      {outcomes && <OutcomesCard outcomes={outcomes} />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <RecentCampaignsCard stats={stats} cardVariants={cardVariants} t={t} />
        <RecentSmsCampaignsCard stats={stats} cardVariants={cardVariants} t={t} />
      </div>

      {/* Campaigns started and recent contacts */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-3">
        {trends && <CampaignActivityCard className="xl:col-span-2" trends={trends} />}
        <RecentContactsCard stats={stats} cardVariants={cardVariants} t={t} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <RecentTeamMembersCard stats={stats} cardVariants={cardVariants} t={t} />
        <RecentActivityCard stats={stats} cardVariants={cardVariants} t={t} />
      </div>
    </div>
  )
}

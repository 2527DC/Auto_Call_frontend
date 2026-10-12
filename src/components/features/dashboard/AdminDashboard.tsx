'use client'

import { AdminDashboardProps } from '@/types/dashboard'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CallActivityCard, RevenueOverview } from './charts'
import { AdminAdditionalCounters, AdminLowerSection, RecentCallsCard, RecentRegistrationsCard, WelcomeAndCounters, WorkflowsAndCampaigns } from './components'

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const { t } = useTranslation()
  const { statistics, tables, trends } = stats

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 animate-in fade-in duration-700"
    >
      {/* Row 1: Welcome card and the period's headline figures */}
      <WelcomeAndCounters statistics={statistics} trends={trends} />

      {/* Row 2: Revenue trend and revenue by plan */}
      {trends && <RevenueOverview trends={trends} />}

      {/* Row 3: Platform call activity and new sign-ups */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {trends && (
          <CallActivityCard
            className="xl:col-span-2"
            title={t('platform_call_activity', 'Platform call activity')}
            subtitle={t('platform_call_activity_desc', 'Calls made and received by all clients.')}
            trend={trends.trend}
            summary={trends.summary}
            compareLabel={trends.compareLabel}
          />
        )}
        <RecentRegistrationsCard recentRegisteredUsers={tables.recentRegisteredUsers} cardVariants={cardVariants} />
      </div>

      {/* Row 4: The admin's own workspace */}
      <AdminAdditionalCounters statistics={statistics} />

      {/* Row 5: System workflows and recent campaigns */}
      <WorkflowsAndCampaigns
        systemFlow={tables.systemFlow}
        recentCampaigns={tables.recentCampaigns}
        cardVariants={cardVariants}
      />

      {/* Row 6: Recent contacts, agent split, recent SMS campaigns */}
      <AdminLowerSection
        recentContacts={tables.recentContactOfCurrentUser}
        recentSmsCampaigns={tables.recentSmsCampaignsOfCurrentUser}
        agentCounts={{ agents: statistics.totalAgentOfCurrentUser || 0, smsAgents: statistics.totalSmsAgentOfCurrentUser || 0 }}
        cardVariants={cardVariants}
      />

      {/* Row 7: Recent calls */}
      <RecentCallsCard recentCallsOfCurrentUser={tables.recentCallsOfCurrentUser} cardVariants={cardVariants} />
    </motion.div>
  )
}

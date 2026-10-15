'use client'

import AiInsightsDashboard from '@/components/features/ai-insights/AiInsightsDashboard'
import { useAppSelector } from '@/redux/hooks'
import { useTranslation } from 'react-i18next'

const AiInsightsPage = () => {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  return isAdmin ? (
    <AiInsightsDashboard />
  ) : (
    <div className="p-8 text-center text-zinc-500 font-medium">
      {t('access_restricted', 'Access restricted to administrators.')}
    </div>
  )
}

export default AiInsightsPage

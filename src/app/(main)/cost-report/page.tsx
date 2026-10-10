'use client'

import UsageReportPage from '@/components/features/usage-report/UsageReportPage'
import { useAppSelector } from '@/redux/hooks'
import { useTranslation } from 'react-i18next'

const CostReportPage = () => {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  return isAdmin ? <UsageReportPage /> : <div className="p-8 text-center text-zinc-500">{t('access_restricted')}</div>
}

export default CostReportPage

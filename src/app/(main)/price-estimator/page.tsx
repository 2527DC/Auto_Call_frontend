'use client'

import PriceEstimatorPage from '@/components/features/price-estimator/PriceEstimatorPage'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import { useTranslation } from 'react-i18next'

const PriceEstimatorRoute = () => {
  const { t } = useTranslation()
  const { hasPermission, role } = usePermission()
  const allowed = role === 'super_admin' || hasPermission(PERMISSIONS.VIEW_PRICE_ESTIMATOR)

  return allowed ? <PriceEstimatorPage /> : <div className="p-8 text-center text-zinc-500">{t('access_restricted')}</div>
}

export default PriceEstimatorRoute

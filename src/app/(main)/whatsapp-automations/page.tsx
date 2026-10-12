'use client'

import AutomationsPage from '@/components/features/whatsapp-automations/AutomationsPage'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'

const WhatsappAutomationsRoute = () => {
  const { t } = useTranslation()
  const { hasPermission, hasBeta, role } = usePermission()
  const allowed = hasBeta('whatsapp') && (role === 'super_admin' || hasPermission(PERMISSIONS.VIEW_WHATSAPP_AUTOMATION))

  if (!allowed) return <div className="p-8 text-center text-zinc-500">{t('access_restricted')}</div>
  return (
    <Suspense fallback={null}>
      <AutomationsPage />
    </Suspense>
  )
}

export default WhatsappAutomationsRoute

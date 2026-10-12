'use client'

import WhatsappInboxPage from '@/components/features/whatsapp-inbox/WhatsappInboxPage'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import { useTranslation } from 'react-i18next'

const WhatsappInboxRoute = () => {
  const { t } = useTranslation()
  const { hasPermission, hasBeta } = usePermission()
  const allowed = hasBeta('whatsapp') && hasPermission(PERMISSIONS.VIEW_WHATSAPP_INBOX)

  return allowed ? <WhatsappInboxPage /> : <div className="p-8 text-center text-zinc-500">{t('access_restricted')}</div>
}

export default WhatsappInboxRoute

'use client'

import FlowBuilder from '@/components/features/whatsapp-automations/FlowBuilder'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import { use, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

const WhatsappAutomationBuilderRoute = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params)
  const { t } = useTranslation()
  const { hasPermission, hasBeta, role } = usePermission()
  const allowed = hasBeta('whatsapp') && (role === 'super_admin' || hasPermission(PERMISSIONS.VIEW_WHATSAPP_AUTOMATION))

  if (!allowed) return <div className="p-8 text-center text-zinc-500">{t('access_restricted')}</div>
  return (
    <Suspense fallback={null}>
      <FlowBuilder id={id} />
    </Suspense>
  )
}

export default WhatsappAutomationBuilderRoute

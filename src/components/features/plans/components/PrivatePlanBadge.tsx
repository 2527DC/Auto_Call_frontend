'use client'

import { Plan } from '@/types/plans'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Marks a plan that is offered only to specific clients.
const PrivatePlanBadge = ({ plan, admin = false }: { plan: Partial<Plan>; admin?: boolean }) => {
  const { t } = useTranslation()
  if (plan.visibility !== 'private') return null

  return (
    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
      <Lock className="w-3 h-3" />
      {admin
        ? t('private_plan_badge', { defaultValue: 'Private · {{count}} client(s)', count: plan.allowed_user_ids?.length || 0 })
        : t('custom_plan_badge', 'Custom plan for you')}
    </span>
  )
}

export default PrivatePlanBadge

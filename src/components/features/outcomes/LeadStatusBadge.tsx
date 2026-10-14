'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LeadStatusDefinition, LeadStatusKind } from '@/types/outcomes'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const KIND_TONE: Record<LeadStatusKind, string> = {
  open: 'bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400',
  won: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
  lost: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-zinc-300 dark:border-white/15',
  closed: 'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400',
}

interface LeadStatusBadgeProps {
  status?: string | null
  label?: string
  statuses?: LeadStatusDefinition[]
  locked?: boolean
  className?: string
}

// A person's lead status, coloured by its kind (open, won, lost, closed). A lock
// means a person set it and later calls only suggest.
export function LeadStatusBadge({ status, label, statuses = [], locked, className }: LeadStatusBadgeProps) {
  const { t } = useTranslation()
  const key = status || 'new'
  const def = statuses.find((s) => s.key === key)
  const tone = KIND_TONE[def?.kind || (key === 'converted' ? 'won' : key === 'do_not_call' ? 'closed' : 'open')]
  return (
    <Badge variant="outline" className={cn('font-semibold px-2.5 py-0.5 gap-1', tone, className)} title={locked ? t('status_locked_hint', "Set by a person: later calls won't change it") : undefined}>
      {locked && <Lock className="h-3 w-3 shrink-0" aria-label={t('set_by_a_person', 'Set by a person')} />}
      <span className="truncate">{label || def?.label || key}</span>
    </Badge>
  )
}

export default LeadStatusBadge

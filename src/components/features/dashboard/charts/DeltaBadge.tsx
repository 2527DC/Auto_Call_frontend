'use client'

import { cn } from '@/lib/utils'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface DeltaBadgeProps {
  current: number
  previous: number
  compareLabel?: string
  className?: string
}

// Change against the previous period, e.g. "▲ 12% vs last month".
export function DeltaBadge({ current, previous, compareLabel, className }: DeltaBadgeProps) {
  const { t } = useTranslation()
  let tone = 'bg-slate-500/10 text-subtitle-color'
  let Icon = Minus
  let text = '0%'

  if (previous > 0) {
    const change = ((current - previous) / previous) * 100
    const rounded = Math.abs(change) >= 10 ? Math.round(Math.abs(change)) : Math.round(Math.abs(change) * 10) / 10
    if (change > 0) {
      tone = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      Icon = TrendingUp
      text = `${rounded}%`
    } else if (change < 0) {
      tone = 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
      Icon = TrendingDown
      text = `${rounded}%`
    }
  } else if (current > 0) {
    tone = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    Icon = TrendingUp
    text = t('new', 'New')
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-subtitle-color', className)}>
      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', tone)}>
        <Icon className="h-3 w-3" />
        {text}
      </span>
      {compareLabel && <span className="truncate">{t(compareLabel.replace(/ /g, '_'), compareLabel)}</span>}
    </span>
  )
}

'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import React from 'react'

interface AiInsightsStatCardProps {
  title: string
  value: string | number
  subValue?: React.ReactNode
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  badgeText?: string
  badgeColor?: string
}

export const AiInsightsStatCard: React.FC<AiInsightsStatCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  badgeText,
  badgeColor = 'bg-primary/10 text-primary border-primary/20',
}) => {
  return (
    <Card className="p-4 sm:p-5 rounded-radius border border-input-border-color bg-bg-card hover:border-primary/30 transition-all duration-300 shadow-xs relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-subtitle-color">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-title tracking-tight mt-1">
            {value}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={cn('p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs', iconBg, iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          {badgeText && (
            <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', badgeColor)}>
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {subValue && (
        <div className="mt-3 pt-3 border-t border-input-border-color/60 text-xs text-subtitle-color font-medium">
          {subValue}
        </div>
      )}
    </Card>
  )
}

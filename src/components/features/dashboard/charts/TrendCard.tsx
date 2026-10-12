'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export interface TrendStat {
  label: string
  value: ReactNode
  hint?: ReactNode
}

export interface LegendItem {
  label: string
  color: string
}

interface TrendCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  headline?: ReactNode
  legend?: LegendItem[]
  stats?: TrendStat[]
  children: ReactNode
  className?: string
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// Card for one chart: title, headline number, legend, the chart, and a row of summary figures.
export function TrendCard({ title, subtitle, actions, headline, legend, stats, children, className }: TrendCardProps) {
  return (
    <motion.section
      variants={cardVariants}
      className={cn('flex h-full flex-col rounded-radius border border-input-border-color bg-bg-card p-4 sm:p-6', className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-title">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-subtitle-color">{subtitle}</p>}
        </div>
        {actions}
      </header>

      {(headline || legend?.length) && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">{headline}</div>
          {!!legend?.length && (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {legend.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-subtitle-color">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="relative mt-4 min-h-0 flex-1">{children}</div>

      {!!stats?.length && (
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-input-border-color bg-input-border-color sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 bg-bg-card px-3 py-2.5">
              <dt className="truncate text-xs font-medium text-subtitle-color">{stat.label}</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-title">{stat.value}</dd>
              {stat.hint && <dd className="truncate text-xs text-subtitle-color">{stat.hint}</dd>}
            </div>
          ))}
        </dl>
      )}
    </motion.section>
  )
}

// A big number with its change against the previous period.
export function Headline({ value, delta }: { value: ReactNode; delta?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-2xl font-bold tracking-tight text-title sm:text-3xl">{value}</span>
      {delta}
    </div>
  )
}

// Shown in place of a chart when the period has no data.
export function EmptyChart({ message, height }: { message: string; height: number }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-input-border-color text-sm text-subtitle-color" style={{ height }}>
      {message}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}

// Small switch between views of the same chart.
export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="tablist" className="inline-flex rounded-lg border border-input-border-color bg-subcard p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
            value === option.value ? 'bg-bg-card text-title shadow-sm' : 'text-subtitle-color hover:text-title',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

'use client'

import { CURRENCY_SYMBOL } from '@/lib/currency'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'

export const CHART_COLORS = {
  violet: '#7C3AED',
  emerald: '#10B981',
  sky: '#0EA5E9',
  amber: '#F59E0B',
  rose: '#F43F5E',
  indigo: '#6366F1',
  teal: '#14B8A6',
  slate: '#94A3B8',
}

// Colours for "share of" charts such as revenue by plan.
export const SHARE_COLORS = [CHART_COLORS.violet, CHART_COLORS.sky, CHART_COLORS.emerald, CHART_COLORS.amber, CHART_COLORS.rose, CHART_COLORS.teal]

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
const whole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 })

// Indian number formats: ₹1,23,456 in full, ₹1.2L on chart axes.
export const formatRupees = (n: number) => `${CURRENCY_SYMBOL}${whole.format(n || 0)}`
export const formatRupeesCompact = (n: number) => `${CURRENCY_SYMBOL}${compact.format(n || 0)}`
export const formatCount = (n: number) => whole.format(n || 0)
export const formatCountCompact = (n: number) => compact.format(n || 0)
export const formatMinutes = (n: number) => `${oneDecimal.format(n || 0)} min`
export const formatPercent = (n: number) => `${oneDecimal.format(n || 0)}%`

type PlainObject = Record<string, any>
const isPlainObject = (v: unknown): v is PlainObject => !!v && typeof v === 'object' && !Array.isArray(v) && typeof v !== 'function'

// Deep-merges chart options; arrays and functions are replaced, not merged.
export const mergeOptions = (base: PlainObject, overrides: PlainObject): PlainObject => {
  const out: PlainObject = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    out[key] = isPlainObject(value) && isPlainObject(base[key]) ? mergeOptions(base[key], value) : value
  }
  return out
}

// Shared look for every dashboard chart, in light and dark mode.
export function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return useMemo(() => {
    const axisColor = isDark ? '#94A3B8' : '#64748B'
    const labelStyle = { colors: axisColor, fontSize: '11px', fontWeight: 500, fontFamily: 'inherit' }
    const base = {
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent',
        fontFamily: 'inherit',
        parentHeightOffset: 0,
        animations: { enabled: true, speed: 450, animateGradually: { enabled: false } },
      },
      theme: { mode: isDark ? 'dark' : 'light' },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        borderColor: isDark ? 'rgba(148, 163, 184, 0.10)' : 'rgba(100, 116, 139, 0.14)',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        padding: { left: 4, right: 18, top: -8, bottom: 0 },
      },
      xaxis: {
        labels: { style: labelStyle, hideOverlappingLabels: true, rotate: 0, trim: true },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
        crosshairs: { stroke: { color: axisColor, dashArray: 3 } },
      },
      yaxis: { labels: { style: labelStyle, formatter: formatCountCompact }, forceNiceScale: true, min: 0 },
      tooltip: { theme: isDark ? 'dark' : 'light', shared: true, intersect: false },
      states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
    }
    return { isDark, axisColor, base }
  }, [isDark])
}

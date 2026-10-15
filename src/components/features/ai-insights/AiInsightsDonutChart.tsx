'use client'

import { ApexChart } from '@/components/features/dashboard/charts/ApexChart'
import { mergeOptions, SHARE_COLORS, useChartTheme } from '@/components/features/dashboard/charts/chartTheme'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon, PieChart } from 'lucide-react'
import React, { useMemo } from 'react'

export interface DonutDataItem {
  label: string
  value: number
  subText?: string
  percentage?: number
}

interface AiInsightsDonutChartProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  data: DonutDataItem[]
  valueFormatter?: (val: number) => string
  totalLabel?: string
  totalFormatter?: (total: number) => string
}

export const AiInsightsDonutChart: React.FC<AiInsightsDonutChartProps> = ({
  title,
  subtitle,
  icon: Icon = PieChart,
  data,
  valueFormatter = (v) => v.toLocaleString(),
  totalLabel = 'Total',
  totalFormatter,
}) => {
  const { base, isDark } = useChartTheme()

  const labels = useMemo(() => data.map((d) => d.label), [data])
  const series = useMemo(() => data.map((d) => d.value), [data])
  const total = useMemo(() => series.reduce((a, b) => a + b, 0), [series])

  const chartOptions = useMemo(() => {
    return mergeOptions(base, {
      chart: {
        type: 'donut',
        animations: { enabled: true, speed: 450 },
      },
      labels,
      colors: SHARE_COLORS,
      stroke: {
        width: 2,
        colors: [isDark ? '#120724' : '#ffffff'],
      },
      legend: {
        show: false,
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: {
                show: true,
                offsetY: 20,
                fontSize: '12px',
                fontWeight: 500,
                color: isDark ? '#94A3B8' : '#64748B',
              },
              value: {
                show: true,
                offsetY: -10,
                fontSize: '20px',
                fontWeight: 700,
                color: isDark ? '#F8FAFC' : '#1D293D',
                formatter: (val: string) => valueFormatter(Number(val) || 0),
              },
              total: {
                show: true,
                showAlways: true,
                label: totalLabel,
                fontSize: '12px',
                fontWeight: 500,
                color: isDark ? '#94A3B8' : '#64748B',
                formatter: () => (totalFormatter ? totalFormatter(total) : valueFormatter(total)),
              },
            },
          },
        },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: (val: number) => {
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
            return `${valueFormatter(val)} (${pct}%)`
          },
        },
      },
    })
  }, [base, isDark, labels, total, valueFormatter, totalLabel, totalFormatter])

  const hasData = total > 0

  return (
    <Card className="p-4 sm:p-6 rounded-radius border border-input-border-color bg-bg-card flex flex-col h-full shadow-xs">
      <div className="flex items-center justify-between border-b border-input-border-color pb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base font-bold text-title tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-subtitle-color mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-center min-h-[220px]">
        {!hasData ? (
          <div className="text-xs text-subtitle-color/60 font-semibold uppercase tracking-wider">
            No data to display
          </div>
        ) : (
          <ApexChart
            options={chartOptions}
            series={series}
            type="donut"
            height={220}
            width="100%"
          />
        )}
      </div>

      {hasData && (
        <div className="mt-4 pt-3 border-t border-input-border-color space-y-2">
          {data.map((item, idx) => {
            const color = SHARE_COLORS[idx % SHARE_COLORS.length]
            const pct = item.percentage ?? (total > 0 ? Math.round((item.value / total) * 100) : 0)
            return (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-medium text-title truncate">{item.label}</span>
                  {item.subText && <span className="text-subtitle-color text-[11px] truncate">({item.subText})</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-subtitle-color font-semibold">{pct}%</span>
                  <span className="font-bold text-title">{valueFormatter(item.value)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

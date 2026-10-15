'use client'

import { ApexChart } from '@/components/features/dashboard/charts/ApexChart'
import { CHART_COLORS, mergeOptions, useChartTheme } from '@/components/features/dashboard/charts/chartTheme'
import { Card } from '@/components/ui/card'
import { formatMoney } from '@/lib/currency'
import { AiInsightTimeline } from '@/types/aiInsights'
import { format } from 'date-fns'
import { Activity } from 'lucide-react'
import React, { useMemo } from 'react'

interface AiInsightsTrajectoryChartProps {
  timeline: AiInsightTimeline[]
  totalCost: number
  totalTokens: number
}

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format

export const AiInsightsTrajectoryChart: React.FC<AiInsightsTrajectoryChartProps> = ({
  timeline,
  totalCost,
  totalTokens,
}) => {
  const { base, isDark } = useChartTheme()

  const { categories, inputSeries, outputSeries, costSeries } = useMemo(() => {
    const sorted = [...timeline].sort((a, b) => a.date.localeCompare(b.date))
    const categories = sorted.map((item) => {
      try {
        return format(new Date(item.date), 'MMM dd')
      } catch {
        return item.date
      }
    })
    const inputSeries = sorted.map((item) => item.input_tokens || 0)
    const outputSeries = sorted.map((item) => item.output_tokens || 0)
    const costSeries = sorted.map((item) => Number(item.cost.toFixed(2)) || 0)

    return { categories, inputSeries, outputSeries, costSeries }
  }, [timeline])

  const series = useMemo(() => [
    {
      name: 'Prompt Tokens (Input)',
      type: 'area',
      data: inputSeries,
    },
    {
      name: 'Completion Tokens (Output)',
      type: 'area',
      data: outputSeries,
    },
    {
      name: 'AI Spend (₹)',
      type: 'line',
      data: costSeries,
    },
  ], [inputSeries, outputSeries, costSeries])

  const chartOptions = useMemo(() => {
    return mergeOptions(base, {
      chart: {
        type: 'line',
        stacked: false,
        toolbar: { show: false },
        animations: { enabled: true, speed: 500 },
      },
      colors: [CHART_COLORS.indigo, CHART_COLORS.teal, CHART_COLORS.amber],
      stroke: {
        curve: 'smooth',
        width: [2, 2, 3],
        dashArray: [0, 0, 4],
      },
      fill: {
        type: ['gradient', 'gradient', 'solid'],
        gradient: {
          shade: isDark ? 'dark' : 'light',
          type: 'vertical',
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      xaxis: {
        categories,
        labels: {
          style: {
            colors: isDark ? '#94A3B8' : '#64748B',
            fontSize: '11px',
            fontFamily: 'inherit',
          },
        },
      },
      yaxis: [
        {
          seriesName: 'Prompt Tokens (Input)',
          title: {
            text: 'Tokens',
            style: {
              color: isDark ? '#94A3B8' : '#64748B',
              fontSize: '11px',
              fontWeight: 500,
            },
          },
          labels: {
            formatter: (val: number) => compact(val),
            style: {
              colors: isDark ? '#94A3B8' : '#64748B',
              fontSize: '11px',
            },
          },
        },
        {
          show: false,
          seriesName: 'Completion Tokens (Output)',
        },
        {
          opposite: true,
          seriesName: 'AI Spend (₹)',
          title: {
            text: 'Cost (₹)',
            style: {
              color: CHART_COLORS.amber,
              fontSize: '11px',
              fontWeight: 500,
            },
          },
          labels: {
            formatter: (val: number) => `₹${val.toFixed(2)}`,
            style: {
              colors: CHART_COLORS.amber,
              fontSize: '11px',
            },
          },
        },
      ],
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
        labels: {
          colors: isDark ? '#CBD5E1' : '#475569',
        },
        markers: {
          width: 8,
          height: 8,
          radius: 12,
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: (val: number, opts: any) => {
            if (opts.seriesIndex === 2) {
              return formatMoney(val)
            }
            return `${val.toLocaleString()} tokens`
          },
        },
      },
    })
  }, [base, isDark, categories])

  const hasData = inputSeries.some((v) => v > 0) || outputSeries.some((v) => v > 0) || costSeries.some((v) => v > 0)

  return (
    <Card className="p-4 sm:p-6 rounded-radius border border-input-border-color bg-bg-card flex flex-col h-full shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-input-border-color pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base sm:text-lg font-bold text-title tracking-tight">
              Daily Token & Cost Trajectory
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-subtitle-color mt-0.5">
            Prompt (input) vs Completion (output) token volumes with daily spend in rupees
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-subtitle-color">Total Tokens:</span>
            <span className="font-bold text-title">{compact(totalTokens)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-subtitle-color">Total Spend:</span>
            <span className="font-bold text-title">{formatMoney(totalCost)}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 w-full h-[320px] sm:h-[360px]">
        {!hasData ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-subtitle-color/60 font-semibold uppercase tracking-wider">
            No token activity recorded in this date range
          </div>
        ) : (
          <ApexChart
            options={chartOptions}
            series={series}
            type="line"
            height="100%"
            width="100%"
          />
        )}
      </div>
    </Card>
  )
}

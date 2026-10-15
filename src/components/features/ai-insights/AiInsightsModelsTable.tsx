'use client'

import { DataTable } from '@/components/reusable/DataTable'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/currency'
import { AiInsightModel } from '@/types/aiInsights'
import { Column } from '@/types/table'
import { Cpu } from 'lucide-react'
import React from 'react'

interface AiInsightsModelsTableProps {
  models: AiInsightModel[]
  isLoading?: boolean
}

export const AiInsightsModelsTable: React.FC<AiInsightsModelsTableProps> = ({
  models,
  isLoading = false,
}) => {
  const columns: Column<AiInsightModel>[] = [
    {
      header: 'AI Model',
      className: 'min-w-[180px]',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-title">{row.model_id}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className="text-[10px] uppercase font-semibold text-subtitle-color px-1.5 py-0">
                {row.provider}
              </Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Calls Processed',
      className: 'min-w-[120px]',
      cell: (row) => (
        <span className="font-semibold text-title">
          {row.calls_count.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Prompt (Input)',
      className: 'min-w-[130px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-title">{row.input_tokens.toLocaleString()}</span>
          <span className="text-[11px] text-subtitle-color">tokens</span>
        </div>
      ),
    },
    {
      header: 'Completion (Output)',
      className: 'min-w-[140px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-title">{row.output_tokens.toLocaleString()}</span>
          <span className="text-[11px] text-subtitle-color">tokens</span>
        </div>
      ),
    },
    {
      header: 'Total Tokens',
      className: 'min-w-[140px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-title">{row.total_tokens.toLocaleString()}</span>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={row.tokens_percentage} className="h-1.5 w-16" />
            <span className="text-[11px] font-semibold text-primary">{row.tokens_percentage}%</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Est. LLM Cost',
      className: 'min-w-[120px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-amber-500">{formatMoney(row.cost)}</span>
          <span className="text-[11px] text-subtitle-color">{row.cost_percentage}% of LLM cost</span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={models}
        isLoading={isLoading}
        emptyMessage="No AI models have recorded usage in this window."
      />
    </div>
  )
}

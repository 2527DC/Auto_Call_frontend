'use client'

import { DataTable } from '@/components/reusable/DataTable'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/currency'
import { AiInsightClient } from '@/types/aiInsights'
import { Column } from '@/types/table'
import { User } from 'lucide-react'
import React, { useMemo, useState } from 'react'

interface AiInsightsClientsTableProps {
  clients: AiInsightClient[]
  isLoading?: boolean
}

export const AiInsightsClientsTable: React.FC<AiInsightsClientsTableProps> = ({
  clients,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('')

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    )
  }, [clients, search])

  const columns: Column<AiInsightClient>[] = [
    {
      header: 'Client / Account',
      className: 'min-w-[200px]',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-title truncate">{row.name}</span>
            <span className="text-xs text-subtitle-color truncate">{row.email || 'No email'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Calls',
      className: 'min-w-[90px]',
      cell: (row) => (
        <span className="font-semibold text-title">
          {row.calls_count.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Token Consumption',
      className: 'min-w-[170px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-title">{row.total_tokens.toLocaleString()}</span>
          <span className="text-[11px] text-subtitle-color">
            {row.input_tokens.toLocaleString()} in · {row.output_tokens.toLocaleString()} out
          </span>
        </div>
      ),
    },
    {
      header: 'Voice Processing',
      className: 'min-w-[160px]',
      cell: (row) => (
        <div className="flex flex-col text-xs text-subtitle-color">
          <span>{row.stt_minutes} min audio (STT)</span>
          <span>{row.tts_characters.toLocaleString()} chars (TTS)</span>
        </div>
      ),
    },
    {
      header: 'AI Cost (INR)',
      className: 'min-w-[130px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-amber-500">{formatMoney(row.cost)}</span>
          <span className="text-[11px] text-subtitle-color">{row.cost_percentage}% of AI spend</span>
        </div>
      ),
    },
    {
      header: 'System Token Share',
      className: 'min-w-[160px]',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Progress value={row.tokens_percentage} className="h-2 flex-1" />
          <Badge variant="outline" className="text-xs font-bold text-primary shrink-0">
            {row.tokens_percentage}%
          </Badge>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filteredClients}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search client by name or email..."
        emptyMessage="No clients have used AI tokens in this date range."
      />
    </div>
  )
}

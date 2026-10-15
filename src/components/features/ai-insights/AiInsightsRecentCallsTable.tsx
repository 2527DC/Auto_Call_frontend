'use client'

import { DataTable } from '@/components/reusable/DataTable'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/currency'
import { AiInsightRecentCall } from '@/types/aiInsights'
import { Column } from '@/types/table'
import { format } from 'date-fns'
import { PhoneCall } from 'lucide-react'
import React, { useMemo, useState } from 'react'

interface AiInsightsRecentCallsTableProps {
  recentCalls: AiInsightRecentCall[]
  isLoading?: boolean
}

export const AiInsightsRecentCallsTable: React.FC<AiInsightsRecentCallsTableProps> = ({
  recentCalls,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('')

  const filteredCalls = useMemo(() => {
    if (!search.trim()) return recentCalls
    const q = search.toLowerCase()
    return recentCalls.filter(
      (c) =>
        c.user?.name?.toLowerCase().includes(q) ||
        c.agent?.name?.toLowerCase().includes(q) ||
        c.model?.toLowerCase().includes(q) ||
        c.provider?.toLowerCase().includes(q)
    )
  }, [recentCalls, search])

  const columns: Column<AiInsightRecentCall>[] = [
    {
      header: 'Call Details',
      className: 'min-w-[190px]',
      cell: (row) => {
        let dateStr = ''
        try {
          dateStr = row.created_at ? format(new Date(row.created_at), 'MMM dd, yyyy · HH:mm') : '—'
        } catch {
          dateStr = row.created_at || '—'
        }
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-title truncate">{row.agent?.name || 'Direct Call'}</span>
              <span className="text-xs text-subtitle-color truncate">{dateStr}</span>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Client',
      className: 'min-w-[160px]',
      cell: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-title truncate">{row.user?.name || 'Unknown'}</span>
          <span className="text-xs text-subtitle-color truncate">{row.user?.email}</span>
        </div>
      ),
    },
    {
      header: 'Duration',
      className: 'min-w-[90px]',
      cell: (row) => (
        <span className="font-medium text-title">
          {Math.floor(row.duration / 60)}m {row.duration % 60}s
        </span>
      ),
    },
    {
      header: 'AI Model',
      className: 'min-w-[150px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-title text-xs">{row.model}</span>
          <Badge variant="outline" className="w-fit text-[10px] mt-0.5 text-subtitle-color">
            {row.provider}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Tokens (In / Out)',
      className: 'min-w-[150px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-title">{row.total_tokens.toLocaleString()} tok</span>
          <span className="text-[11px] text-subtitle-color">
            {row.input_tokens.toLocaleString()} in · {row.output_tokens.toLocaleString()} out
          </span>
        </div>
      ),
    },
    {
      header: 'Voice Engine',
      className: 'min-w-[140px]',
      cell: (row) => (
        <div className="text-xs text-subtitle-color space-y-0.5">
          <div>STT: <span className="font-medium text-title">{row.stt_provider}</span> ({row.stt_seconds}s)</div>
          <div>TTS: <span className="font-medium text-title">{row.tts_provider}</span> ({row.tts_characters}ch)</div>
        </div>
      ),
    },
    {
      header: 'Call AI Cost',
      className: 'min-w-[110px]',
      cell: (row) => (
        <span className="font-bold text-amber-500">
          {formatMoney(row.cost)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filteredCalls}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter calls by agent, client, model..."
        emptyMessage="No recent AI calls recorded."
      />
    </div>
  )
}

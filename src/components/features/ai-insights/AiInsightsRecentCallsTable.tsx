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
        c.provider?.toLowerCase().includes(q) ||
        c.phone_number?.toLowerCase().includes(q) ||
        c.telephony_provider?.toLowerCase().includes(q)
    )
  }, [recentCalls, search])

  const columns: Column<AiInsightRecentCall>[] = [
    {
      header: 'Call & Route Details',
      className: 'min-w-[210px]',
      cell: (row) => {
        let dateStr = ''
        try {
          dateStr = row.created_at ? format(new Date(row.created_at), 'MMM dd, yyyy · HH:mm') : '—'
        } catch {
          dateStr = row.created_at || '—'
        }
        return (
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-title truncate">{row.agent?.name || 'Direct Call'}</span>
              <div className="flex items-center gap-1.5 text-xs text-subtitle-color truncate mt-0.5">
                <span className="font-semibold text-primary">{row.phone_number || 'Direct'}</span>
                {row.direction && (
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 uppercase font-semibold ${row.direction === 'inbound' ? 'text-emerald-500 border-emerald-500/20' : 'text-sky-500 border-sky-500/20'}`}>
                    {row.direction}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-zinc-400 truncate">{dateStr}</span>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Client',
      className: 'min-w-[150px]',
      cell: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-title truncate">{row.user?.name || 'Unknown'}</span>
          <span className="text-xs text-subtitle-color truncate">{row.user?.email}</span>
        </div>
      ),
    },
    {
      header: 'Duration',
      className: 'min-w-[95px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-title">
            {Math.floor(row.duration / 60)}m {row.duration % 60}s
          </span>
          <span className="text-[10px] text-subtitle-color">
            {row.telephony_provider || 'Plivo'}
          </span>
        </div>
      ),
    },
    {
      header: 'AI Model',
      className: 'min-w-[140px]',
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
      className: 'min-w-[140px]',
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
      className: 'min-w-[135px]',
      cell: (row) => (
        <div className="text-xs text-subtitle-color space-y-0.5">
          <div>STT: <span className="font-medium text-title">{row.stt_provider || 'deepgram'}</span> ({row.stt_seconds || 0}s)</div>
          <div>TTS: <span className="font-medium text-title">{row.tts_provider || 'deepgram'}</span> ({row.tts_characters || 0}ch)</div>
        </div>
      ),
    },
    {
      header: 'Total Cost',
      className: 'min-w-[130px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-title">
            {formatMoney(row.cost)}
          </span>
          <span className="text-[10px] text-subtitle-color">
            Tel: {formatMoney(row.telephony_cost || 0)} · AI: {formatMoney(row.ai_cost || 0)}
          </span>
        </div>
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

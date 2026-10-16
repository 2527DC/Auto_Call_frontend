'use client'

import { DataTable } from '@/components/reusable/DataTable'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/currency'
import { AiInsightPhoneNumber } from '@/types/aiInsights'
import { Column } from '@/types/table'
import { ArrowDownLeft, ArrowUpRight, Phone, PhoneCall } from 'lucide-react'
import React, { useMemo, useState } from 'react'

interface AiInsightsPhoneNumbersTableProps {
  phoneNumbers: AiInsightPhoneNumber[]
  isLoading?: boolean
}

export const AiInsightsPhoneNumbersTable: React.FC<AiInsightsPhoneNumbersTableProps> = ({
  phoneNumbers,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('')

  const filteredNumbers = useMemo(() => {
    if (!search.trim()) return phoneNumbers
    const q = search.toLowerCase()
    return phoneNumbers.filter(
      (p) =>
        p.phone_number?.toLowerCase().includes(q) ||
        p.provider?.toLowerCase().includes(q) ||
        p.agents?.toLowerCase().includes(q) ||
        p.clients?.toLowerCase().includes(q)
    )
  }, [phoneNumbers, search])

  const columns: Column<AiInsightPhoneNumber>[] = [
    {
      header: 'Phone Number & Traffic',
      className: 'min-w-[210px]',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-title tracking-wide">{row.phone_number}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                <ArrowDownLeft className="w-3 h-3" />
                {row.inbound_calls} in
              </span>
              <span className="text-zinc-400 text-[10px]">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-500">
                <ArrowUpRight className="w-3 h-3" />
                {row.outbound_calls} out
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Telephony Carrier',
      className: 'min-w-[130px]',
      cell: (row) => {
        const prov = (row.provider || '').toLowerCase()
        const isPlivo = prov.includes('plivo')
        const isTwilio = prov.includes('twilio')
        const isWa = prov.includes('whatsapp')

        const badgeClass = isPlivo
          ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
          : isTwilio
          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          : isWa
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          : 'bg-primary/10 text-primary border-primary/20'

        return (
          <div className="flex flex-col items-start gap-0.5">
            <Badge variant="outline" className={`font-bold text-xs uppercase px-2 py-0.5 ${badgeClass}`}>
              {row.provider || 'Plivo'}
            </Badge>
            <span className="text-[10px] text-subtitle-color">
              {isPlivo ? '30s increment' : '60s increment'}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Total Calls',
      className: 'min-w-[100px]',
      cell: (row) => (
        <span className="font-semibold text-title text-sm">
          {row.calls_count.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Call Duration',
      className: 'min-w-[150px]',
      cell: (row) => {
        const mins = Math.floor(row.duration_seconds / 60)
        const secs = row.duration_seconds % 60
        return (
          <div className="flex flex-col">
            <span className="font-bold text-title">
              {mins}m {secs}s
            </span>
            <span className="text-[11px] text-subtitle-color">
              {row.billed_minutes} billed min
            </span>
          </div>
        )
      },
    },
    {
      header: 'Telephony Charges',
      className: 'min-w-[140px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-sky-500">
            {formatMoney(row.telephony_cost)}
          </span>
          <span className="text-[10px] text-subtitle-color">
            Carrier telecom rate
          </span>
        </div>
      ),
    },
    {
      header: 'AI Engine Cost',
      className: 'min-w-[130px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-amber-500">
            {formatMoney(row.ai_cost)}
          </span>
          <span className="text-[10px] text-subtitle-color">
            LLM + Voice Audio
          </span>
        </div>
      ),
    },
    {
      header: 'Total Charges',
      className: 'min-w-[140px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-title">
            {formatMoney(row.total_cost)}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Progress value={row.cost_percentage} className="h-1.5 w-14" />
            <span className="text-[10px] font-semibold text-primary">{row.cost_percentage}%</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Associated Agent & Client',
      className: 'min-w-[190px]',
      cell: (row) => (
        <div className="flex flex-col max-w-[240px]">
          <span className="font-medium text-title text-xs truncate" title={row.agents}>
            {row.agents || 'Direct / Flow Call'}
          </span>
          <span className="text-[11px] text-subtitle-color truncate mt-0.5" title={row.clients}>
            {row.clients || 'N/A'}
          </span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filteredNumbers}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by phone number, provider, agent, client..."
        emptyMessage="No phone numbers or call activity found for this period."
      />
    </div>
  )
}

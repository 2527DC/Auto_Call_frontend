'use client'

import { DataTable } from '@/components/reusable/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { useGetPriceQuotesQuery } from '@/redux/api/priceEstimatorApi'
import { PriceQuoteListItem, QuoteStatus } from '@/types/priceEstimator'
import { Column } from '@/types/table'
import { FolderOpen, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { pct, rupees } from './fields'
import { STATUS_OPTIONS } from './sections/ClientSection'

const SavedQuotes = ({ canManage, onOpen, onDelete }: {
  canManage: boolean
  onOpen: (id: string) => void
  onDelete: (quote: PriceQuoteListItem) => void
}) => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<QuoteStatus | 'all'>('all')
  const debounced = useDebounce(search, 300)
  const { data, isFetching } = useGetPriceQuotesQuery({ search: debounced }, { refetchOnMountOrArgChange: true })
  const all = data?.data || []
  const quotes = status === 'all' ? all : all.filter((q) => q.status === status)

  const pipeline = STATUS_OPTIONS.map((s) => {
    const list = all.filter((q) => q.status === s.value)
    return { ...s, count: list.length, value_sum: list.reduce((a, q) => a + q.summary.monthly_price, 0) }
  })

  const columns: Column<PriceQuoteListItem>[] = [
    {
      header: 'Client',
      className: 'min-w-[200px]',
      cell: (q) => (
        <button type="button" onClick={() => onOpen(q.id)} className="flex flex-col min-w-0 text-left hover:underline">
          <span className="font-semibold text-title">{q.client.name}</span>
          <span className="text-xs text-subtitle-color">{[q.client.company, q.client.city].filter(Boolean).join(' · ') || q.client.phone}</span>
        </button>
      ),
    },
    {
      header: 'Status',
      cell: (q) => {
        const s = STATUS_OPTIONS.find((o) => o.value === q.status)
        return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', s?.tone)}>{s?.label}</span>
      },
    },
    {
      header: 'Price / month',
      className: 'min-w-[120px]',
      cell: (q) => (
        <div className="flex flex-col tabular-nums">
          <span className="font-semibold">{rupees(q.summary.monthly_price)}</span>
          {q.summary.minutes > 0 && <span className="text-xs text-subtitle-color">{Math.round(q.summary.minutes).toLocaleString('en-IN')} min</span>}
        </div>
      ),
    },
    {
      header: 'Profit / month',
      className: 'min-w-[120px]',
      cell: (q) => (
        <div className="flex flex-col tabular-nums">
          <span className={cn('font-bold', q.summary.monthly_profit < 0 ? 'text-destructive' : 'text-emerald-600')}>{rupees(q.summary.monthly_profit)}</span>
          <span className="text-xs text-subtitle-color">{pct(q.summary.margin_percent)}</span>
        </div>
      ),
    },
    {
      header: 'Set-up',
      cell: (q) => <span className="tabular-nums text-sm">{rupees(q.summary.setup_fee)}</span>,
    },
    {
      header: 'Offers',
      cell: (q) => <span className="tabular-nums text-sm">{q.offers?.length || 0}</span>,
    },
    {
      header: 'Updated',
      className: 'min-w-[140px]',
      cell: (q) => (
        <div className="flex flex-col text-xs text-subtitle-color">
          <span>{new Date(q.updated_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
          {q.created_by?.name && <span>by {q.created_by.name}</span>}
        </div>
      ),
    },
    {
      header: '',
      cell: (q) => (
        <div className="flex items-center justify-end gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => onOpen(q.id)} className="h-8 px-2.5 text-xs">
            <FolderOpen className="w-3.5 h-3.5" /> Open
          </Button>
          {canManage && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(q)} aria-label={`Delete quote for ${q.client.name}`} className="h-8 w-8 p-0 text-subtitle-color hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {pipeline.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(status === s.value ? 'all' : s.value)}
            className={cn('rounded-lg border p-3 text-left transition-colors', status === s.value ? 'border-primary ring-1 ring-primary/20' : 'border-input-border-color bg-bg-card hover:border-primary/40')}
          >
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', s.tone)}>{s.label}</span>
            <p className="text-xl font-bold text-title mt-2 tabular-nums">{s.count}</p>
            <p className="text-[11px] text-subtitle-color tabular-nums">{rupees(s.value_sum)} / month</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtitle-color" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client, company, phone or email" className="h-10 pl-9 bg-input-color border-input-border-color text-sm" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as QuoteStatus | 'all')}>
          <SelectTrigger className="h-10 sm:w-48 shadow-none bg-input-color border-input-border-color text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-bg-card border-input-border-color">
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={quotes} isLoading={isFetching} emptyMessage="No saved quotes yet. Build an estimate and save it." />
    </div>
  )
}

export default SavedQuotes

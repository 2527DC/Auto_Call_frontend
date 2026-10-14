'use client'

import { DataTable } from '@/components/reusable/DataTable'
import LeadStatusBadge from '@/components/features/outcomes/LeadStatusBadge'
import { formatWhen, leadSource } from '@/components/features/outcomes/format'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textArea'
import { useFileManagement } from '@/hooks/useFileManagement'
import { cn } from '@/lib/utils'
import { useBulkUpdateLeadsMutation, useGetLeadsQuery } from '@/redux/api/outcomeApi'
import { LeadRow } from '@/types/outcomes'
import { Column } from '@/types/table'
import { Download, Loader2, Tag } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const SOURCES = ['inbound_call', 'campaign', 'outbound_call', 'whatsapp_call', 'whatsapp', 'import', 'manual']

// Everyone your calls reached or tried to reach, with where they stand now.
export default function LeadsTab() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('all')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [selected, setSelected] = useState<LeadRow[]>([])
  const [bulk, setBulk] = useState<'status' | 'tag' | null>(null)
  const [bulkValue, setBulkValue] = useState('')
  const [bulkNote, setBulkNote] = useState('')
  const [exporting, setExporting] = useState(false)
  const { downloadFile } = useFileManagement()
  const [bulkUpdate, { isLoading: bulkSaving }] = useBulkUpdateLeadsMutation()

  useEffect(() => {
    const id = setTimeout(() => { setQ(search); setPage(1) }, 400)
    return () => clearTimeout(id)
  }, [search])

  const filters = { status: status || undefined, q: q || undefined, source: source === 'all' ? undefined : source }
  const { data, isLoading, isFetching } = useGetLeadsQuery({ ...filters, page, limit })
  const statuses = data?.statuses || []
  const counts = data?.counts || {}
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  const onSelectionChange = useCallback((rows: LeadRow[]) => setSelected(rows), [])

  const handleExport = async () => {
    setExporting(true)
    const params: Record<string, string> = { format: 'csv' }
    for (const [k, v] of Object.entries(filters)) if (v) params[k] = v
    await downloadFile('/outcomes/leads/export', params, 'leads')
    setExporting(false)
  }

  const applyBulk = async () => {
    if (!bulk || !bulkValue) return
    try {
      const res = await bulkUpdate({ ids: selected.map((r) => r.id), action: bulk, value: bulkValue, note: bulkNote.trim() || undefined }).unwrap()
      toast.success(res.message || t('leads_updated', 'Leads updated'))
      setBulk(null)
    } catch (e) {
      toast.error((e as { data?: { message?: string } })?.data?.message || t('update_failed', 'Could not update'))
    }
  }

  const columns: Column<LeadRow>[] = [
    {
      header: t('name', 'Name'),
      className: 'min-w-[190px]',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <Link href={`/leads/${row.id}`} className="font-bold text-title hover:text-primary hover:underline line-clamp-1">{row.name || row.phone_number}</Link>
          {row.name && <span className="text-sm text-subtitle-color">{row.phone_number}</span>}
        </div>
      ),
    },
    {
      header: t('status', 'Status'),
      className: 'min-w-[140px]',
      cell: (row) => <LeadStatusBadge status={row.lead.status} label={row.lead.status_label} statuses={statuses} locked={row.lead.locked} />,
    },
    {
      header: t('last_outcome', 'Last outcome'),
      className: 'min-w-[190px]',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-title line-clamp-1">{row.lead.last_outcome_label || '—'}</span>
          {row.lead.last_call_at && <span className="text-xs text-subtitle-color">{formatWhen(row.lead.last_call_at, t)}</span>}
        </div>
      ),
    },
    {
      header: t('next_follow_up', 'Next follow-up'),
      className: 'min-w-[150px]',
      cell: (row) => {
        const at = row.lead.next_follow_up_at
        if (!at) return <span className="text-sm text-subtitle-color">—</span>
        return <span className={cn('text-sm font-semibold', new Date(at) < new Date() ? 'text-destructive' : 'text-title')}>{formatWhen(at, t)}</span>
      },
    },
    {
      header: t('calls', 'Calls'),
      className: 'min-w-[70px]',
      cell: (row) => <span className="text-sm text-title">{row.lead.calls || 0}</span>,
    },
    {
      header: t('details', 'Details'),
      className: 'min-w-[200px]',
      cell: (row) => {
        const entries = Object.entries(row.lead.details || {}).slice(0, 2)
        const tags = row.lead.tags || []
        if (!entries.length && !tags.length) return <span className="text-sm text-subtitle-color">—</span>
        return (
          <div className="flex flex-wrap gap-1 max-w-[260px]">
            {entries.map(([k, v]) => (
              <span key={k} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-title"><span className="text-subtitle-color">{k.replace(/_/g, ' ')}:</span> {String(v)}</span>
            ))}
            {tags.map((tag) => <span key={tag} className="rounded-md border border-input-border-color px-1.5 py-0.5 text-xs text-subtitle-color">#{tag}</span>)}
          </div>
        )
      },
    },
    {
      header: t('source', 'Source'),
      className: 'min-w-[120px]',
      cell: (row) => <span className="text-sm text-subtitle-color">{leadSource(row.source, t)}</span>,
    },
  ]

  const chip = (key: string, label: string, n: number) => (
    <button key={key || 'all'} type="button" onClick={() => { setStatus(key); setPage(1) }}
      className={cn('flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
        status === key ? 'bg-primary text-white border-primary' : 'bg-bg-card text-title border-input-border-color hover:border-primary/50')}>
      {label}
      <span className={cn('rounded-full px-1.5 text-xs', status === key ? 'bg-white/20' : 'bg-primary/10 text-primary')}>{n}</span>
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {chip('', t('all', 'All'), total)}
        {statuses.filter((s) => counts[s.key]).map((s) => chip(s.key, s.label, counts[s.key]))}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-semibold text-title">{t('n_selected', '{{n}} selected', { n: selected.length })}</span>
          <Button size="sm" variant="outline" className="border-input-border-color" onClick={() => { setBulk('status'); setBulkValue(''); setBulkNote('') }}>{t('change_status', 'Change status')}</Button>
          <Button size="sm" variant="outline" className="border-input-border-color gap-1.5" onClick={() => { setBulk('tag'); setBulkValue(''); setBulkNote('') }}><Tag className="h-3.5 w-3.5" />{t('add_tag', 'Add tag')}</Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading || isFetching}
        enableSelection
        onSelectionChange={onSelectionChange}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('search_leads', 'Search name, number or email')}
        emptyStateTitle={t('no_leads', 'No leads yet')}
        emptyMessage={t('no_leads_desc', 'Leads appear here after your calls are analysed.')}
        totalResults={data?.pagination?.total || 0}
        currentPage={data?.pagination?.page || page}
        totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage}
        rowsPerPage={limit}
        onRowsPerPageChange={(n) => { setLimit(n); setPage(1) }}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={source} onValueChange={(v) => { setSource(v); setPage(1) }}>
              <SelectTrigger className="w-[160px] bg-bg-card border-input-border-color h-11 text-title rounded-radius"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_sources', 'All sources')}</SelectItem>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{leadSource(s, t)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2 h-11 text-sm font-semibold rounded-lg border-input-border-color text-title">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {t('export', 'Export')}
            </Button>
          </div>
        }
      />

      <Dialog open={!!bulk} onOpenChange={(v) => !v && setBulk(null)}>
        <DialogContent className="sm:max-w-[440px]! max-w-[calc(100%-1.5rem)]! bg-bg-card border-none rounded-modal-radius">
          <DialogHeader className="text-left">
            <DialogTitle className="text-title">{bulk === 'status' ? t('change_status', 'Change status') : t('add_tag', 'Add tag')}</DialogTitle>
            <DialogDescription className="text-subtitle-color">{t('n_leads', '{{n}} lead(s)', { n: selected.length })}</DialogDescription>
          </DialogHeader>
          {bulk === 'status' ? (
            <div className="space-y-3">
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger className="h-10 bg-bg-card border-input-border-color text-title rounded-radius"><SelectValue placeholder={t('choose_status', 'Choose a status')} /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} placeholder={t('status_note_placeholder', 'Note (needed when someone leaves "Do not call")')} className="min-h-16 bg-bg-card border-input-border-color" />
              <p className="text-xs text-subtitle-color">{t('status_lock_hint', 'A status you set is kept: later calls only suggest a change.')}</p>
            </div>
          ) : (
            <Input value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder={t('tag_placeholder', 'e.g. premium')} maxLength={30} className="h-10 bg-bg-card border-input-border-color" />
          )}
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" className="border-input-border-color" onClick={() => setBulk(null)}>{t('close', 'Close')}</Button>
            <Button className="bg-primary text-white" disabled={!bulkValue.trim() || bulkSaving} onClick={applyBulk}>
              {bulkSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('apply', 'Apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

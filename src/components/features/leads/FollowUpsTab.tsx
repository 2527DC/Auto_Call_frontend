'use client'

import { DataTable } from '@/components/reusable/DataTable'
import { followUpReason, formatWhen } from '@/components/features/outcomes/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useGetFollowUpsQuery } from '@/redux/api/outcomeApi'
import { FollowUpMode, FollowUpRow, FollowUpTab } from '@/types/outcomes'
import { Column } from '@/types/table'
import { Bot, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FollowUpActions from './FollowUpActions'

const TABS: FollowUpTab[] = ['due_today', 'overdue', 'upcoming', 'done']

// Callbacks the AI will make and tasks for the team, by when they are due.
export default function FollowUpsTab() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<FollowUpTab>('due_today')
  const [mode, setMode] = useState<'all' | FollowUpMode>('all')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)

  useEffect(() => {
    const id = setTimeout(() => { setQ(search); setPage(1) }, 400)
    return () => clearTimeout(id)
  }, [search])

  const { data, isLoading, isFetching } = useGetFollowUpsQuery({ tab, page, limit, q: q || undefined, mode: mode === 'all' ? undefined : mode })
  const counts = data?.counts
  const tabLabel: Record<FollowUpTab, string> = {
    due_today: t('fu_tab_due_today', 'Due today'),
    overdue: t('fu_tab_overdue', 'Overdue'),
    upcoming: t('fu_tab_upcoming', 'Upcoming'),
    done: t('fu_tab_done', 'Done'),
  }
  const closedLabel = (row: FollowUpRow) => ({
    reached: t('fu_closed_reached', 'Reached on the follow-up call'),
    reached_by_later_call: t('fu_closed_later_call', 'Reached on a later call'),
    by_person: row.status === 'cancelled' ? t('fu_closed_cancelled', 'Cancelled') : t('fu_closed_done', 'Marked done'),
    do_not_call: t('fu_closed_dnc', 'Asked not to be called'),
    not_reached: t('fu_closed_not_reached', 'Could not be reached'),
    no_credits: t('fu_closed_no_credits', 'No credits left'),
    campaign_cancelled: t('fu_closed_campaign', 'Campaign cancelled'),
    blocked: t('fu_closed_blocked', 'Number blocked'),
  } as Record<string, string>)[row.closed_reason || ''] || row.closed_reason || row.status

  const columns: Column<FollowUpRow>[] = [
    {
      header: t('person', 'Person'),
      className: 'min-w-[190px]',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          {row.contact_id ? (
            <Link href={`/leads/${row.contact_id}`} className="font-bold text-title hover:text-primary hover:underline line-clamp-1">{row.name || row.phone}</Link>
          ) : (
            <span className="font-bold text-title line-clamp-1">{row.name || row.phone}</span>
          )}
          {row.name && <span className="text-sm text-subtitle-color">{row.phone}</span>}
        </div>
      ),
    },
    {
      header: tab === 'done' ? t('closed', 'Closed') : t('due', 'Due'),
      className: 'min-w-[150px]',
      cell: (row) => {
        if (tab === 'done') return <span className="text-sm text-title">{formatWhen(row.closed_at, t)}</span>
        const overdue = new Date(row.due_at) < new Date()
        return <span className={cn('text-sm font-semibold', overdue ? 'text-destructive' : 'text-title')}>{formatWhen(row.due_at, t)}</span>
      },
    },
    {
      header: t('reason', 'Reason'),
      className: 'min-w-[240px]',
      cell: (row) => (
        <div className="flex flex-col gap-0.5 max-w-[320px] whitespace-normal">
          <span className="text-sm font-semibold text-title">{followUpReason(row.reason, t)}</span>
          {row.note && row.note !== followUpReason(row.reason, t) && <span className="text-sm text-subtitle-color line-clamp-2">{row.note}</span>}
          {row.said && <span className="text-xs italic text-subtitle-color line-clamp-2">“{row.said}”</span>}
        </div>
      ),
    },
    {
      header: t('who', 'Who'),
      className: 'min-w-[140px]',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-sm text-title">
            {row.mode === 'ai_call' ? <Bot className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
            {row.mode === 'ai_call' ? t('fu_mode_ai_short', 'AI call') : t('fu_mode_team_short', 'Team')}
          </span>
          {row.assigned_member && <span className="text-xs text-subtitle-color">{row.assigned_member.name}</span>}
          {row.mode === 'ai_call' && row.attempts > 0 && <span className="text-xs text-subtitle-color">{t('attempt_x_of_y', 'Tried {{x}} of {{y}}', { x: row.attempts, y: row.max_attempts })}</span>}
          {row.error && tab !== 'done' && <span className="text-xs text-destructive line-clamp-2 max-w-[200px] whitespace-normal">{row.error}</span>}
        </div>
      ),
    },
    {
      header: tab === 'done' ? t('result', 'Result') : t('action', 'Action'),
      className: 'min-w-[200px]',
      cell: (row) => (tab === 'done'
        ? <span className="text-sm text-title">{closedLabel(row)}</span>
        : <FollowUpActions followUp={row} />),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((key) => (
          <button key={key} type="button" onClick={() => { setTab(key); setPage(1) }}
            className={cn('flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
              tab === key ? 'bg-primary text-white border-primary' : 'bg-bg-card text-title border-input-border-color hover:border-primary/50')}>
            {tabLabel[key]}
            <span className={cn('rounded-full px-1.5 text-xs', tab === key ? 'bg-white/20' : key === 'overdue' && counts?.overdue ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary')}>
              {counts?.[key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading || isFetching}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('search_follow_ups', 'Search by name, number or note')}
          emptyStateTitle={t('no_follow_ups', 'Nothing here')}
          emptyMessage={tab === 'done' ? t('no_follow_ups_done', 'Closed follow-ups will show here.') : t('no_follow_ups_desc', 'Callbacks and team tasks from your calls will show here.')}
          totalResults={data?.pagination?.total || 0}
          currentPage={data?.pagination?.page || page}
          totalPages={data?.pagination?.totalPages || 1}
          onPageChange={setPage}
          rowsPerPage={limit}
          onRowsPerPageChange={(n) => { setLimit(n); setPage(1) }}
          filters={
            <Select value={mode} onValueChange={(v) => { setMode(v as 'all' | FollowUpMode); setPage(1) }}>
              <SelectTrigger className="w-[160px] bg-bg-card border-input-border-color h-11 text-title rounded-radius"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('fu_filter_all', 'All follow-ups')}</SelectItem>
                <SelectItem value="ai_call">{t('fu_filter_ai', 'AI calls')}</SelectItem>
                <SelectItem value="team">{t('fu_filter_team', 'Team tasks')}</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </div>

      {/* Phones: one card per follow-up, actions included */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search_follow_ups', 'Search by name, number or note')} className="h-10 flex-1 bg-bg-card border-input-border-color" />
          <Select value={mode} onValueChange={(v) => { setMode(v as 'all' | FollowUpMode); setPage(1) }}>
            <SelectTrigger className="w-[120px] bg-bg-card border-input-border-color h-10 text-title rounded-radius"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('fu_filter_all', 'All follow-ups')}</SelectItem>
              <SelectItem value="ai_call">{t('fu_filter_ai', 'AI calls')}</SelectItem>
              <SelectItem value="team">{t('fu_filter_team', 'Team tasks')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(isLoading || isFetching) && !data?.data?.length ? (
          <p className="py-6 text-center text-sm text-subtitle-color">{t('loading', 'Loading…')}</p>
        ) : !data?.data?.length ? (
          <p className="py-6 text-center text-sm text-subtitle-color">{tab === 'done' ? t('no_follow_ups_done', 'Closed follow-ups will show here.') : t('no_follow_ups_desc', 'Callbacks and team tasks from your calls will show here.')}</p>
        ) : data.data.map((row) => {
          const overdue = tab !== 'done' && new Date(row.due_at) < new Date()
          return (
            <div key={row.id} className="rounded-lg border border-input-border-color bg-bg-card p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {row.contact_id ? <Link href={`/leads/${row.contact_id}`} className="font-bold text-title hover:text-primary line-clamp-1">{row.name || row.phone}</Link>
                    : <span className="font-bold text-title line-clamp-1">{row.name || row.phone}</span>}
                  {row.name && <span className="block text-xs text-subtitle-color">{row.phone}</span>}
                </div>
                <span className={cn('shrink-0 text-xs font-semibold', overdue ? 'text-destructive' : 'text-title')}>{tab === 'done' ? formatWhen(row.closed_at, t) : formatWhen(row.due_at, t)}</span>
              </div>
              <p className="text-sm text-title">
                <span className="font-semibold">{followUpReason(row.reason, t)}</span>
                <span className="text-subtitle-color"> · {row.mode === 'ai_call' ? t('fu_mode_ai_short', 'AI call') : t('fu_mode_team_short', 'Team')}</span>
              </p>
              {row.note && row.note !== followUpReason(row.reason, t) && <p className="text-sm text-subtitle-color">{row.note}</p>}
              {row.said && <p className="text-xs italic text-subtitle-color">“{row.said}”</p>}
              {row.error && tab !== 'done' && <p className="text-xs text-destructive">{row.error}</p>}
              {tab === 'done' ? <p className="text-xs text-subtitle-color">{closedLabel(row)}</p> : <FollowUpActions followUp={row} />}
            </div>
          )
        })}
        {(data?.pagination?.totalPages || 1) > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" className="border-input-border-color" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('previous', 'Previous')}</Button>
            <span className="text-xs text-subtitle-color">{page} / {data?.pagination?.totalPages}</span>
            <Button variant="outline" size="sm" className="border-input-border-color" disabled={page >= (data?.pagination?.totalPages || 1)} onClick={() => setPage(page + 1)}>{t('next', 'Next')}</Button>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useDebounce } from '@/hooks/useDebounce'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'
import { useGetWaConversationsQuery, whatsappInboxApi } from '@/redux/api/whatsappInboxApi'
import { ConversationStatus, InboxFilter, WaConversation } from '@/types/whatsappInbox'
import { Check, Inbox, Loader2, Search, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import ConversationItem from './ConversationItem'

const TABS: { value: ConversationStatus | 'all'; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
]

const ConversationList = ({ selectedId, onSelect }: { selectedId: string | null; onSelect: (c: WaConversation) => void }) => {
  const { isTeamMember } = usePermission()
  const [status, setStatus] = useState<ConversationStatus | 'all'>('open')
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [label, setLabel] = useState<string>('')
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search.trim(), 300)
  const params = { status, filter, search: debounced || undefined, label: label || undefined }
  const { data, isLoading, isFetching } = useGetWaConversationsQuery(params, { pollingInterval: 20000 })

  // Older pages, kept until the filters change.
  const [older, setOlder] = useState<{ key: string; items: WaConversation[]; hasMore: boolean }>({ key: '', items: [], hasMore: false })
  const key = JSON.stringify(params)
  const [loadMore, { isFetching: loadingMore }] = whatsappInboxApi.endpoints.getWaConversations.useLazyQuery()

  const conversations = useMemo(() => {
    const first = data?.data || []
    const extra = older.key === key ? older.items : []
    const seen = new Set(first.map((c) => c.id))
    return [...first, ...extra.filter((c) => !seen.has(c.id))]
  }, [data, older, key])
  const hasMore = older.key === key ? older.hasMore : !!data?.has_more

  const fetchMore = async () => {
    const last = conversations[conversations.length - 1]
    if (!last?.last_message?.at) return
    const res = await loadMore({ ...params, before: last.last_message.at }).unwrap().catch(() => null)
    if (res) setOlder({ key, items: [...(older.key === key ? older.items : []), ...res.data], hasMore: res.has_more })
  }

  const counts = data?.counts
  const filters: { value: InboxFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'mine', label: isTeamMember() ? 'Mine' : 'Assigned' },
    { value: 'unassigned', label: 'Unassigned' },
    { value: 'unread', label: 'Unread' },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-input-border-color p-3">
        <div role="tablist" aria-label="Chat status" className="grid grid-cols-4 rounded-lg bg-input-color p-0.5 border border-input-border-color">
          {TABS.map((tab) => {
            const n = tab.value === 'all' ? undefined : counts?.[tab.value]
            return (
              <button
                key={tab.value}
                role="tab"
                type="button"
                aria-selected={status === tab.value}
                onClick={() => setStatus(tab.value)}
                className={cn(
                  'rounded-md px-1 py-1.5 text-xs font-semibold transition-colors',
                  status === tab.value ? 'bg-primary text-white shadow-sm' : 'text-subtitle-color hover:text-title'
                )}
              >
                {tab.label}
                {n ? <span className={cn('ml-1 tabular-nums', status === tab.value ? 'text-white/80' : 'text-subtitle-color/80')}>{n}</span> : null}
              </button>
            )
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtitle-color" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, number or message"
            aria-label="Search chats"
            className="h-9 pl-9 bg-input-color border-input-border-color text-sm"
          />
          {isFetching && !isLoading && <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-subtitle-color" />}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                filter === f.value ? 'border-primary bg-primary/10 text-primary' : 'border-input-border-color text-subtitle-color hover:text-title'
              )}
            >
              {f.label}
              {f.value === 'unread' && counts?.unread ? <span className="ml-1 tabular-nums">{counts.unread}</span> : null}
            </button>
          ))}
          {!!data?.labels?.length && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Filter by label"
                  className={cn(
                    'ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                    label ? 'border-primary bg-primary/10 text-primary' : 'border-input-border-color text-subtitle-color hover:text-title'
                  )}
                >
                  <Tag className="h-3 w-3" /> {label || 'Label'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto bg-bg-card border-input-border-color">
                <DropdownMenuItem onClick={() => setLabel('')}>Any label</DropdownMenuItem>
                {data.labels.map((l) => (
                  <DropdownMenuItem key={l} onClick={() => setLabel(l)} className="gap-2">
                    <span className="flex-1">{l}</span>
                    {label === l && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-px p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 rounded-full bg-input-color animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-input-color animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-input-color animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <Inbox className="h-8 w-8 text-subtitle-color/60" />
            <p className="text-sm font-semibold text-title">{debounced || filter !== 'all' || label ? 'No chats match' : `No ${status === 'all' ? '' : status} chats`}</p>
            <p className="text-xs text-subtitle-color">
              {debounced || filter !== 'all' || label ? 'Try another search or filter.' : 'New WhatsApp messages from customers appear here.'}
            </p>
          </div>
        ) : (
          <>
            {conversations.map((c) => (
              <ConversationItem key={c.id} conversation={c} active={c.id === selectedId} onSelect={() => onSelect(c)} />
            ))}
            {hasMore && (
              <div className="p-3">
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={fetchMore} disabled={loadingMore}>
                  {loadingMore && <Loader2 className="animate-spin" />} Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ConversationList

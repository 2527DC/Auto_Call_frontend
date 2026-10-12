'use client'

import { cn } from '@/lib/utils'
import { WaConversation } from '@/types/whatsappInbox'
import { BotOff, CornerUpLeft, StickyNote } from 'lucide-react'
import { conversationName, InitialsAvatar, listTime, memberName, TypeIcon } from './helpers'

const ConversationItem = ({ conversation: c, active, onSelect }: { conversation: WaConversation; active: boolean; onSelect: () => void }) => {
  const name = conversationName(c)
  const unread = c.unread_count > 0 && c.status !== 'resolved'
  const last = c.last_message
  const assignee = memberName(c.assigned_member_id)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-3 text-left border-b border-input-border-color/60 transition-colors',
        active ? 'bg-primary/8 dark:bg-primary/15' : 'hover:bg-primary/4 dark:hover:bg-white/3'
      )}
    >
      <span className="relative">
        <InitialsAvatar name={name} />
        {c.window_open && (
          <span title="Reply window open" className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg-card bg-emerald-500" />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate text-sm text-title', unread ? 'font-bold' : 'font-semibold')}>{name}</span>
          <span className={cn('shrink-0 text-[11px] tabular-nums', unread ? 'text-primary font-semibold' : 'text-subtitle-color')}>{listTime(last?.at)}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-subtitle-color">
          {last?.direction === 'outbound' && <CornerUpLeft className="w-3 h-3 shrink-0" aria-label="You replied" />}
          {last?.direction === 'internal' ? <StickyNote className="w-3 h-3 shrink-0 text-amber-500" /> : <TypeIcon type={last?.type || 'text'} />}
          <span className={cn('min-w-0 flex-1 truncate', unread && 'text-title font-medium')}>{last?.text || 'No messages yet'}</span>
          {unread && (
            <span className="min-w-5 h-5 shrink-0 px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
              {c.unread_count > 99 ? '99+' : c.unread_count}
            </span>
          )}
        </span>
        {(c.labels.length > 0 || c.bot_paused || assignee) && (
          <span className="mt-1.5 flex items-center gap-1.5">
            {c.labels.slice(0, 2).map((l) => (
              <span key={l} className="rounded-full bg-sky-500/10 px-1.5 py-px text-[10px] font-semibold text-sky-600 dark:text-sky-400">{l}</span>
            ))}
            {c.labels.length > 2 && <span className="text-[10px] text-subtitle-color">+{c.labels.length - 2}</span>}
            {c.bot_paused && (
              <span title="Automation and AI paused" className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                <BotOff className="w-3 h-3" /> Paused
              </span>
            )}
            {assignee && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-subtitle-color" title={`Assigned to ${assignee}`}>
                <InitialsAvatar name={assignee} size="sm" className="h-5 w-5 text-[9px]" />
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  )
}

export default ConversationItem

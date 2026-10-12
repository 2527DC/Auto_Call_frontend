'use client'

import { cn, getAvatarColorClass, getImageUrl } from '@/lib/utils'
import { WaConversation, WaMessage, WaMessageType } from '@/types/whatsappInbox'
import { differenceInCalendarDays, format, isToday, isYesterday } from 'date-fns'
import {
  Bot,
  Contact,
  FileText,
  Headphones,
  Image as ImageIcon,
  LayoutList,
  MapPin,
  MousePointerClick,
  ScrollText,
  Smile,
  StickyNote,
  Video,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '✅']

export const conversationName = (c: Pick<WaConversation, 'contact_id' | 'profile_name' | 'wa_id'>) => {
  const contactName = [c.contact_id?.first_name, c.contact_id?.last_name].filter(Boolean).join(' ').trim()
  return contactName || c.profile_name || `+${c.wa_id}`
}

export const initials = (name: string) => {
  const clean = name.replace(/[^\p{L}\p{N} ]/gu, '').trim()
  if (!clean) return '#'
  const parts = clean.split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export const memberName = (m?: { first_name?: string; last_name?: string; email?: string } | null) =>
  m ? `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email || 'Team member' : ''

export const mediaUrl = (path: string | null | undefined) => (path ? getImageUrl(path) : undefined)

// The chat list's short timestamp: 14:05, Yesterday, Mon, 12/10/26.
export const listTime = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Yesterday'
  if (differenceInCalendarDays(new Date(), d) < 7) return format(d, 'EEE')
  return format(d, 'dd/MM/yy')
}

export const dayLabel = (iso: string) => {
  const d = new Date(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, differenceInCalendarDays(new Date(), d) < 7 ? 'EEEE' : 'd MMMM yyyy')
}

export const timeOf = (iso: string) => format(new Date(iso), 'HH:mm')

// Re-renders every `ms`, for countdowns and relative times.
export const useNow = (ms = 60000) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

// "21h left", "35m left", or null once the 24-hour window has closed.
export const windowLeft = (expiresAt: string | null, now: number) => {
  if (!expiresAt) return null
  const ms = new Date(expiresAt).getTime() - now
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  return h >= 1 ? `${h}h left` : `${Math.max(1, Math.floor(ms / 60000))}m left`
}

const TYPE_ICONS: Partial<Record<WaMessageType, typeof ImageIcon>> = {
  image: ImageIcon,
  video: Video,
  audio: Headphones,
  document: FileText,
  sticker: Smile,
  location: MapPin,
  contacts: Contact,
  interactive: LayoutList,
  button_reply: MousePointerClick,
  template: ScrollText,
  note: StickyNote,
}

export const TypeIcon = ({ type, className }: { type: string; className?: string }) => {
  const Icon = TYPE_ICONS[type as WaMessageType]
  return Icon ? <Icon className={cn('w-3.5 h-3.5 shrink-0', className)} /> : null
}

export const InitialsAvatar = ({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) => (
  <span
    aria-hidden
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
      size === 'sm' && 'h-6 w-6 text-[10px]',
      size === 'md' && 'h-10 w-10 text-sm',
      size === 'lg' && 'h-14 w-14 text-lg',
      getAvatarColorClass(name),
      className
    )}
  >
    {initials(name)}
  </span>
)

export const SenderTag = ({ sender }: { sender: WaMessage['sender'] }) =>
  sender === 'bot' || sender === 'ai' ? (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-primary">
      <Bot className="w-3 h-3" /> {sender === 'ai' ? 'AI' : 'Bot'}
    </span>
  ) : null

export const fileSize = (bytes: number | null | undefined) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const apiMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message || fallback

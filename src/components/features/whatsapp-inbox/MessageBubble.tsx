'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { WaMessage } from '@/types/whatsappInbox'
import { AlertCircle, Check, CheckCheck, Clock, Copy, Download, FileText, ImageOff, Info, Link2, List, MapPin, Reply, ScrollText, SmilePlus, StickyNote, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { fileSize, mediaUrl, QUICK_EMOJIS, SenderTag, timeOf } from './helpers'

const StatusTick = ({ status }: { status: WaMessage['status'] }) => {
  if (status === 'pending') return <Clock className="h-3 w-3" aria-label="Sending" />
  if (status === 'sent') return <Check className="h-3.5 w-3.5" aria-label="Sent" />
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5" aria-label="Delivered" />
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-sky-500" aria-label="Read" />
  if (status === 'failed') return <AlertCircle className="h-3.5 w-3.5 text-destructive" aria-label="Not delivered" />
  return null
}

const MediaBody = ({ m, onOpenImage }: { m: WaMessage; onOpenImage: (url: string) => void }) => {
  const url = mediaUrl(m.media?.url)
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-black/5 dark:bg-white/5 px-3 py-2 text-xs text-subtitle-color">
        <ImageOff className="h-4 w-4 shrink-0" />
        {m.media?.size && m.media.size > 16 * 1024 * 1024 ? 'File too large to download' : m.media?.filename || `Loading ${m.type}…`}
      </div>
    )
  }
  if (m.type === 'image' || m.type === 'sticker') {
    return (
      <button type="button" onClick={() => onOpenImage(url)} className="block overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Photo" className={cn('object-cover', m.type === 'sticker' ? 'h-32 w-32 object-contain' : 'max-h-72 w-full max-w-xs')} loading="lazy" />
      </button>
    )
  }
  if (m.type === 'video') return <video src={url} controls preload="metadata" className="max-h-72 w-full max-w-xs rounded-md bg-black" />
  if (m.type === 'audio') return <audio src={url} controls preload="metadata" className="w-64 max-w-full" />
  return (
    <a href={url} target="_blank" rel="noreferrer" download={m.media?.filename || undefined} className="flex items-center gap-3 rounded-md bg-black/5 dark:bg-white/5 px-3 py-2.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
      <FileText className="h-8 w-8 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-title">{m.media?.filename || 'Document'}</span>
        <span className="text-[11px] text-subtitle-color">{[m.media?.mime_type?.split('/')[1]?.toUpperCase(), fileSize(m.media?.size)].filter(Boolean).join(' · ')}</span>
      </span>
      <Download className="h-4 w-4 shrink-0 text-subtitle-color" />
    </a>
  )
}

const Body = ({ m, onOpenImage }: { m: WaMessage; onOpenImage: (url: string) => void }) => {
  const isMedia = ['image', 'video', 'audio', 'document', 'sticker'].includes(m.type)
  const text = m.text && !(m.type === 'document' && m.text === m.media?.filename) ? m.text : ''

  if (m.type === 'location' && m.location) {
    const href = `https://www.google.com/maps?q=${m.location.latitude},${m.location.longitude}`
    return (
      <a href={href} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:underline">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <span className="text-sm">{m.location.name || m.location.address || 'Shared location'}<span className="block text-[11px] text-subtitle-color">Open in Google Maps</span></span>
      </a>
    )
  }
  if (m.type === 'contacts') {
    return (
      <div className="flex items-start gap-2">
        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm whitespace-pre-wrap">{m.text || 'Shared contact'}</span>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {m.type === 'template' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/10 px-1.5 py-px text-[10px] font-semibold text-subtitle-color">
          <ScrollText className="h-3 w-3" /> Template{m.template?.name ? ` · ${m.template.name}` : ''}
        </span>
      )}
      {m.type === 'interactive' && m.interactive?.header && <p className="text-sm font-semibold">{m.interactive.header}</p>}
      {isMedia && <MediaBody m={m} onOpenImage={onOpenImage} />}
      {m.type === 'button_reply' ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-sm font-medium text-primary">
          Tapped: {m.interactive?.title || m.text}
        </span>
      ) : (
        text && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p>
      )}
      {m.type === 'interactive' && m.interactive?.footer && <p className="text-[11px] text-subtitle-color">{m.interactive.footer}</p>}
      {m.type === 'unsupported' && <p className="text-[11px] italic text-subtitle-color">This message type isn&apos;t shown in Voxeno yet. Open WhatsApp to see it.</p>}
    </div>
  )
}

// Buttons or a list sent by the bot, shown under the bubble the way WhatsApp does.
const InteractiveOptions = ({ m }: { m: WaMessage }) => {
  const i = m.interactive
  if (m.type !== 'interactive' || !i) return null
  if (i.kind === 'buttons' && i.buttons?.length) {
    return (
      <div className="mt-1 grid gap-1">
        {i.buttons.map((b) => (
          <span key={b.id} className="rounded-md bg-bg-card border border-input-border-color px-3 py-1.5 text-center text-sm font-medium text-sky-600 dark:text-sky-400">{b.title}</span>
        ))}
      </div>
    )
  }
  if (i.kind === 'list') {
    const rows = (i.sections || []).flatMap((s) => s.rows)
    return (
      <div className="mt-1 rounded-md bg-bg-card border border-input-border-color">
        <span className="flex items-center justify-center gap-1.5 border-b border-input-border-color px-3 py-1.5 text-sm font-medium text-sky-600 dark:text-sky-400">
          <List className="h-3.5 w-3.5" /> {i.button_label || 'Options'}
        </span>
        <ul className="divide-y divide-input-border-color">
          {rows.slice(0, 10).map((r) => (
            <li key={r.id} className="px-3 py-1.5 text-xs">
              <span className="font-medium text-title">{r.title}</span>
              {r.description && <span className="block text-subtitle-color">{r.description}</span>}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return null
}

interface MessageBubbleProps {
  message: WaMessage
  canReact: boolean
  canReply: boolean
  onReply: (m: WaMessage) => void
  onReact: (m: WaMessage, emoji: string) => void
  onOpenImage: (url: string) => void
}

const MessageBubble = ({ message: m, canReact, canReply, onReply, onReact, onOpenImage }: MessageBubbleProps) => {
  if (m.type === 'event') {
    return (
      <div className="flex justify-center py-1">
        <span className="inline-flex max-w-[85%] items-center gap-1.5 rounded-full bg-input-color border border-input-border-color px-3 py-1 text-[11px] text-subtitle-color">
          <Info className="h-3 w-3 shrink-0" />
          <span className="truncate" title={m.text}>{m.text}</span>
          <span className="tabular-nums opacity-70">{timeOf(m.created_at)}</span>
        </span>
      </div>
    )
  }

  const inbound = m.direction === 'inbound'
  const note = m.type === 'note'
  const agentReaction = m.reactions?.find((r) => r.actor === 'agent')?.emoji

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(m.text || '')
      toast.success('Copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className={cn('group flex px-1 py-0.5', inbound ? 'justify-start' : 'justify-end')}>
      <div className={cn('flex max-w-[85%] sm:max-w-[70%] items-center gap-1', inbound ? 'flex-row' : 'flex-row-reverse')}>
        <div className="min-w-0">
          <div
            className={cn(
              'relative rounded-2xl px-3 py-2 shadow-sm',
              inbound && 'rounded-tl-sm bg-bg-card border border-input-border-color text-title',
              !inbound && !note && 'rounded-tr-sm bg-primary/10 dark:bg-primary/20 text-title',
              note && 'rounded-tr-sm bg-amber-100 dark:bg-amber-500/15 border border-amber-300/70 dark:border-amber-500/30 text-amber-950 dark:text-amber-100',
              m.status === 'failed' && 'ring-1 ring-destructive/40'
            )}
          >
            {(note || (!inbound && (m.sender !== 'agent' || m.sent_by))) && (
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-subtitle-color">
                {note && <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300"><StickyNote className="h-3 w-3" /> Internal note</span>}
                <SenderTag sender={m.sender} />
                {m.sent_by && <span>{m.sent_by}</span>}
              </div>
            )}
            {m.reply_to_message_id && (
              <div className="mb-1.5 rounded-md border-l-2 border-primary bg-black/5 dark:bg-white/5 px-2 py-1 text-xs text-subtitle-color">
                <span className="font-semibold text-primary">{m.reply_to_message_id.direction === 'inbound' ? 'Customer' : 'You'}</span>
                <span className="block truncate">{m.reply_to_message_id.text || m.reply_to_message_id.media?.filename || m.reply_to_message_id.type}</span>
              </div>
            )}
            <Body m={m} onOpenImage={onOpenImage} />
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-subtitle-color tabular-nums">
              {timeOf(m.created_at)}
              {!inbound && !note && <StatusTick status={m.status} />}
            </div>
            {m.reactions?.length > 0 && (
              <div className={cn('absolute -bottom-3 flex gap-0.5 rounded-full border border-input-border-color bg-bg-card px-1.5 py-px text-xs shadow-sm', inbound ? 'left-2' : 'right-2')}>
                {m.reactions.map((r) => <span key={r.actor} title={r.actor === 'customer' ? 'Customer' : 'Your team'}>{r.emoji}</span>)}
              </div>
            )}
          </div>
          <InteractiveOptions m={m} />
          {m.status === 'failed' && (
            <p className="mt-1 flex items-start gap-1 text-[11px] text-destructive">
              <AlertCircle className="mt-px h-3 w-3 shrink-0" /> Not delivered{m.error?.message ? `: ${m.error.message}` : ''}
            </p>
          )}
          {m.reactions?.length > 0 && <div className="h-3" />}
        </div>

        {!note && (
          <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            {canReply && m.wamid && (
              <button type="button" onClick={() => onReply(m)} aria-label="Reply" title="Reply" className="rounded-full p-1.5 text-subtitle-color hover:bg-input-color hover:text-title">
                <Reply className="h-3.5 w-3.5" />
              </button>
            )}
            {canReact && m.wamid && (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" aria-label="React" title="React" className="rounded-full p-1.5 text-subtitle-color hover:bg-input-color hover:text-title">
                    <SmilePlus className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="flex w-auto gap-1 rounded-full bg-bg-card border-input-border-color p-1.5">
                  {QUICK_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => onReact(m, agentReaction === e ? '' : e)}
                      className={cn('rounded-full p-1 text-lg leading-none transition-transform hover:scale-125', agentReaction === e && 'bg-primary/15')}
                      aria-label={`React ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}
            {m.text && (
              <button type="button" onClick={copy} aria-label="Copy" title="Copy" className="rounded-full p-1.5 text-subtitle-color hover:bg-input-color hover:text-title">
                {m.type === 'location' ? <Link2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble

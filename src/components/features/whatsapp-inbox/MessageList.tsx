'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useGetWaMessagesQuery, useLazyGetWaMessagesQuery, useReactWaMessageMutation } from '@/redux/api/whatsappInboxApi'
import { WaMessage } from '@/types/whatsappInbox'
import { Loader2, MessageCircle } from 'lucide-react'
import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { apiMessage, dayLabel } from './helpers'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  conversationId: string
  canReply: boolean
  windowOpen: boolean
  onReply: (m: WaMessage) => void
}

const MessageList = ({ conversationId, canReply, windowOpen, onReply }: MessageListProps) => {
  const { data, isLoading } = useGetWaMessagesQuery({ id: conversationId }, { pollingInterval: 20000 })
  const [loadOlder, { isFetching: loadingOlder }] = useLazyGetWaMessagesQuery()
  const [react] = useReactWaMessageMutation()
  const [older, setOlder] = useState<{ id: string; items: WaMessage[]; hasMore: boolean }>({ id: '', items: [], hasMore: false })
  const [lightbox, setLightbox] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const keepFrom = useRef<number | null>(null)
  const lastSeen = useRef<string | null>(null)

  const messages = useMemo(() => {
    const latest = data?.data || []
    const extra = older.id === conversationId ? older.items : []
    const seen = new Set(latest.map((m) => m.id))
    return [...extra.filter((m) => !seen.has(m.id)), ...latest]
  }, [data, older, conversationId])
  const hasMore = older.id === conversationId ? older.hasMore : !!data?.has_more

  // Mounted once per chat (keyed by id): it opens at the bottom, and new messages
  // scroll into view only if you were already near the bottom.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el || !messages.length) return
    const newest = messages[messages.length - 1].id
    if (keepFrom.current !== null) {
      el.scrollTop = el.scrollHeight - keepFrom.current
      keepFrom.current = null
    } else if (lastSeen.current === null || (newest !== lastSeen.current && nearBottom.current)) {
      el.scrollTop = el.scrollHeight
    }
    lastSeen.current = newest
  }, [messages])

  const fetchOlder = async () => {
    const first = messages[0]
    if (!first || loadingOlder) return
    const el = scroller.current
    const res = await loadOlder({ id: conversationId, before: first.id }).unwrap().catch(() => null)
    if (!res) return
    if (el) keepFrom.current = el.scrollHeight - el.scrollTop
    setOlder({ id: conversationId, items: [...res.data, ...(older.id === conversationId ? older.items : [])], hasMore: res.has_more })
  }

  const onScroll = () => {
    const el = scroller.current
    if (!el) return
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (el.scrollTop < 60 && hasMore) fetchOlder()
  }

  const onReact = async (m: WaMessage, emoji: string) => {
    try {
      await react({ messageId: m.id, conversationId, emoji }).unwrap()
    } catch (err) {
      toast.error(apiMessage(err, 'Could not react'))
    }
  }

  return (
    <>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 bg-[radial-gradient(circle_at_1px_1px,rgba(124,58,237,0.06)_1px,transparent_0)] bg-size-[18px_18px]"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-subtitle-color"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-subtitle-color">
            <MessageCircle className="h-8 w-8 opacity-60" />
            <p className="text-sm">No messages in this chat yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {hasMore && (
              <div className="flex justify-center pb-2">
                <button type="button" onClick={fetchOlder} className="text-xs font-semibold text-primary hover:underline disabled:opacity-60" disabled={loadingOlder}>
                  {loadingOlder ? 'Loading…' : 'Load older messages'}
                </button>
              </div>
            )}
            {messages.map((m, i) => {
              const showDay = i === 0 || dayLabel(messages[i - 1].created_at) !== dayLabel(m.created_at)
              return (
                <Fragment key={m.id}>
                  {showDay && (
                    <div className="flex justify-center py-2">
                      <span className="rounded-full bg-bg-card border border-input-border-color px-3 py-0.5 text-[11px] font-semibold text-subtitle-color shadow-sm">{dayLabel(m.created_at)}</span>
                    </div>
                  )}
                  <MessageBubble
                    message={m}
                    canReply={canReply}
                    canReact={canReply && windowOpen && m.direction !== 'internal'}
                    onReply={onReply}
                    onReact={onReact}
                    onOpenImage={setLightbox}
                  />
                </Fragment>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-4xl p-2! bg-black/90! border-none">
          <DialogTitle className="sr-only">Image</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {lightbox && <img src={lightbox} alt="" className="max-h-[85vh] w-full rounded object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MessageList

'use client'

import { Button } from '@/components/ui/button'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/redux/hooks'
import {
  useGetWaConversationQuery,
  useGetWaSetupQuery,
  useMarkWaReadMutation,
  useSubscribeWaWebhookMutation,
  whatsappInboxApi,
} from '@/redux/api/whatsappInboxApi'
import { socketService } from '@/services/socketService'
import { WaConversation, WaMessage } from '@/types/whatsappInbox'
import { AlertTriangle, ArrowUpRight, Loader2, MessageCircleMore, Plug, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import Composer from './Composer'
import ContactPanel from './ContactPanel'
import ConversationList from './ConversationList'
import { apiMessage, conversationName } from './helpers'
import MessageList from './MessageList'
import ThreadHeader from './ThreadHeader'

type RealtimeEvent = { conversation_id: string; message_id?: string }

const SetupBanners = () => {
  const { data, refetch } = useGetWaSetupQuery()
  const [subscribe, { isLoading }] = useSubscribeWaWebhookMutation()
  const setup = data?.data
  if (!setup) return null
  const backend = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/api\/?$/, '')

  if (!setup.numbers.length) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
        <Plug className="h-5 w-5 shrink-0 text-amber-600" />
        <p className="flex-1 text-sm text-subtitle-color">
          <b className="block text-title">Connect a WhatsApp Business number to start</b>
          Connect it in Toolbox → WhatsApp, then set the webhook in your Meta app to <code className="rounded bg-input-color px-1 text-xs">{backend}{setup.webhook_path}</code>.
        </p>
        <Button asChild size="sm" className="gap-1.5">
          <Link href={ROUTES.WHATSAPP_CONNECT}>Connect WhatsApp <ArrowUpRight /></Link>
        </Button>
      </div>
    )
  }

  if (setup.numbers.some((n) => n.webhook_subscribed === false)) {
    const connect = async () => {
      try {
        const res = await subscribe().unwrap()
        toast.success(res.message || 'Webhook connected')
        refetch()
      } catch (err) {
        toast.error(apiMessage(err, 'Could not connect the webhook'))
      }
    }
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <p className="flex-1 text-sm text-subtitle-color">
          <b className="block text-title">WhatsApp isn&apos;t sending new messages to Voxeno yet</b>
          Connect the webhook so customers&apos; messages arrive in this inbox.
        </p>
        <Button type="button" size="sm" onClick={connect} disabled={isLoading} className="gap-1.5">
          {isLoading ? <Loader2 className="animate-spin" /> : <Plug />} Connect webhook
        </Button>
      </div>
    )
  }
  return null
}

const WhatsappInboxPage = () => {
  const dispatch = useAppDispatch()
  const { hasPermission } = usePermission()
  const canReply = hasPermission(PERMISSIONS.REPLY_WHATSAPP_INBOX)
  const canAssign = hasPermission(PERMISSIONS.ASSIGN_WHATSAPP_INBOX)
  const { data: setup } = useGetWaSetupQuery()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [replyTo, setReplyTo] = useState<WaMessage | null>(null)
  const { data: detail, isFetching: loadingDetail, isError } = useGetWaConversationQuery(selectedId as string, { skip: !selectedId, pollingInterval: 20000 })
  const [markRead] = useMarkWaReadMutation()
  const conversation = detail?.data && detail.data.id === selectedId ? detail.data : null
  const selected = useRef(selectedId)
  selected.current = selectedId

  // /whatsapp-inbox?c=<id> opens that chat (links from automation runs).
  useEffect(() => {
    const linked = new URLSearchParams(window.location.search).get('c')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (linked) setSelectedId(linked)
  }, [])

  // Live updates: refetch the list, and the open chat when it changed.
  useEffect(() => {
    const refresh = (e: RealtimeEvent) => {
      dispatch(whatsappInboxApi.util.invalidateTags(
        e?.conversation_id === selected.current
          ? ['WhatsappConversation', { type: 'WhatsappMessage', id: e.conversation_id }]
          : ['WhatsappConversation']
      ))
    }
    const offs = ['whatsapp:message', 'whatsapp:conversation', 'whatsapp:status'].map((ev) => socketService.on<RealtimeEvent>(ev, refresh))
    return () => offs.forEach((off) => off())
  }, [dispatch])

  // An open chat with unread messages is read: blue ticks for the customer.
  const unread = conversation?.unread_count || 0
  useEffect(() => {
    if (selectedId && unread > 0) markRead(selectedId)
  }, [selectedId, unread, markRead])

  useEffect(() => {
    if (isError && selectedId) {
      toast.error('That chat is no longer available')
      setSelectedId(null)
    }
  }, [isError, selectedId])

  const open = (c: WaConversation) => {
    setSelectedId(c.id)
    setReplyTo(null)
    if (typeof window !== 'undefined' && window.innerWidth < 1280) setPanelOpen(false)
  }

  return (
    <div className="flex h-[calc(100dvh-96px)] min-h-[520px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold text-title">WhatsApp Inbox</h1>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">Beta</span>
        {setup?.data?.ai_enabled && (
          <Link href={`${ROUTES.WHATSAPP_AUTOMATIONS}?tab=ai`} className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 hover:underline">
            <Sparkles className="h-3 w-3" /> AI auto-reply on
          </Link>
        )}
        {setup?.data?.numbers?.length ? (
          <span className="text-xs text-subtitle-color">{setup.data.numbers.map((n) => n.verified_name || n.display_phone_number).join(' · ')}</span>
        ) : null}
      </div>

      <SetupBanners />

      <div className="relative flex min-h-0 flex-1 gap-3">
        <aside className={cn(
          'w-full shrink-0 overflow-hidden rounded-lg border border-input-border-color bg-bg-card lg:w-[340px]',
          selectedId ? 'hidden lg:block' : 'block'
        )}>
          <ConversationList selectedId={selectedId} onSelect={open} />
        </aside>

        <section className={cn('min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-input-border-color bg-bg-card', selectedId ? 'flex' : 'hidden lg:flex')}>
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircleMore className="h-7 w-7" />
              </span>
              <p className="text-base font-semibold text-title">Pick a chat to start replying</p>
              <p className="max-w-sm text-sm text-subtitle-color">Customers&apos; WhatsApp messages land here. Automations and AI answer first; anything they hand over waits under Pending.</p>
            </div>
          ) : !conversation ? (
            <div className="flex flex-1 items-center justify-center text-subtitle-color">
              {loadingDetail ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Chat not found'}
            </div>
          ) : (
            <>
              <ThreadHeader
                conversation={conversation}
                canReply={canReply}
                canAssign={canAssign}
                onBack={() => setSelectedId(null)}
                onTogglePanel={() => setPanelOpen((p) => !p)}
                panelOpen={panelOpen}
              />
              <MessageList key={conversation.id} conversationId={conversation.id} canReply={canReply} windowOpen={conversation.window_open} onReply={setReplyTo} />
              <Composer
                key={`composer-${conversation.id}`}
                conversationId={conversation.id}
                windowOpen={conversation.window_open}
                canReply={canReply}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
                wabaId={(conversation as WaConversation & { waba_id?: string }).waba_id || null}
                customerName={conversationName(conversation)}
              />
            </>
          )}
        </section>

        {conversation && panelOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30 xl:hidden" onClick={() => setPanelOpen(false)} aria-hidden />
            <aside className="fixed inset-y-0 right-0 z-50 w-[min(320px,90vw)] overflow-hidden border-l border-input-border-color bg-bg-card shadow-2xl xl:static xl:z-auto xl:w-[300px] xl:shrink-0 xl:rounded-lg xl:border xl:shadow-none">
              <ContactPanel conversation={conversation} canReply={canReply} onClose={() => setPanelOpen(false)} />
            </aside>
          </>
        )}
      </div>
    </div>
  )
}

export default WhatsappInboxPage

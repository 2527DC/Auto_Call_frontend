'use client'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { Check, Clock, Copy, Hand, KeyRound, Link2, MessageCircle, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '')
const WEBHOOK_URL = `${apiBase || 'https://<your-voxeno-backend>/api'}/whatsapp/webhook`

const Item = ({ icon: Icon, title, children }: { icon: typeof Zap; title: string; children: React.ReactNode }) => (
  <div className="flex gap-3 rounded-lg border border-input-border-color bg-bg-card p-4">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="w-4 h-4" /></span>
    <div className="min-w-0 space-y-1">
      <h3 className="text-sm font-semibold text-title">{title}</h3>
      <div className="text-sm text-subtitle-color leading-relaxed space-y-1">{children}</div>
    </div>
  </div>
)

const HowItWorks = () => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: the URL is visible to copy by hand.
    }
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="lg:col-span-2 rounded-lg border border-primary/30 bg-primary/[0.04] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white"><Link2 className="w-4 h-4" /></span>
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-sm font-semibold text-title">1. Connect your number and point Meta at Voxeno</h3>
            <p className="text-sm text-subtitle-color">
              Connect your WhatsApp Business number under <Link href={ROUTES.WHATSAPP_CONNECT} className="text-primary hover:underline">Toolbox → WhatsApp</Link>. Then, in your Meta app (WhatsApp → Configuration), set this callback URL and subscribe to the <b className="text-title">messages</b> field:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-md border border-input-border-color bg-bg-card px-3 py-2 text-xs text-title">{WEBHOOK_URL}</code>
              <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-1">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy'}</Button>
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-subtitle-color"><KeyRound className="w-3.5 h-3.5" /> Use the verify token from Voxeno support, and add your Meta App Secret in Settings so incoming messages are verified.</p>
          </div>
        </div>
      </div>
      <Item icon={Zap} title="2. Which automation answers">
        <p>A chat already inside an automation stays in it until it ends. Otherwise Voxeno picks the first match: <b className="text-title">keyword</b> flows, then <b className="text-title">first message</b>, then <b className="text-title">any message</b>. Among flows of the same kind, the lower priority number wins.</p>
      </Item>
      <Item icon={Sparkles} title="3. When nothing matches">
        <p>If <b className="text-title">AI auto-reply</b> is on, the AI answers from your knowledge bases. If it&apos;s off, the message simply waits in the <Link href={ROUTES.WHATSAPP_INBOX} className="text-primary hover:underline">WhatsApp Inbox</Link>.</p>
      </Item>
      <Item icon={Hand} title="4. People take over">
        <p>As soon as a team member replies in the inbox, automations and AI go quiet in that chat. They answer again once the chat is resolved, or when someone clicks <b className="text-title">Resume bot</b>.</p>
      </Item>
      <Item icon={Clock} title="5. The 24-hour rule">
        <p>WhatsApp only allows free-form replies within 24 hours of the customer&apos;s last message. After that, only approved templates can be sent, so Wait steps are limited to 23 hours.</p>
      </Item>
      <Item icon={MessageCircle} title="6. Test before going live">
        <p>Use <b className="text-title">Test</b> in the builder to chat with your flow. Nothing is sent to WhatsApp; webhooks and AI run for real, while bookings, calls and contact changes are only simulated.</p>
      </Item>
      <Item icon={Check} title="Beta">
        <p>WhatsApp Inbox &amp; Automations are free during the beta. Meta bills your WhatsApp Business account directly for any conversation charges.</p>
      </Item>
    </div>
  )
}

export default HowItWorks

'use client'

import { Input } from '@/components/ui/input'
import { ROUTES } from '@/constants/routes'
import { useSetWaBotMutation, useUpdateWaConversationMutation } from '@/redux/api/whatsappInboxApi'
import { WaConversationDetail } from '@/types/whatsappInbox'
import { format } from 'date-fns'
import { ArrowUpRight, Bot, Mail, Phone, Plus, Tag, Users, X } from 'lucide-react'
import Link from 'next/link'
import { FormEvent, ReactNode, useState } from 'react'
import { toast } from 'sonner'
import { apiMessage, conversationName, InitialsAvatar } from './helpers'

const Section = ({ title, icon: Icon, children }: { title: string; icon: typeof Tag; children: ReactNode }) => (
  <section className="border-b border-input-border-color px-4 py-4">
    <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-subtitle-color">
      <Icon className="h-3.5 w-3.5" /> {title}
    </h3>
    {children}
  </section>
)

const ContactPanel = ({ conversation: c, canReply, onClose }: { conversation: WaConversationDetail; canReply: boolean; onClose: () => void }) => {
  const [update, { isLoading: saving }] = useUpdateWaConversationMutation()
  const [setBot] = useSetWaBotMutation()
  const [newLabel, setNewLabel] = useState('')
  const name = conversationName(c)
  const run = c.active_run
  const vars = Object.entries(run?.vars || {}).filter(([k]) => k !== 'last_message')

  const saveLabels = async (labels: string[]) => {
    try {
      await update({ id: c.id, labels }).unwrap()
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save labels'))
    }
  }

  const addLabel = (e: FormEvent) => {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label || c.labels.includes(label)) return setNewLabel('')
    saveLabels([...c.labels, label])
    setNewLabel('')
  }

  const stopBot = async () => {
    try {
      await setBot({ id: c.id, paused: true }).unwrap()
      toast.success('Automation stopped for this chat')
    } catch (err) {
      toast.error(apiMessage(err, 'Could not stop the automation'))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-input-border-color px-4 py-3">
        <span className="text-sm font-bold text-title">Contact</span>
        <button type="button" onClick={onClose} aria-label="Close contact details" className="rounded-full p-1 text-subtitle-color hover:bg-input-color hover:text-title">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center border-b border-input-border-color px-4 py-5 text-center">
          <InitialsAvatar name={name} size="lg" />
          <p className="mt-2 text-sm font-bold text-title">{name}</p>
          {c.profile_name && c.profile_name !== name && <p className="text-xs text-subtitle-color">WhatsApp name: {c.profile_name}</p>}
          <div className="mt-3 w-full space-y-1.5 text-left text-xs">
            <a href={`tel:+${c.wa_id}`} className="flex items-center gap-2 text-subtitle-color hover:text-title">
              <Phone className="h-3.5 w-3.5" /> <span className="tabular-nums">+{c.wa_id}</span>
            </a>
            {c.contact_id?.email && (
              <a href={`mailto:${c.contact_id.email}`} className="flex items-center gap-2 break-all text-subtitle-color hover:text-title">
                <Mail className="h-3.5 w-3.5 shrink-0" /> {c.contact_id.email}
              </a>
            )}
          </div>
          {c.contact_id && (
            <Link href={ROUTES.CONTACT_HUB} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Open in Contact Hub <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <Section title="Labels" icon={Tag}>
          <div className="flex flex-wrap gap-1.5">
            {c.labels.length === 0 && <span className="text-xs text-subtitle-color">No labels</span>}
            {c.labels.map((l) => (
              <span key={l} className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                {l}
                {canReply && (
                  <button type="button" onClick={() => saveLabels(c.labels.filter((x) => x !== l))} aria-label={`Remove label ${l}`} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {canReply && (
            <form onSubmit={addLabel} className="mt-2.5 flex gap-1.5">
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Add a label, e.g. hot lead" maxLength={30} className="h-8 bg-input-color border-input-border-color text-xs" aria-label="New label" />
              <button type="submit" disabled={!newLabel.trim() || saving} aria-label="Add label" className="shrink-0 rounded-md border border-input-border-color px-2 text-subtitle-color hover:text-primary disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </Section>

        {!!c.contact_id?.group_ids?.length && (
          <Section title="Contact groups" icon={Users}>
            <div className="flex flex-wrap gap-1.5">
              {c.contact_id.group_ids.map((g) => (
                <span key={g.id} className="rounded-full bg-input-color border border-input-border-color px-2 py-0.5 text-[11px] font-medium text-title">{g.group_name}</span>
              ))}
            </div>
          </Section>
        )}

        <Section title="Automation" icon={Bot}>
          {run ? (
            <div className="space-y-2.5 text-xs">
              <p className="text-title">
                <b>{run.flow_name}</b>
                <span className="block text-subtitle-color">
                  {run.step ? `At "${run.step}"` : 'Running'}
                  {run.waiting && ` · waiting for ${run.waiting === 'delay' ? 'a timer' : 'the customer'}`}
                </span>
              </p>
              {vars.length > 0 && (
                <dl className="divide-y divide-input-border-color rounded-md border border-input-border-color">
                  {vars.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[minmax(0,40%)_1fr] gap-2 px-2.5 py-1.5">
                      <dt className="truncate font-mono text-[11px] text-subtitle-color">{k}</dt>
                      <dd className="break-words text-title">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {canReply && (
                <button type="button" onClick={stopBot} className="font-semibold text-destructive hover:underline">Stop the automation</button>
              )}
            </div>
          ) : (
            <p className="text-xs text-subtitle-color">{c.bot_paused ? 'Paused in this chat: a person took over.' : 'No automation is running in this chat.'}</p>
          )}
        </Section>

        <div className="space-y-1 px-4 py-4 text-[11px] text-subtitle-color">
          <p>First message: {format(new Date(c.created_at), 'd MMM yyyy, HH:mm')}</p>
          {c.last_message?.at && <p>Last activity: {format(new Date(c.last_message.at), 'd MMM yyyy, HH:mm')}</p>}
          {c.ai_reply_count > 0 && <p>AI replies in this chat: {c.ai_reply_count}</p>}
        </div>
      </div>
    </div>
  )
}

export default ContactPanel

'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useGetWaQuickRepliesQuery, useSendWaMessageMutation } from '@/redux/api/whatsappInboxApi'
import { WaMessage } from '@/types/whatsappInbox'
import { Clock, FileText, Loader2, Paperclip, Reply, ScrollText, Send, Settings2, StickyNote, X, Zap } from 'lucide-react'
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { apiMessage, fileSize } from './helpers'
import QuickRepliesDialog from './QuickRepliesDialog'
import TemplateDialog from './TemplateDialog'

const MAX_FILE = 16 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,video/mp4,video/3gpp,audio/aac,audio/mp4,audio/mpeg,audio/ogg,audio/amr,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'

interface ComposerProps {
  conversationId: string
  windowOpen: boolean
  canReply: boolean
  replyTo: WaMessage | null
  onClearReply: () => void
  wabaId: string | null
  customerName: string
}

const Composer = ({ conversationId, windowOpen, canReply, replyTo, onClearReply, wabaId, customerName }: ComposerProps) => {
  const [send, { isLoading: sending }] = useSendWaMessageMutation()
  const { data: quickData } = useGetWaQuickRepliesQuery()
  const [text, setText] = useState('')
  const [note, setNote] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [manageQuick, setManageQuick] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickIndex, setQuickIndex] = useState(0)
  const area = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])

  useEffect(() => {
    if (replyTo) area.current?.focus()
  }, [replyTo])

  const quickQuery = text.startsWith('/') ? text.slice(1).toLowerCase() : null
  const quickMatches = useMemo(() => {
    const list = quickData?.data || []
    if (quickQuery === null) return list
    return list.filter((q) => q.title.toLowerCase().includes(quickQuery) || q.text.toLowerCase().includes(quickQuery))
  }, [quickData, quickQuery])
  const showQuick = (quickOpen || quickQuery !== null) && !note

  const insertQuick = (value: string) => {
    setText(value)
    setQuickOpen(false)
    setQuickIndex(0)
    requestAnimationFrame(() => area.current?.focus())
  }

  const pickFile = (f: File | undefined) => {
    if (!f) return
    if (f.size > MAX_FILE) return toast.error('Files can be up to 16 MB.')
    setFile(f)
    setNote(false)
  }

  const submit = async () => {
    const body = text.trim()
    let payload: Parameters<typeof send>[0]['body']
    if (note) {
      if (!body) return
      payload = { type: 'note', text: body }
    } else if (file) {
      const fd = new FormData()
      fd.append('file', file)
      if (body) fd.append('caption', body)
      if (replyTo) fd.append('reply_to', replyTo.id)
      payload = fd
    } else {
      if (!body) return
      payload = { type: 'text', text: body, reply_to: replyTo?.id || null }
    }

    const restore = { text, file }
    setText('')
    setFile(null)
    onClearReply()
    try {
      await send({ id: conversationId, body: payload }).unwrap()
    } catch (err) {
      const status = (err as { status?: number })?.status
      if (status !== 502) {
        setText(restore.text)
        setFile(restore.file)
      }
      toast.error(apiMessage(err, 'Could not send the message'))
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showQuick && quickMatches.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setQuickIndex((i) => (i + 1) % quickMatches.length); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setQuickIndex((i) => (i - 1 + quickMatches.length) % quickMatches.length); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertQuick(quickMatches[Math.min(quickIndex, quickMatches.length - 1)].text); return }
    }
    if (e.key === 'Escape') setQuickOpen(false)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  if (!canReply) {
    return <div className="border-t border-input-border-color px-4 py-3 text-center text-xs text-subtitle-color">You can read this chat but your role can&apos;t reply.</div>
  }

  const closed = !windowOpen && !note

  return (
    <div className={cn('border-t border-input-border-color p-3 transition-colors', note && 'bg-amber-50/60 dark:bg-amber-500/5')}>
      {replyTo && !note && (
        <div className="mb-2 flex items-center gap-2 rounded-md border-l-2 border-primary bg-primary/5 px-2.5 py-1.5 text-xs">
          <Reply className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-subtitle-color">
            Replying to <b className="text-title">{replyTo.direction === 'inbound' ? 'customer' : 'your message'}</b>: {replyTo.text || replyTo.media?.filename || replyTo.type}
          </span>
          <button type="button" onClick={onClearReply} aria-label="Cancel reply" className="text-subtitle-color hover:text-title"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {closed ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-input-border-color bg-input-color/50 p-4 text-center sm:flex-row sm:text-left">
          <Clock className="h-6 w-6 shrink-0 text-amber-500" />
          <p className="flex-1 text-xs text-subtitle-color">
            <b className="block text-sm text-title">The 24-hour reply window has closed</b>
            WhatsApp only allows an approved template until the customer writes again.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setNote(true)} className="gap-1"><StickyNote /> Note</Button>
            <Button type="button" size="sm" onClick={() => setShowTemplates(true)} className="gap-1"><ScrollText /> Send template</Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {showQuick && (
            <div className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-64 overflow-y-auto rounded-lg border border-input-border-color bg-bg-card shadow-lg">
              <div className="flex items-center justify-between border-b border-input-border-color px-3 py-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-subtitle-color">Quick replies</span>
                <button type="button" onClick={() => { setQuickOpen(false); setManageQuick(true) }} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                  <Settings2 className="h-3 w-3" /> Manage
                </button>
              </div>
              {quickMatches.length === 0 ? (
                <p className="px-3 py-3 text-xs text-subtitle-color">{quickData?.data?.length ? 'No quick reply matches.' : 'No quick replies yet. Click Manage to add some.'}</p>
              ) : (
                quickMatches.map((q, i) => (
                  <button
                    key={`${q.title}-${i}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertQuick(q.text)}
                    className={cn('block w-full px-3 py-2 text-left hover:bg-primary/5', i === quickIndex && 'bg-primary/5')}
                  >
                    <span className="block text-xs font-semibold text-title">/{q.title}</span>
                    <span className="block truncate text-xs text-subtitle-color">{q.text}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {file && (
            <div className="mb-2 flex items-center gap-3 rounded-lg border border-input-border-color bg-input-color p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {preview ? <img src={preview} alt="" className="h-12 w-12 rounded object-cover" /> : <FileText className="h-8 w-8 text-primary" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-title">{file.name}</span>
                <span className="text-[11px] text-subtitle-color">{fileSize(file.size)} · the text below is sent as the caption</span>
              </span>
              <button type="button" onClick={() => setFile(null)} aria-label="Remove file" className="rounded p-1 text-subtitle-color hover:text-destructive"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className={cn('flex items-end gap-2 rounded-xl border bg-bg-card px-2 py-1.5 transition-colors focus-within:border-primary', note ? 'border-amber-300 dark:border-amber-500/40' : 'border-input-border-color')}>
            {!note && (
              <>
                <button type="button" onClick={() => fileInput.current?.click()} aria-label="Attach a file" title="Attach a file" className="mb-1 rounded-full p-1.5 text-subtitle-color hover:bg-input-color hover:text-title">
                  <Paperclip className="h-4.5 w-4.5" />
                </button>
                <button type="button" onClick={() => setQuickOpen((o) => !o)} aria-label="Quick replies" title="Quick replies (/)" className={cn('mb-1 rounded-full p-1.5 hover:bg-input-color', showQuick ? 'text-primary' : 'text-subtitle-color hover:text-title')}>
                  <Zap className="h-4.5 w-4.5" />
                </button>
              </>
            )}
            <input ref={fileInput} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
            <textarea
              ref={area}
              rows={1}
              value={text}
              onChange={(e) => { setText(e.target.value); setQuickIndex(0) }}
              onKeyDown={onKeyDown}
              onPaste={(e) => { const f = e.clipboardData.files?.[0]; if (f && !note) { e.preventDefault(); pickFile(f) } }}
              placeholder={note ? 'Write a note for your team (the customer won\'t see it)…' : file ? 'Add a caption…' : 'Type a message. "/" for quick replies'}
              aria-label={note ? 'Internal note' : 'Message'}
              className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-title outline-none placeholder:text-subtitle-color/70"
            />
            <Button type="submit" size="icon" onClick={submit} disabled={sending || (!text.trim() && !(file && !note))} aria-label={note ? 'Save note' : 'Send'} className={cn('mb-0.5 rounded-full', note && 'bg-amber-500 hover:bg-amber-500/90')}>
              {sending ? <Loader2 className="animate-spin" /> : note ? <StickyNote /> : <Send />}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 text-[11px] text-subtitle-color">
        <button
          type="button"
          onClick={() => setNote((n) => !n)}
          aria-pressed={note}
          className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold transition-colors', note ? 'border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200' : 'border-input-border-color hover:text-title')}
        >
          <StickyNote className="h-3 w-3" /> {note ? 'Writing a note' : 'Note'}
        </button>
        {windowOpen && (
          <button type="button" onClick={() => setShowTemplates(true)} className="inline-flex items-center gap-1 rounded-full border border-input-border-color px-2 py-0.5 font-semibold hover:text-title">
            <ScrollText className="h-3 w-3" /> Template
          </button>
        )}
        <span className="ml-auto hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
      </div>

      <TemplateDialog open={showTemplates} onClose={() => setShowTemplates(false)} conversationId={conversationId} wabaId={wabaId} customerName={customerName} />
      <QuickRepliesDialog open={manageQuick} onClose={() => setManageQuick(false)} />
    </div>
  )
}

export default Composer

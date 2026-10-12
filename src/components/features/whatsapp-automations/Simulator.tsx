'use client'

import { cn } from '@/lib/utils'
import { useSimulateWaFlowMutation } from '@/redux/api/whatsappAutomationApi'
import { SimMessage, SimResult, WhatsappFlow } from '@/types/whatsappAutomation'
import { getMediaUrl } from '@/utils/auth'
import { ChevronDown, ListChecks, Paperclip, RotateCcw, SendHorizontal, Variable, X } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

type Definition = Pick<WhatsappFlow, 'nodes' | 'edges' | 'trigger' | 'settings'>
type Entry = { kind: 'customer'; text: string; at: string } | { kind: 'bot'; msg: SimMessage; at: string } | { kind: 'error'; text: string }
type ListMsg = Extract<SimMessage, { type: 'list' }>

const STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: 'Waiting for the customer', tone: 'bg-sky-500/10 text-sky-600' },
  completed: { label: 'Flow finished', tone: 'bg-emerald-500/10 text-emerald-600' },
  handed_off: { label: 'Handed over to the team', tone: 'bg-amber-500/10 text-amber-600' },
  failed: { label: 'Failed', tone: 'bg-destructive/10 text-destructive' },
  stopped: { label: 'Stopped', tone: 'bg-zinc-500/10 text-zinc-500' },
  timed_out: { label: 'Timed out', tone: 'bg-zinc-500/10 text-zinc-500' },
}
const WAITING: Record<string, string> = { reply: 'a tap on an option', input: 'an answer', slot: 'a time slot', ai_chat: 'a question for the AI', delay: 'the wait to end' }

const time = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

// Tries the flow as currently drawn, in a WhatsApp-like chat. Nothing is sent to WhatsApp.
const Simulator = ({ flowId, flowName, firstKeyword, getDefinition, onActiveNode, onClose }: {
  flowId: string
  flowName: string
  firstKeyword: string
  getDefinition: () => Definition
  onActiveNode: (id: string | null) => void
  onClose: () => void
}) => {
  const [simulate, { isLoading }] = useSimulateWaFlowMutation()
  const [entries, setEntries] = useState<Entry[]>([])
  const [result, setResult] = useState<SimResult | null>(null)
  const [input, setInput] = useState(firstKeyword)
  const [sheet, setSheet] = useState<ListMsg | null>(null)
  const [showVars, setShowVars] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries, isLoading])

  useEffect(() => () => onActiveNode(null), [onActiveNode])

  const running = result?.status === 'active'

  const send = async (text: string, interactiveId?: string) => {
    if (!text.trim() || isLoading) return
    setEntries((e) => [...e, { kind: 'customer', text, at: time() }])
    setInput('')
    setSheet(null)
    try {
      const res = await simulate({ id: flowId, run_id: running ? result?.run_id : null, text, interactive_id: interactiveId || null, definition: getDefinition() }).unwrap()
      const r = res.data
      setResult(r)
      setEntries((e) => [...e, ...r.messages.map((msg) => ({ kind: 'bot' as const, msg, at: time() }))])
      onActiveNode(r.status === 'active' ? r.current_node_id : null)
    } catch (err) {
      setEntries((e) => [...e, { kind: 'error', text: (err as { data?: { message?: string } })?.data?.message || 'The test could not run.' }])
    }
  }

  const restart = () => {
    setEntries([])
    setResult(null)
    setInput(firstKeyword)
    onActiveNode(null)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
  }

  // Only the last interactive message can be tapped, like on a phone.
  const lastInteractive = (() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      const en = entries[i]
      if (en.kind === 'customer') return -1
      if (en.kind === 'bot' && (en.msg.type === 'buttons' || en.msg.type === 'list')) return i
    }
    return -1
  })()

  const vars = Object.entries(result?.vars || {}).filter(([k]) => k !== 'last_message')

  return (
    <aside className="relative flex h-full w-[360px] shrink-0 flex-col border-l border-input-border-color bg-bg-card">
      <div className="flex items-center gap-3 bg-[#075E54] px-3 py-2.5 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">{(flowName || 'T').charAt(0).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{flowName || 'Test chat'}</p>
          <p className="text-[11px] text-white/70">Test chat · nothing is sent to WhatsApp</p>
        </div>
        <button type="button" onClick={restart} aria-label="Restart test" title="Restart" className="rounded-full p-1.5 hover:bg-white/15"><RotateCcw className="w-4 h-4" /></button>
        <button type="button" onClick={onClose} aria-label="Close test" className="rounded-full p-1.5 hover:bg-white/15"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#ECE5DD] dark:bg-[#0b141a] px-3 py-3 space-y-2">
        {entries.length === 0 && (
          <div className="mx-auto mt-6 max-w-[260px] rounded-lg bg-[#FFF5C4] dark:bg-[#182229] px-3 py-2 text-center text-[11px] text-zinc-600 dark:text-zinc-300 shadow-sm">
            Type a message as the customer would. The test uses the flow as drawn now, including unsaved changes. Webhooks and AI replies run for real; bookings, calls and contact changes are only simulated.
          </div>
        )}
        {entries.map((en, i) => {
          if (en.kind === 'customer') {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-lg rounded-tr-none bg-[#DCF8C6] dark:bg-[#005c4b] px-2.5 py-1.5 text-[13px] text-zinc-800 dark:text-zinc-100 shadow-sm whitespace-pre-wrap break-words">
                  {en.text}
                  <span className="ml-2 align-bottom text-[10px] text-zinc-500 dark:text-zinc-300/70">{en.at}</span>
                </div>
              </div>
            )
          }
          if (en.kind === 'error') {
            return <p key={i} className="mx-auto w-fit rounded-md bg-destructive/10 px-2 py-1 text-[11px] text-destructive">{en.text}</p>
          }
          const m = en.msg
          if (m.type === 'note') {
            return <p key={i} className="mx-auto w-fit max-w-[90%] rounded-md bg-white/70 dark:bg-white/5 px-2 py-1 text-center text-[11px] italic text-zinc-500 dark:text-zinc-400">{m.text}</p>
          }
          const tappable = i === lastInteractive && running
          return (
            <div key={i} className="flex flex-col items-start gap-1 max-w-[85%]">
              <div className="w-full rounded-lg rounded-tl-none bg-white dark:bg-[#202c33] px-2.5 py-1.5 text-[13px] text-zinc-800 dark:text-zinc-100 shadow-sm">
                {m.type === 'media' && (
                  m.media.type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getMediaUrl(m.media.url)} alt="" className="mb-1 max-h-40 w-full rounded object-cover" />
                  ) : (
                    <p className="mb-1 flex items-center gap-1 rounded bg-zinc-100 dark:bg-white/5 px-2 py-1.5 text-xs"><Paperclip className="w-3.5 h-3.5" /> {m.media.filename || m.media.type}</p>
                  )
                )}
                {(m.type === 'buttons' || m.type === 'list') && m.header && <p className="font-semibold mb-0.5">{m.header}</p>}
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                {(m.type === 'buttons' || m.type === 'list') && m.footer && <p className="mt-0.5 text-[11px] text-zinc-500">{m.footer}</p>}
                <p className="text-right text-[10px] text-zinc-400 flex items-center justify-end gap-1">
                  {m.type === 'text' && m.sender === 'ai' && <span className="rounded bg-fuchsia-500/10 px-1 text-fuchsia-600 font-semibold">AI</span>}
                  {en.at}
                </p>
              </div>
              {m.type === 'buttons' && (
                <div className="flex w-full flex-col gap-1">
                  {m.buttons.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      disabled={!tappable || isLoading}
                      onClick={() => send(b.title, b.id)}
                      className="w-full rounded-lg bg-white dark:bg-[#202c33] py-1.5 text-[13px] font-medium text-[#027EB5] dark:text-[#53bdeb] shadow-sm enabled:hover:bg-zinc-50 disabled:opacity-60"
                    >
                      {b.title}
                    </button>
                  ))}
                </div>
              )}
              {m.type === 'list' && (
                <button
                  type="button"
                  disabled={!tappable || isLoading}
                  onClick={() => setSheet(m)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white dark:bg-[#202c33] py-1.5 text-[13px] font-medium text-[#027EB5] dark:text-[#53bdeb] shadow-sm enabled:hover:bg-zinc-50 disabled:opacity-60"
                >
                  <ListChecks className="w-4 h-4" /> {m.button_label || 'Choose'}
                </button>
              )}
            </div>
          )
        })}
        {isLoading && (
          <div className="flex w-14 items-center justify-center gap-1 rounded-lg rounded-tl-none bg-white dark:bg-[#202c33] px-3 py-2.5 shadow-sm">
            {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {result && (
        <div className="border-t border-input-border-color px-3 py-2 space-y-1.5 bg-bg-card">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS[result.status]?.tone)}>
              {STATUS[result.status]?.label || result.status}
              {result.status === 'active' && result.waiting ? ` · ${WAITING[result.waiting] || result.waiting}` : ''}
            </span>
            {vars.length > 0 && (
              <button type="button" onClick={() => setShowVars((s) => !s)} className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                <Variable className="w-3.5 h-3.5" /> {vars.length} saved <ChevronDown className={cn('w-3 h-3 transition-transform', showVars && 'rotate-180')} />
              </button>
            )}
          </div>
          {result.status !== 'active' && <p className="text-[11px] text-subtitle-color">Send another message to test again from the start.</p>}
          {showVars && vars.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-md bg-primary/[0.04] p-2 font-mono text-[11px]">
              {vars.map(([k, v]) => (
                <p key={k} className="truncate"><span className="text-primary">{k}</span> = {typeof v === 'object' ? JSON.stringify(v) : String(v)}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-input-border-color bg-[#F0F0F0] dark:bg-[#202c33] px-2 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={running ? 'Reply as the customer…' : 'Message as the customer…'}
          className="flex-1 rounded-full bg-white dark:bg-[#2a3942] px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100 outline-none"
          aria-label="Customer message"
        />
        <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00A884] text-white disabled:opacity-50">
          <SendHorizontal className="w-4 h-4" />
        </button>
      </form>
      {/* Room for the floating assistant button, which sits over this corner. */}
      <div className="h-16 shrink-0 bg-[#F0F0F0] dark:bg-[#202c33]" aria-hidden />

      {sheet && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/40" onClick={() => setSheet(null)}>
          <div className="max-h-[70%] overflow-y-auto rounded-t-2xl bg-white dark:bg-[#111b21] p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-300" />
            <p className="text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">{sheet.button_label || 'Choose'}</p>
            {sheet.sections.map((s, si) => (
              <div key={si} className="mb-2">
                {s.title && <p className="px-1 pb-1 text-[11px] font-semibold uppercase text-[#00A884]">{s.title}</p>}
                {s.rows.map((r) => (
                  <button key={r.id} type="button" onClick={() => send(r.title, r.id)} className="w-full rounded-lg px-2 py-2 text-left hover:bg-zinc-100 dark:hover:bg-white/5">
                    <span className="block text-sm text-zinc-800 dark:text-zinc-100">{r.title}</span>
                    {r.description && <span className="block text-[11px] text-zinc-500">{r.description}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

export default Simulator

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textArea'
import { ROUTES } from '@/constants/routes'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'
import { useGetWaAiSettingsQuery, useGetWaBuilderOptionsQuery, useSaveWaAiSettingsMutation, useTestWaAiMutation } from '@/redux/api/whatsappAutomationApi'
import { WaAiSettings } from '@/types/whatsappAutomation'
import { AlertTriangle, Bot, Loader2, RotateCcw, Save, SendHorizontal, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { BuilderContext } from './BuilderContext'
import { ChipsInput, MultiPick } from './fields'

type Form = Omit<WaAiSettings, 'model'>
const pick = (s: WaAiSettings): Form => ({
  enabled: !!s.enabled,
  instructions: s.instructions || '',
  knowledge_base_ids: (s.knowledge_base_ids || []).map(String),
  max_replies: s.max_replies || 10,
  handoff_keywords: s.handoff_keywords || [],
  handoff_message: s.handoff_message || '',
})

const TryIt = () => {
  const [test, { isLoading }] = useTestWaAiMutation()
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const send = async (e: FormEvent) => {
    e.preventDefault()
    const message = input.trim()
    if (!message || isLoading) return
    setInput('')
    setError(null)
    const before = history
    setHistory([...before, { role: 'user', content: message }])
    try {
      const res = await test({ message, history: before }).unwrap()
      setHistory((h) => [...h, { role: 'assistant', content: res.data.reply || '(no reply)' }])
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message || 'The AI could not answer.')
    }
  }
  return (
    <div className="flex h-[460px] flex-col rounded-lg border border-input-border-color bg-bg-card overflow-hidden">
      <div className="flex items-center gap-2 bg-[#075E54] px-3 py-2.5 text-white">
        <Bot className="w-4 h-4" />
        <p className="flex-1 text-sm font-semibold">Try the AI</p>
        <button type="button" onClick={() => { setHistory([]); setError(null) }} aria-label="Clear chat" className="rounded-full p-1 hover:bg-white/15"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#ECE5DD] dark:bg-[#0b141a] p-3 space-y-2">
        {history.length === 0 && <p className="mx-auto mt-4 max-w-[240px] rounded-lg bg-[#FFF5C4] dark:bg-[#182229] px-3 py-2 text-center text-[11px] text-zinc-600 dark:text-zinc-300">Ask what a customer would. This uses your saved settings, so save changes first.</p>}
        {history.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <p className={cn('max-w-[85%] rounded-lg px-2.5 py-1.5 text-[13px] shadow-sm whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-100', m.role === 'user' ? 'rounded-tr-none bg-[#DCF8C6] dark:bg-[#005c4b]' : 'rounded-tl-none bg-white dark:bg-[#202c33]')}>{m.content}</p>
          </div>
        ))}
        {isLoading && <p className="w-fit rounded-lg bg-white dark:bg-[#202c33] px-3 py-1.5 text-xs text-zinc-500">Typing…</p>}
        {error && <p className="mx-auto w-fit max-w-[90%] rounded-md bg-destructive/10 px-2 py-1 text-center text-[11px] text-destructive">{error}</p>}
      </div>
      <form onSubmit={send} className="flex items-center gap-2 border-t border-input-border-color bg-[#F0F0F0] dark:bg-[#202c33] px-2 py-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Do you deliver to Mysuru?" aria-label="Test message" className="flex-1 rounded-full bg-white dark:bg-[#2a3942] px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100 outline-none" />
        <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00A884] text-white disabled:opacity-50"><SendHorizontal className="w-4 h-4" /></button>
      </form>
    </div>
  )
}

const AiForm = ({ initial, model }: { initial: Form; model: WaAiSettings['model'] }) => {
  const { hasPermission, isAdmin } = usePermission()
  const canEdit = isAdmin() || hasPermission(PERMISSIONS.UPDATE_WHATSAPP_AUTOMATION)
  const { data: options } = useGetWaBuilderOptionsQuery()
  const [save, { isLoading }] = useSaveWaAiSettingsMutation()
  const [form, setForm] = useState<Form>(initial)
  const [saved, setSaved] = useState(JSON.stringify(initial))
  const dirty = JSON.stringify(form) !== saved
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  const submit = async () => {
    try {
      await save(form).unwrap()
      setSaved(JSON.stringify(form))
      toast.success(form.enabled ? 'AI auto-reply is on' : 'AI settings saved')
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not save the AI settings')
    }
  }

  return (
    <BuilderContext.Provider value={{ variables: [], errorsByNode: {}, warningsByNode: {}, activeNodeId: null, trigger: { type: 'keyword', keywords: [], match: 'contains' } }}>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="rounded-lg border border-input-border-color bg-bg-card">
          <div className="flex items-start justify-between gap-4 border-b border-input-border-color p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-600"><Sparkles className="w-5 h-5" /></span>
              <div>
                <h3 className="text-base font-semibold text-title">AI auto-reply</h3>
                <p className="mt-0.5 max-w-xl text-sm text-subtitle-color">
                  When no automation matches a message, the AI answers using your instructions and knowledge bases. When it&apos;s off, messages just wait in the inbox for your team.
                </p>
              </div>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(enabled) => set({ enabled })} disabled={!canEdit} aria-label="AI auto-reply" />
          </div>

          <div className="space-y-5 p-5">
            {!model ? (
              <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>No AI model is set up for your account, so the AI can&apos;t reply yet. <Link href={ROUTES.SETTINGS} className="font-semibold underline">Choose an AI model and add its API key in Settings</Link>.</p>
              </div>
            ) : (
              <p className="text-xs text-subtitle-color">AI model: <b className="text-title">{model.name}</b> ({model.provider}) · free during the beta</p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ai-instructions" className="text-xs font-semibold text-subtitle-color">Instructions</Label>
              <Textarea id="ai-instructions" rows={6} value={form.instructions} onChange={(e) => set({ instructions: e.target.value })} disabled={!canEdit} className="bg-input-color border-input-border-color text-sm" placeholder="You are the assistant for Sri Sai Motors, Bengaluru. Answer questions about our cars, prices and test drives…" />
              <p className="text-[11px] text-subtitle-color">Who the AI is, what it may promise, and when to send people to the team. It always replies briefly and in the customer&apos;s language.</p>
            </div>

            <MultiPick
              label="Knowledge bases"
              values={form.knowledge_base_ids}
              onChange={(knowledge_base_ids) => set({ knowledge_base_ids })}
              options={options?.data?.knowledge_bases || []}
              empty={<>No knowledge bases yet. <Link href={ROUTES.KNOWLEDGE_BASE} className="text-primary hover:underline">Upload your price list, FAQs or brochure</Link>.</>}
              hint="The AI only states prices, offers and policies found here."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ai-max" className="text-xs font-semibold text-subtitle-color">Hand over after this many AI replies in a chat</Label>
                <Input id="ai-max" type="number" min={1} max={100} value={form.max_replies} onChange={(e) => set({ max_replies: Number(e.target.value) || 1 })} disabled={!canEdit} className="h-10 bg-input-color border-input-border-color" />
              </div>
              <ChipsInput label="Words that hand over to a person" values={form.handoff_keywords} onChange={(handoff_keywords) => set({ handoff_keywords })} placeholder="agent, human" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-handoff" className="text-xs font-semibold text-subtitle-color">Message when handing over</Label>
              <Input id="ai-handoff" value={form.handoff_message} onChange={(e) => set({ handoff_message: e.target.value })} disabled={!canEdit} className="h-10 bg-input-color border-input-border-color" />
            </div>

            <p className="text-[11px] text-subtitle-color">The AI stays quiet in a chat once a team member replies, until the chat is resolved or the bot is resumed from the inbox.</p>
          </div>

          {canEdit && (
            <div className="flex items-center justify-end gap-3 border-t border-input-border-color px-5 py-3">
              {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
              <Button type="button" onClick={submit} disabled={isLoading || !dirty} className="text-white gap-1.5">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </Button>
            </div>
          )}
        </div>
        <TryIt />
      </div>
    </BuilderContext.Provider>
  )
}

const AiSettingsTab = () => {
  const { data, isLoading } = useGetWaAiSettingsQuery(undefined, { refetchOnMountOrArgChange: true })
  if (isLoading || !data?.data) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-subtitle-color" /></div>
  return <AiForm initial={pick(data.data)} model={data.data.model} />
}

export default AiSettingsTab

'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useGetWaTemplatesQuery, useSendWaMessageMutation } from '@/redux/api/whatsappInboxApi'
import { WaTemplate } from '@/types/whatsappInbox'
import { ArrowLeft, Loader2, ScrollText, Search, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { apiMessage } from './helpers'

const fill = (body: string, values: string[]) =>
  body.replace(/\{\{(\d+)\}\}/g, (match, n) => values[Number(n) - 1]?.trim() || match)

interface TemplateDialogProps {
  open: boolean
  onClose: () => void
  conversationId: string
  wabaId: string | null
  customerName: string
}

const TemplateDialog = ({ open, onClose, conversationId, wabaId, customerName }: TemplateDialogProps) => {
  const { data, isLoading } = useGetWaTemplatesQuery(undefined, { skip: !open })
  const [send, { isLoading: sending }] = useSendWaMessageMutation()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<WaTemplate | null>(null)
  const [values, setValues] = useState<string[]>([])
  const [buttons, setButtons] = useState<Record<number, string>>({})

  const templates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.data || [])
      .filter((t) => !wabaId || t.waba_id === wabaId)
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q))
  }, [data, query, wabaId])

  const pick = (t: WaTemplate) => {
    setPicked(t)
    setValues(Array.from({ length: t.body_variables }, (_, i) => (i === 0 ? customerName : '')))
    setButtons({})
  }

  const close = () => {
    setPicked(null)
    setQuery('')
    onClose()
  }

  const missing = picked ? values.some((v) => !v.trim()) || picked.url_buttons.some((i) => !buttons[i]?.trim()) : true

  const submit = async () => {
    if (!picked) return
    try {
      await send({ id: conversationId, body: { type: 'template', template_id: picked.id, body_values: values.map((v) => v.trim()), button_values: buttons } }).unwrap()
      toast.success('Template sent')
      close()
    } catch (err) {
      toast.error(apiMessage(err, 'Could not send the template'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-xl p-6!">
        <DialogHeader className="mb-0!">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {picked && (
              <button type="button" onClick={() => setPicked(null)} aria-label="Back to templates" className="rounded-full p-1 hover:bg-input-color">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {picked ? picked.name : 'Send a template'}
          </DialogTitle>
          <DialogDescription>
            {picked ? 'Fill in the blanks. The customer sees the message exactly as previewed.' : 'WhatsApp only allows approved templates once 24 hours have passed since the customer\'s last message.'}
          </DialogDescription>
        </DialogHeader>

        {!picked ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtitle-color" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" className="h-9 pl-9 bg-input-color border-input-border-color text-sm" />
            </div>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex justify-center py-8 text-subtitle-color"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : templates.length === 0 ? (
                <p className="py-8 text-center text-sm text-subtitle-color">
                  {data?.data?.length ? 'No templates match.' : 'No approved templates yet. Create one under WhatsApp Templates and wait for Meta to approve it.'}
                </p>
              ) : (
                templates.map((t) => (
                  <button key={t.id} type="button" onClick={() => pick(t)} className="w-full rounded-lg border border-input-border-color p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5">
                    <span className="flex items-center gap-2">
                      <ScrollText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate text-sm font-semibold text-title">{t.name}</span>
                      <span className="ml-auto shrink-0 rounded-full bg-input-color px-2 py-px text-[10px] font-semibold uppercase text-subtitle-color">{t.category} · {t.language}</span>
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs text-subtitle-color">{t.body}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-subtitle-color">Preview</p>
              <p className="whitespace-pre-wrap text-sm text-title">{fill(picked.body, values)}</p>
            </div>
            {values.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {values.map((v, i) => (
                  <div key={i} className="space-y-1.5">
                    <Label htmlFor={`tpl-var-${i}`} className="text-xs font-semibold text-subtitle-color">{`{{${i + 1}}}`}</Label>
                    <Input
                      id={`tpl-var-${i}`}
                      value={v}
                      onChange={(e) => setValues(values.map((x, j) => (j === i ? e.target.value : x)))}
                      className={cn('h-9 bg-input-color border-input-border-color text-sm', !v.trim() && 'border-amber-400')}
                    />
                  </div>
                ))}
              </div>
            )}
            {picked.url_buttons.map((i) => (
              <div key={i} className="space-y-1.5">
                <Label htmlFor={`tpl-btn-${i}`} className="text-xs font-semibold text-subtitle-color">Link button {i + 1}: end of the URL</Label>
                <Input id={`tpl-btn-${i}`} value={buttons[i] || ''} onChange={(e) => setButtons({ ...buttons, [i]: e.target.value })} className="h-9 bg-input-color border-input-border-color text-sm" />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="button" onClick={submit} disabled={missing || sending} className="gap-1.5">
                {sending ? <Loader2 className="animate-spin" /> : <Send />} Send template
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default TemplateDialog

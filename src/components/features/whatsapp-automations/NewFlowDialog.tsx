'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { useCreateWaFlowMutation } from '@/redux/api/whatsappAutomationApi'
import { FlowTemplateInfo } from '@/types/whatsappAutomation'
import { Bot, CalendarCheck, FilePlus2, Loader2, MousePointerClick, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const ICONS: Record<string, typeof Bot> = {
  blank: FilePlus2,
  welcome_menu: MousePointerClick,
  lead_capture: UserPlus,
  ai_faq: Bot,
  book_appointment: CalendarCheck,
}

const NewFlowDialog = ({ open, onClose, templates }: { open: boolean; onClose: () => void; templates: FlowTemplateInfo[] }) => {
  const router = useRouter()
  const [create, { isLoading }] = useCreateWaFlowMutation()
  const [template, setTemplate] = useState('welcome_menu')
  const [name, setName] = useState('')
  const list = templates.length ? templates : [{ key: 'blank', name: 'New automation', description: '' }]

  const submit = async () => {
    try {
      const res = await create({ template, name: name.trim() || undefined }).unwrap()
      toast.success('Automation created. Edit it, test it, then go live.')
      router.push(`${ROUTES.WHATSAPP_AUTOMATIONS}/${res.data.id}`)
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message || 'Could not create the automation')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-w-[calc(100%-2rem)] bg-bg-card border-input-border-color">
        <DialogHeader>
          <DialogTitle className="text-title">New automation</DialogTitle>
          <DialogDescription>Start from a ready-made flow and adjust it, or from a blank canvas.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
          {list.map((t) => {
            const Icon = ICONS[t.key] || FilePlus2
            const on = template === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTemplate(t.key)}
                aria-pressed={on}
                className={cn('flex items-start gap-3 rounded-lg border p-3 text-left transition-colors', on ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.04]' : 'border-input-border-color hover:border-primary/40')}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', on ? 'bg-primary text-white' : 'bg-primary/10 text-primary')}><Icon className="w-4 h-4" /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-title">{t.key === 'blank' ? 'Blank' : t.name}</span>
                  <span className="block text-xs text-subtitle-color leading-snug">{t.description || 'Just a Start step.'}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="flow-name" className="text-xs font-semibold text-subtitle-color">Name (optional)</Label>
          <Input id="flow-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder={list.find((t) => t.key === template)?.name} className="h-10 bg-input-color border-input-border-color" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={submit} disabled={isLoading} className="gap-1.5">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />} Create and open
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NewFlowDialog

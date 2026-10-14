'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FlowSettings } from '@/types/flow'
import { Headset } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  settings: FlowSettings
  onChange: (next: FlowSettings) => void
  disabled?: boolean
}

// How calls on this workflow treat replies that aren't answers: "not
// interested", "call me later", side questions, or unclear words.
export function CallHandlingDialog({ settings, onChange, disabled }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="h-9 gap-1.5 rounded-radius border-input-border-color text-title" title={t('call_handling', 'Call handling')}>
          <Headset className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">{t('call_handling', 'Call handling')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]! max-w-[calc(100%-1.5rem)]! bg-bg-card border-none rounded-modal-radius">
        <DialogHeader className="text-left">
          <DialogTitle className="text-title">{t('call_handling', 'Call handling')}</DialogTitle>
          <DialogDescription className="text-subtitle-color">{t('call_handling_desc', 'Saved with the workflow.')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-md font-semibold text-title">{t('understand_replies', "Understand replies that aren't answers")}</Label>
              <p className="text-sm text-subtitle-color">{t('understand_replies_hint', 'For "not interested", "call me later", "hello?" or a side question, the agent responds like a person instead of repeating the question. Turn off to keep the old fixed script.')}</p>
            </div>
            <Switch checked={settings.understand_caller} onCheckedChange={(v) => onChange({ ...settings, understand_caller: v })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-md font-semibold text-title">{t('max_reasks', 'Re-ask an unclear answer up to')}</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={5} value={settings.max_reasks} disabled={!settings.understand_caller}
                onChange={(e) => onChange({ ...settings, max_reasks: Math.min(5, Math.max(0, Number(e.target.value) || 0)) })}
                className="h-10 w-20 bg-bg-card border-input-border-color" />
              <span className="text-sm text-subtitle-color">{t('times', 'times')}</span>
            </div>
            <p className="text-xs text-subtitle-color">{t('max_reasks_hint', 'After that the call ends politely and your team gets a task to call back.')}</p>
          </div>
        </div>
        <DialogFooter>
          <DialogTrigger asChild><Button className="bg-primary text-white">{t('call_handling_close', 'Done')}</Button></DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { fromLocalInput, toLocalInput } from '@/components/features/outcomes/format'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textArea'
import {
  useCallFollowUpNowMutation,
  useCancelFollowUpMutation,
  useCompleteFollowUpMutation,
  useUpdateFollowUpMutation,
} from '@/redux/api/outcomeApi'
import { FollowUpMode, FollowUpRow } from '@/types/outcomes'
import { CalendarClock, Check, Loader2, PhoneCall, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const errorMessage = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message || fallback

type Pending = 'reschedule' | 'done' | 'cancel' | null

// Call now (AI), reschedule, mark done or cancel one follow-up.
export default function FollowUpActions({ followUp, compact = false }: { followUp: FollowUpRow; compact?: boolean }) {
  const { t } = useTranslation()
  const [dialog, setDialog] = useState<Pending>(null)
  const [due, setDue] = useState('')
  const [mode, setMode] = useState<FollowUpMode>(followUp.mode)
  const [note, setNote] = useState('')
  const [callNow, { isLoading: calling }] = useCallFollowUpNowMutation()
  const [update, { isLoading: updating }] = useUpdateFollowUpMutation()
  const [complete, { isLoading: completing }] = useCompleteFollowUpMutation()
  const [cancel, { isLoading: cancelling }] = useCancelFollowUpMutation()

  const open = ['pending', 'in_progress'].includes(followUp.status)
  if (!open) return null
  const busy = followUp.status === 'in_progress'

  const openDialog = (kind: Pending) => {
    setNote('')
    setMode(followUp.mode)
    setDue(toLocalInput(new Date(followUp.due_at) > new Date() ? followUp.due_at : new Date(Date.now() + 3600000)))
    setDialog(kind)
  }

  const run = async (fn: () => Promise<{ message?: string }>, fallback: string) => {
    try {
      const res = await fn()
      toast.success(res.message || t('follow_up_saved', 'Follow-up updated'))
      setDialog(null)
    } catch (e) {
      toast.error(errorMessage(e, fallback))
    }
  }

  const iconButton = 'h-8 gap-1.5 border-input-border-color text-title'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {followUp.mode === 'ai_call' && !busy && (
        <Button variant="outline" size="sm" className={iconButton} disabled={calling}
          onClick={() => run(() => callNow(followUp.id).unwrap(), t('fu_call_failed', 'The call could not be placed'))}
          title={t('call_now_hint', 'The AI agent calls now')}>
          {calling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneCall className="h-3.5 w-3.5" />}
          {!compact && t('call_now', 'Call now')}
        </Button>
      )}
      {busy ? (
        <span className="text-xs font-semibold text-primary">{t('calling_now', 'Calling now…')}</span>
      ) : (
        <>
          <Button variant="outline" size="sm" className={iconButton} onClick={() => openDialog('reschedule')} title={t('reschedule', 'Reschedule')}>
            <CalendarClock className="h-3.5 w-3.5" />{!compact && t('reschedule', 'Reschedule')}
          </Button>
          <Button variant="outline" size="sm" className={iconButton} onClick={() => openDialog('done')} title={t('mark_done', 'Mark done')}>
            <Check className="h-3.5 w-3.5" />{!compact && t('mark_done', 'Mark done')}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-subtitle-color hover:text-destructive" onClick={() => openDialog('cancel')} title={t('cancel_follow_up', 'Cancel follow-up')}>
            <X className="h-3.5 w-3.5" />{!compact && t('cancel', 'Cancel')}
          </Button>
        </>
      )}

      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="sm:max-w-[440px]! max-w-[calc(100%-1.5rem)]! bg-bg-card border-none rounded-modal-radius">
          <DialogHeader className="text-left">
            <DialogTitle className="text-title">
              {dialog === 'reschedule' ? t('reschedule_follow_up', 'Reschedule follow-up') : dialog === 'done' ? t('mark_follow_up_done', 'Mark follow-up as done') : t('cancel_follow_up', 'Cancel follow-up')}
            </DialogTitle>
            <DialogDescription className="text-subtitle-color">{followUp.name || followUp.phone}</DialogDescription>
          </DialogHeader>

          {dialog === 'reschedule' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-title">{t('when_india_time', 'When (India time)')}</Label>
                <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="h-10 bg-bg-card border-input-border-color" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-title">{t('who_follows_up', 'Who follows up')}</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as FollowUpMode)}>
                  <SelectTrigger className="h-10 bg-bg-card border-input-border-color text-title rounded-radius"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai_call">{t('fu_mode_ai', 'The AI agent calls')}</SelectItem>
                    <SelectItem value="team">{t('fu_mode_team', 'My team')}</SelectItem>
                  </SelectContent>
                </Select>
                {mode === 'ai_call' && <p className="text-xs text-subtitle-color">{t('calling_hours_hint', 'AI calls are only placed within calling hours (10 AM – 9 PM).')}</p>}
              </div>
            </div>
          )}
          {dialog !== 'reschedule' && (
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('note_optional', 'Note (optional)')} className="min-h-20 bg-bg-card border-input-border-color" />
          )}

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" className="border-input-border-color" onClick={() => setDialog(null)}>{t('close', 'Close')}</Button>
            {dialog === 'reschedule' && (
              <Button className="bg-primary text-white" disabled={!due || updating}
                onClick={() => run(() => update({ id: followUp.id, due_at: fromLocalInput(due), mode }).unwrap(), t('reschedule_failed', 'Could not reschedule'))}>
                {updating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('save', 'Save')}
              </Button>
            )}
            {dialog === 'done' && (
              <Button className="bg-primary text-white" disabled={completing}
                onClick={() => run(() => complete({ id: followUp.id, note: note.trim() || undefined }).unwrap(), t('update_failed', 'Could not update'))}>
                {completing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('mark_done', 'Mark done')}
              </Button>
            )}
            {dialog === 'cancel' && (
              <Button variant="destructive" disabled={cancelling}
                onClick={() => run(() => cancel({ id: followUp.id, note: note.trim() || undefined }).unwrap(), t('update_failed', 'Could not update'))}>
                {cancelling && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('cancel_follow_up', 'Cancel follow-up')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

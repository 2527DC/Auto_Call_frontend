'use client'

import { fromLocalInput, toLocalInput } from '@/components/features/outcomes/format'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { CalendarClock, Check, Loader2, MoreHorizontal, Phone, PhoneCall, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const errorMessage = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message || fallback

type Pending = 'reschedule' | 'done' | 'cancel' | null

// One main action (AI callback: Call now; team task: Mark done), the rest in
// a menu: reschedule, call the person yourself, mark done, cancel.
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

  const item = 'cursor-pointer flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-title'
  const ai = followUp.mode === 'ai_call'
  return (
    <div className="flex items-center gap-1.5">
      {busy ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-primary"><Loader2 className="h-3.5 w-3.5 animate-spin" />{t('calling_now', 'Calling now…')}</span>
      ) : ai ? (
        <Button size="sm" className="h-8 gap-1.5 bg-primary text-white" disabled={calling}
          onClick={() => run(() => callNow(followUp.id).unwrap(), t('fu_call_failed', 'The call could not be placed'))}
          title={t('call_now_hint', 'The AI agent calls now')}>
          {calling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneCall className="h-3.5 w-3.5" />}
          {compact ? t('ai_call_now', 'AI call now') : t('call_now', 'Call now')}
        </Button>
      ) : (
        <Button size="sm" className="h-8 gap-1.5 bg-primary text-white" onClick={() => openDialog('done')}>
          <Check className="h-3.5 w-3.5" />{t('mark_done', 'Mark done')}
        </Button>
      )}
      {!busy && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-input-border-color text-title" aria-label={t('more_actions', 'More actions')}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-lg border border-input-border-color bg-bg-card p-1.5 shadow-xl!">
            <DropdownMenuItem className={item} onClick={() => openDialog('reschedule')}><CalendarClock className="h-4 w-4" />{t('reschedule', 'Reschedule')}</DropdownMenuItem>
            {followUp.phone && (
              <DropdownMenuItem className={item} asChild>
                <a href={`tel:${followUp.phone}`}><Phone className="h-4 w-4" />{t('call_them_yourself', 'Call them yourself')}</a>
              </DropdownMenuItem>
            )}
            {ai && <DropdownMenuItem className={item} onClick={() => openDialog('done')}><Check className="h-4 w-4" />{t('mark_done', 'Mark done')}</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem className={`${item} text-destructive focus:text-destructive`} onClick={() => openDialog('cancel')}><X className="h-4 w-4" />{t('cancel_follow_up', 'Cancel follow-up')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

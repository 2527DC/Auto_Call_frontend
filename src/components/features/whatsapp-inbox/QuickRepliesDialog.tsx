'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textArea'
import { useGetWaQuickRepliesQuery, useSaveWaQuickRepliesMutation } from '@/redux/api/whatsappInboxApi'
import { WaQuickReply } from '@/types/whatsappInbox'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { apiMessage } from './helpers'

const QuickRepliesDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { data } = useGetWaQuickRepliesQuery(undefined, { skip: !open })
  const [save, { isLoading: saving }] = useSaveWaQuickRepliesMutation()
  const [editing, setEditing] = useState<{ index: number | null; title: string; text: string } | null>(null)
  const list = data?.data || []

  const persist = async (next: WaQuickReply[], done: string) => {
    try {
      await save(next.map(({ title, text }) => ({ title, text }))).unwrap()
      toast.success(done)
      setEditing(null)
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save quick replies'))
    }
  }

  const submit = () => {
    if (!editing || !editing.title.trim() || !editing.text.trim()) return
    const item = { title: editing.title.trim(), text: editing.text.trim() }
    const next = editing.index === null ? [...list, item] : list.map((q, i) => (i === editing.index ? item : q))
    persist(next, editing.index === null ? 'Quick reply added' : 'Quick reply updated')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && (setEditing(null), onClose())}>
      <DialogContent className="max-w-lg p-6!">
        <DialogHeader className="mb-0!">
          <DialogTitle className="text-lg">Quick replies</DialogTitle>
          <DialogDescription>Saved answers your team can insert by typing &quot;/&quot; in the message box.</DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="space-y-3">
            <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Short name, e.g. Opening hours" maxLength={60} className="h-9 bg-input-color border-input-border-color text-sm" autoFocus />
            <Textarea value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} placeholder="The message to insert" rows={5} maxLength={1024} className="text-sm" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="button" onClick={submit} disabled={saving || !editing.title.trim() || !editing.text.trim()} className="gap-1.5">
                {saving && <Loader2 className="animate-spin" />} Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {list.length === 0 && <p className="py-6 text-center text-sm text-subtitle-color">No quick replies yet.</p>}
              {list.map((q, i) => (
                <div key={`${q.title}-${i}`} className="group flex items-start gap-3 rounded-lg border border-input-border-color p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-title">/{q.title}</p>
                    <p className="line-clamp-2 text-xs text-subtitle-color">{q.text}</p>
                  </div>
                  <button type="button" onClick={() => setEditing({ index: i, title: q.title, text: q.text })} aria-label={`Edit ${q.title}`} className="rounded p-1 text-subtitle-color hover:text-title">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => persist(list.filter((_, j) => j !== i), 'Quick reply deleted')} aria-label={`Delete ${q.title}`} className="rounded p-1 text-subtitle-color hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" className="w-full gap-1.5" onClick={() => setEditing({ index: null, title: '', text: '' })}>
              <Plus /> Add quick reply
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default QuickRepliesDialog

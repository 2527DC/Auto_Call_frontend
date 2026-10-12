'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useUploadWaFlowMediaMutation } from '@/redux/api/whatsappAutomationApi'
import { FlowNodeData } from '@/types/whatsappAutomation'
import { getMediaUrl } from '@/utils/auth'
import { ArrowDown, ArrowUp, FileText, Loader2, Paperclip, Plus, Trash2, X } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { LIMITS, shortId } from '../catalog'
import { Field, SectionTitle, SelectField, TextField, VarText } from '../fields'

export interface FormProps {
  data: FlowNodeData
  set: (patch: Partial<FlowNodeData>) => void
}

const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export const MessageForm = ({ data, set }: FormProps) => {
  const [upload, { isLoading }] = useUploadWaFlowMediaMutation()
  const fileRef = useRef<HTMLInputElement>(null)
  const media = data.media

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 16 * 1024 * 1024) return toast.error('Files can be up to 16 MB.')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await upload(form).unwrap()
      set({ media: { type: res.data.type, url: res.data.url, filename: res.data.filename } })
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message || 'Upload failed')
    }
  }

  return (
    <div className="space-y-4">
      <VarText
        label={media?.url ? 'Caption' : 'Message'}
        value={data.text}
        onChange={(text) => set({ text })}
        multiline
        rows={5}
        max={media?.url ? 1024 : LIMITS.text}
        placeholder="Hi {{contact.first_name}}! Thanks for reaching out."
        hint="*bold*, _italic_ and ~strike~ work like in WhatsApp."
      />
      <Field label="Image, video or document (optional)">
        {media?.url ? (
          <div className="flex items-center gap-3 rounded-lg border border-input-border-color p-2">
            {media.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getMediaUrl(media.url)} alt="" className="h-14 w-14 rounded object-cover bg-zinc-100" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded bg-primary/10 text-primary"><FileText className="w-6 h-6" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-title truncate">{media.filename || media.type}</p>
              <p className="text-[11px] text-subtitle-color capitalize">{media.type}</p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => set({ media: null })} aria-label="Remove file">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,video/mp4,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={isLoading} className="w-full gap-2 h-9 border-dashed">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              Attach a file
            </Button>
          </>
        )}
      </Field>
    </div>
  )
}

const OptionRow = ({ value, onChange, max, onUp, onDown, onRemove, placeholder, canRemove }: {
  value: string
  onChange: (v: string) => void
  max: number
  onUp?: () => void
  onDown?: () => void
  onRemove: () => void
  placeholder: string
  canRemove: boolean
}) => (
  <div className="flex items-center gap-1">
    <div className="relative flex-1">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn('h-9 pr-12 bg-input-color border-input-border-color text-sm', value.length > max && 'border-destructive!')} />
      <span className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] tabular-nums', value.length > max ? 'text-destructive font-bold' : 'text-subtitle-color')}>{value.length}/{max}</span>
    </div>
    <Button type="button" variant="ghost" size="icon-sm" onClick={onUp} disabled={!onUp} aria-label="Move up"><ArrowUp className="w-3.5 h-3.5" /></Button>
    <Button type="button" variant="ghost" size="icon-sm" onClick={onDown} disabled={!onDown} aria-label="Move down"><ArrowDown className="w-3.5 h-3.5" /></Button>
    <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} disabled={!canRemove} aria-label="Remove" className="hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
  </div>
)

const HeaderFooter = ({ data, set }: FormProps) => (
  <div className="grid grid-cols-1 gap-3">
    <TextField label="Header (optional)" value={data.header} onChange={(header) => set({ header })} max={LIMITS.header} />
    <TextField label="Footer (optional)" value={data.footer} onChange={(footer) => set({ footer })} max={LIMITS.footer} placeholder="e.g. Reply anytime" />
  </div>
)

const SaveChoice = ({ data, set }: FormProps) => (
  <TextField
    label="Save the choice in a variable (optional)"
    value={data.variable}
    onChange={(variable) => set({ variable: variable.replace(/[^a-zA-Z0-9_]/g, '_') })}
    placeholder="e.g. interest"
    mono
    hint={data.variable ? <>Use it later as <code>{`{{vars.${data.variable}}}`}</code></> : 'The title of the tapped option is saved.'}
  />
)

export const ButtonsForm = ({ data, set }: FormProps) => {
  const buttons = data.buttons || []
  const update = (next: typeof buttons) => set({ buttons: next })
  return (
    <div className="space-y-4">
      <VarText label="Message" value={data.text} onChange={(text) => set({ text })} multiline rows={4} max={LIMITS.body} placeholder="How can we help you today?" />
      <div className="space-y-2">
        <Field label={`Buttons (${buttons.length}/${LIMITS.buttons})`} hint="Each button gets its own connector on the canvas.">
          <div className="space-y-1.5">
            {buttons.map((b, i) => (
              <OptionRow
                key={b.id}
                value={b.title}
                onChange={(title) => update(buttons.map((x) => (x.id === b.id ? { ...x, title } : x)))}
                max={LIMITS.button_title}
                placeholder={`Button ${i + 1}`}
                onUp={i > 0 ? () => update(move(buttons, i, i - 1)) : undefined}
                onDown={i < buttons.length - 1 ? () => update(move(buttons, i, i + 1)) : undefined}
                onRemove={() => update(buttons.filter((x) => x.id !== b.id))}
                canRemove={buttons.length > 1}
              />
            ))}
          </div>
        </Field>
        {buttons.length < LIMITS.buttons && (
          <Button type="button" variant="outline" size="sm" onClick={() => update([...buttons, { id: shortId('b_'), title: '' }])} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Add button
          </Button>
        )}
      </div>
      <HeaderFooter data={data} set={set} />
      <SaveChoice data={data} set={set} />
    </div>
  )
}

export const ListForm = ({ data, set }: FormProps) => {
  const sections = data.sections?.length ? data.sections : [{ title: '', rows: [] }]
  const total = sections.reduce((n, s) => n + (s.rows?.length || 0), 0)
  const updateSection = (si: number, patch: Partial<(typeof sections)[number]>) => set({ sections: sections.map((s, i) => (i === si ? { ...s, ...patch } : s)) })

  return (
    <div className="space-y-4">
      <VarText label="Message" value={data.text} onChange={(text) => set({ text })} multiline rows={3} max={LIMITS.body} placeholder="Choose what you'd like to know about:" />
      <TextField label="Menu button label" value={data.button_label} onChange={(button_label) => set({ button_label })} max={LIMITS.list_button} placeholder="Choose" />
      <SectionTitle>Options ({total}/{LIMITS.list_rows})</SectionTitle>
      {sections.map((section, si) => (
        <div key={si} className="space-y-2 rounded-lg border border-input-border-color p-2.5">
          <div className="flex items-center gap-1">
            <Input
              value={section.title || ''}
              onChange={(e) => updateSection(si, { title: e.target.value })}
              placeholder={sections.length > 1 ? 'Section title (needed with 2+ sections)' : 'Section title (optional)'}
              className="h-8 bg-input-color border-input-border-color text-xs font-semibold"
            />
            {sections.length > 1 && (
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => set({ sections: sections.filter((_, i) => i !== si) })} aria-label="Remove section" className="hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          {(section.rows || []).map((r, ri) => (
            <div key={r.id} className="space-y-1 rounded-md bg-primary/[0.03] p-1.5">
              <OptionRow
                value={r.title}
                onChange={(title) => updateSection(si, { rows: section.rows.map((x) => (x.id === r.id ? { ...x, title } : x)) })}
                max={LIMITS.row_title}
                placeholder={`Option ${ri + 1}`}
                onUp={ri > 0 ? () => updateSection(si, { rows: move(section.rows, ri, ri - 1) }) : undefined}
                onDown={ri < section.rows.length - 1 ? () => updateSection(si, { rows: move(section.rows, ri, ri + 1) }) : undefined}
                onRemove={() => updateSection(si, { rows: section.rows.filter((x) => x.id !== r.id) })}
                canRemove={total > 1}
              />
              <div className="relative">
                <Input
                  value={r.description || ''}
                  onChange={(e) => updateSection(si, { rows: section.rows.map((x) => (x.id === r.id ? { ...x, description: e.target.value } : x)) })}
                  placeholder="Description (optional)"
                  className={cn('h-8 pr-12 bg-input-color border-input-border-color text-xs', (r.description || '').length > LIMITS.row_description && 'border-destructive!')}
                />
                <span className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] tabular-nums', (r.description || '').length > LIMITS.row_description ? 'text-destructive font-bold' : 'text-subtitle-color')}>{(r.description || '').length}/{LIMITS.row_description}</span>
              </div>
            </div>
          ))}
          {total < LIMITS.list_rows && (
            <Button type="button" variant="ghost" size="sm" onClick={() => updateSection(si, { rows: [...(section.rows || []), { id: shortId('r_'), title: '' }] })} className="gap-1 text-primary">
              <Plus className="w-3.5 h-3.5" /> Add option
            </Button>
          )}
        </div>
      ))}
      {total < LIMITS.list_rows && sections.length < 10 && (
        <Button type="button" variant="outline" size="sm" onClick={() => set({ sections: [...sections, { title: '', rows: [{ id: shortId('r_'), title: '' }] }] })} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> Add section
        </Button>
      )}
      <HeaderFooter data={data} set={set} />
      <SaveChoice data={data} set={set} />
    </div>
  )
}

export const QuestionForm = ({ data, set }: FormProps) => (
  <div className="space-y-4">
    <VarText label="Question" value={data.text} onChange={(text) => set({ text })} multiline rows={3} max={LIMITS.text} placeholder="What is your email address?" />
    <TextField
      label="Save the answer as"
      value={data.variable}
      onChange={(variable) => set({ variable: variable.replace(/[^a-zA-Z0-9_]/g, '_') })}
      placeholder="email"
      mono
      hint={data.variable ? <>Use it later as <code>{`{{vars.${data.variable}}}`}</code></> : 'Letters, numbers and _ only.'}
    />
    <SelectField
      label="Accept"
      value={data.validation || 'any'}
      onChange={(validation) => set({ validation })}
      options={[
        { value: 'any', label: 'Any answer' },
        { value: 'email', label: 'Email address' },
        { value: 'phone', label: 'Phone number (10–15 digits)' },
        { value: 'number', label: 'A number' },
        { value: 'date', label: 'A date (e.g. 25/12/2026)' },
      ]}
    />
    <VarText
      label="If the answer isn't valid, reply"
      value={data.error_text}
      onChange={(error_text) => set({ error_text })}
      placeholder="That doesn't look right. Please try again."
      hint="Leave empty for a default message. After the flow's re-asks are used up, its 'unknown reply' rule applies."
    />
  </div>
)

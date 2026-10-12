'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textArea'
import { cn } from '@/lib/utils'
import { Braces, Check, ChevronDown, X } from 'lucide-react'
import { KeyboardEvent, ReactNode, useId, useRef, useState } from 'react'
import { useBuilder } from './BuilderContext'
import { CONTACT_VARS } from './catalog'

export const inputClass = 'h-9 bg-input-color border-input-border-color text-sm'

export const Field = ({ label, hint, count, max, error, children, htmlFor, action }: {
  label: string
  hint?: ReactNode
  count?: number
  max?: number
  error?: string | null
  children: ReactNode
  htmlFor?: string
  action?: ReactNode
}) => (
  <div className="space-y-1.5 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-subtitle-color">{label}</Label>
      <div className="flex items-center gap-2">
        {action}
        {max !== undefined && (
          <span className={cn('text-[10px] tabular-nums', (count || 0) > max ? 'text-destructive font-bold' : 'text-subtitle-color')}>{count || 0}/{max}</span>
        )}
      </div>
    </div>
    {children}
    {error && <p className="text-[11px] text-destructive">{error}</p>}
    {hint && !error && <p className="text-[11px] text-subtitle-color leading-snug">{hint}</p>}
  </div>
)

// Inserts {{variables}} at the cursor of the field next to it.
export const VariablePicker = ({ onPick }: { onPick: (token: string) => void }) => {
  const { variables } = useBuilder()
  const [open, setOpen] = useState(false)
  const pick = (token: string) => {
    onPick(token)
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/10" aria-label="Insert a variable">
          <Braces className="w-3 h-3" /> Variable
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1 bg-bg-card border-input-border-color max-h-72 overflow-y-auto">
        <p className="px-2 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-subtitle-color">Customer</p>
        {CONTACT_VARS.map((v) => (
          <button key={v.token} type="button" onClick={() => pick(v.token)} className="w-full flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-primary/5">
            <span className="text-title">{v.label}</span>
            <code className="text-[10px] text-subtitle-color">{v.token}</code>
          </button>
        ))}
        <p className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-subtitle-color">Saved in this flow</p>
        {variables.length === 0 && <p className="px-2 pb-2 text-xs text-subtitle-color">None yet. Question and Set variable steps add them.</p>}
        {variables.map((v) => (
          <button key={v} type="button" onClick={() => pick(`{{vars.${v}}}`)} className="w-full flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-primary/5">
            <span className="text-title">{v}</span>
            <code className="text-[10px] text-subtitle-color">{`{{vars.${v}}}`}</code>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// A text input or textarea with a variable picker and an optional character limit.
export const VarText = ({ label, value, onChange, max, placeholder, multiline, rows = 3, hint, mono, error }: {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  max?: number
  placeholder?: string
  multiline?: boolean
  rows?: number
  hint?: ReactNode
  mono?: boolean
  error?: string | null
}) => {
  const id = useId()
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const insert = (token: string) => {
    const el = ref.current
    const current = value || ''
    if (!el) return onChange(current + token)
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? current.length
    onChange(current.slice(0, start) + token + current.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }
  const tooLong = max !== undefined && (value || '').length > max
  return (
    <Field label={label} htmlFor={id} count={(value || '').length} max={max} hint={hint} error={error || (tooLong ? `Keep it under ${max} characters.` : null)} action={<VariablePicker onPick={insert} />}>
      {multiline ? (
        <Textarea
          id={id}
          ref={ref}
          rows={rows}
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn('min-h-0 bg-input-color border-input-border-color text-sm', mono && 'font-mono text-xs', tooLong && 'border-destructive!')}
        />
      ) : (
        <Input id={id} ref={ref} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, tooLong && 'border-destructive!')} />
      )}
    </Field>
  )
}

export const TextField = ({ label, value, onChange, max, placeholder, hint, error, mono }: {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  max?: number
  placeholder?: string
  hint?: ReactNode
  error?: string | null
  mono?: boolean
}) => {
  const id = useId()
  const tooLong = max !== undefined && (value || '').length > max
  return (
    <Field label={label} htmlFor={id} count={(value || '').length} max={max} hint={hint} error={error || (tooLong ? `Keep it under ${max} characters.` : null)}>
      <Input id={id} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, mono && 'font-mono', tooLong && 'border-destructive!')} />
    </Field>
  )
}

export const NumberField = ({ label, value, onChange, min = 0, max, suffix, hint }: {
  label: string
  value: number | undefined
  onChange: (v: number) => void
  min?: number
  max?: number
  suffix?: string
  hint?: ReactNode
}) => {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? min : Number(e.target.value))}
          className={cn(inputClass, 'tabular-nums', suffix && 'pr-16')}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-subtitle-color pointer-events-none">{suffix}</span>}
      </div>
    </Field>
  )
}

export const SelectField = <T extends string>({ label, value, onChange, options, placeholder, hint, empty }: {
  label: string
  value: T | '' | undefined | null
  onChange: (v: T) => void
  options: { value: T; label: string; hint?: string }[]
  placeholder?: string
  hint?: ReactNode
  empty?: ReactNode
}) => (
  <Field label={label} hint={hint}>
    {options.length === 0 && empty ? (
      <div className="rounded-lg border border-dashed border-input-border-color px-3 py-2 text-xs text-subtitle-color">{empty}</div>
    ) : (
      <Select value={value || undefined} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="h-9 w-full shadow-none bg-input-color border-input-border-color text-sm">
          <SelectValue placeholder={placeholder || 'Choose…'} />
        </SelectTrigger>
        <SelectContent className="bg-bg-card border-input-border-color">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  </Field>
)

export const SwitchField = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-start justify-between gap-3 rounded-lg border border-input-border-color px-3 py-2.5 cursor-pointer">
    <span className="min-w-0">
      <span className="block text-sm font-medium text-title">{label}</span>
      {description && <span className="block text-[11px] text-subtitle-color leading-snug">{description}</span>}
    </span>
    <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
  </label>
)

// Words or labels as removable chips; Enter or comma adds one.
export const ChipsInput = ({ label, values, onChange, placeholder, hint, max = 30 }: {
  label: string
  values: string[] | undefined
  onChange: (v: string[]) => void
  placeholder?: string
  hint?: ReactNode
  max?: number
}) => {
  const id = useId()
  const [draft, setDraft] = useState('')
  const list = values || []
  const add = () => {
    const parts = draft.split(',').map((s) => s.trim()).filter(Boolean)
    if (!parts.length) return
    onChange([...new Set([...list, ...parts])].slice(0, max))
    setDraft('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !draft && list.length) {
      onChange(list.slice(0, -1))
    }
  }
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-radius border border-input-border-color bg-input-color px-2 py-1.5 min-h-9 focus-within:border-primary">
        {list.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {v}
            <button type="button" onClick={() => onChange(list.filter((x) => x !== v))} aria-label={`Remove ${v}`} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={list.length ? '' : placeholder}
          className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
      </div>
    </Field>
  )
}

// Pick several items from a list (contact groups, knowledge bases).
export const MultiPick = ({ label, values, onChange, options, empty, hint }: {
  label: string
  values: string[] | undefined
  onChange: (v: string[]) => void
  options: { id: string; name: string }[]
  empty?: ReactNode
  hint?: ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const selected = values || []
  const names = options.filter((o) => selected.includes(o.id)).map((o) => o.name)
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  return (
    <Field label={label} hint={hint}>
      {options.length === 0 ? (
        <div className="rounded-lg border border-dashed border-input-border-color px-3 py-2 text-xs text-subtitle-color">{empty || 'Nothing to choose yet.'}</div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="w-full flex items-center justify-between gap-2 h-9 rounded-radius border border-input-border-color bg-input-color px-3 text-left text-sm">
              <span className={cn('truncate', !names.length && 'text-muted-foreground/60')}>{names.length ? names.join(', ') : 'Choose…'}</span>
              <ChevronDown className="w-4 h-4 shrink-0 text-subtitle-color" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1 bg-bg-card border-input-border-color max-h-64 overflow-y-auto">
            {options.map((o) => {
              const on = selected.includes(o.id)
              return (
                <button key={o.id} type="button" onClick={() => toggle(o.id)} className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-primary/5">
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded border', on ? 'bg-primary border-primary text-white' : 'border-input-border-color')}>
                    {on && <Check className="w-3 h-3" />}
                  </span>
                  <span className="truncate text-title">{o.name}</span>
                </button>
              )
            })}
          </PopoverContent>
        </Popover>
      )}
    </Field>
  )
}

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h4 className="text-[11px] font-bold uppercase tracking-wider text-subtitle-color pt-2">{children}</h4>
)

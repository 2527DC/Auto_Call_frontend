'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CURRENCY_SYMBOL, formatMoney } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { ReactNode, useId } from 'react'

const sign = (v: number) => (v < 0 ? '−' : '')
export const money = (v: number) => `${sign(v)}${formatMoney(Math.abs(v))}`
export const rupees = (v: number) => `${sign(Math.round(v))}${CURRENCY_SYMBOL}${Math.abs(Math.round(v)).toLocaleString('en-IN')}`
export const pct = (v: number | null) => (v === null || !Number.isFinite(v) ? '—' : `${v.toFixed(1)}%`)

export const Section = ({ step, icon: Icon, title, description, actions, children }: {
  step: number
  icon: LucideIcon
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) => (
  <section id={`pe-step-${step}`} className="scroll-mt-24 rounded-lg border border-input-border-color bg-bg-card">
    <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:px-6 px-4 py-4 border-b border-input-border-color">
      <div className="flex items-start gap-3 min-w-0">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="w-4.5 h-4.5" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{step}</span>
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-title leading-tight">{title}</h2>
          <p className="text-sm text-subtitle-color mt-0.5">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
    <div className="sm:p-6 p-4">{children}</div>
  </section>
)

export const NumberField = ({ label, value, onChange, prefix, suffix, hint, step = 'any', disabled, className }: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  hint?: ReactNode
  step?: string
  disabled?: boolean
  className?: string
}) => {
  const id = useId()
  const currency = prefix === '₹'
  return (
    <div className={cn('space-y-1.5 min-w-0', className)}>
      <Label htmlFor={id} className="text-xs font-semibold text-subtitle-color">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-subtitle-color">{prefix}</span>}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          disabled={disabled}
          placeholder="0"
          value={Number.isFinite(value) && value !== 0 ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
          className={cn('h-10 bg-input-color border-input-border-color text-sm tabular-nums', (prefix || currency) && 'pl-7', suffix && 'pr-16')}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-subtitle-color pointer-events-none">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-subtitle-color leading-snug">{hint}</p>}
    </div>
  )
}

export const TextField = ({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) => {
  const id = useId()
  return (
    <div className="space-y-1.5 min-w-0">
      <Label htmlFor={id} className="text-xs font-semibold text-subtitle-color">{label}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-10 bg-input-color border-input-border-color text-sm" />
    </div>
  )
}

// A module that can be switched on or off, with its cost and price on the right.
export const ModuleCard = ({ icon: Icon, title, description, enabled, onToggle, cost, price, children }: {
  icon: LucideIcon
  title: string
  description: string
  enabled: boolean
  onToggle?: (v: boolean) => void
  cost?: number
  price?: number
  children: ReactNode
}) => {
  const profit = (price ?? 0) - (cost ?? 0)
  return (
    <div className={cn('rounded-lg border transition-colors', enabled ? 'border-primary/30 bg-primary/[0.03]' : 'border-input-border-color')}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={cn('w-5 h-5 shrink-0', enabled ? 'text-primary' : 'text-subtitle-color')} />
          <div className="min-w-0">
            <p className="font-semibold text-title text-sm">{title}</p>
            <p className="text-xs text-subtitle-color">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {enabled && cost !== undefined && price !== undefined && (
            <div className="hidden sm:flex items-center gap-4 text-xs tabular-nums">
              <span className="text-subtitle-color">Cost <b className="text-amber-600">{rupees(cost)}</b></span>
              <span className="text-subtitle-color">Price <b className="text-title">{rupees(price)}</b></span>
              <span className="text-subtitle-color">Profit <b className={profit < 0 ? 'text-destructive' : 'text-emerald-600'}>{rupees(profit)}</b></span>
            </div>
          )}
          {onToggle && <Switch checked={enabled} onCheckedChange={onToggle} aria-label={title} />}
        </div>
      </div>
      {enabled && <div className="border-t border-input-border-color px-4 py-4">{children}</div>}
    </div>
  )
}

// Two to four options as a segmented control.
export const Segmented = <T extends string>({ value, options, onChange, label }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) => (
  <div className="space-y-1.5">
    <span className="text-xs font-semibold text-subtitle-color">{label}</span>
    <div role="radiogroup" aria-label={label} className="flex h-10 rounded-lg border border-input-border-color bg-input-color p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-md px-2.5 text-xs font-semibold transition-colors whitespace-nowrap',
            value === o.value ? 'bg-primary text-white shadow-sm' : 'text-subtitle-color hover:text-title'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
)

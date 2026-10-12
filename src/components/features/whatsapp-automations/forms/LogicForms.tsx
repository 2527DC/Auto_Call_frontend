'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FlowNodeData } from '@/types/whatsappAutomation'
import { Plus, Trash2 } from 'lucide-react'
import { useBuilder } from '../BuilderContext'
import { MAX_DELAY_MINUTES } from '../catalog'
import { Field, NumberField, SelectField, TextField, VarText } from '../fields'
import { FormProps } from './MessageForms'

type Rule = NonNullable<FlowNodeData['rules']>[number]

const OPERATORS: { value: Rule['operator']; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: 'is', needsValue: true },
  { value: 'not_equals', label: 'is not', needsValue: true },
  { value: 'contains', label: 'contains', needsValue: true },
  { value: 'starts_with', label: 'starts with', needsValue: true },
  { value: 'exists', label: 'has a value', needsValue: false },
  { value: 'not_exists', label: 'is empty', needsValue: false },
  { value: 'greater_than', label: 'is more than', needsValue: true },
  { value: 'less_than', label: 'is less than', needsValue: true },
]

const small = 'h-8 w-full shadow-none bg-input-color border-input-border-color text-xs'

export const ConditionForm = ({ data, set }: FormProps) => {
  const { variables } = useBuilder()
  const rules = data.rules || []
  const update = (i: number, patch: Partial<Rule>) => set({ rules: rules.map((r, j) => (j === i ? { ...r, ...patch } : r)) })

  return (
    <div className="space-y-4">
      <SelectField
        label="Go down 'Yes' when"
        value={data.match || 'all'}
        onChange={(match) => set({ match })}
        options={[{ value: 'all', label: 'All rules are true' }, { value: 'any', label: 'Any rule is true' }]}
      />
      <div className="space-y-2">
        {rules.map((rule, i) => {
          const op = OPERATORS.find((o) => o.value === rule.operator) || OPERATORS[0]
          return (
            <div key={i} className="space-y-1.5 rounded-lg border border-input-border-color p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-subtitle-color">{i === 0 ? 'If' : data.match === 'any' ? 'Or' : 'And'}</span>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => set({ rules: rules.filter((_, j) => j !== i) })} disabled={rules.length === 1} aria-label="Remove rule" className="hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <Select value={rule.subject} onValueChange={(subject) => update(i, { subject: subject as Rule['subject'], key: subject === 'contact' ? 'email' : '' })}>
                  <SelectTrigger className={small}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-bg-card border-input-border-color">
                    <SelectItem value="var">A saved variable</SelectItem>
                    <SelectItem value="contact">A contact field</SelectItem>
                    <SelectItem value="message">The last message</SelectItem>
                    <SelectItem value="label">The chat&apos;s labels</SelectItem>
                  </SelectContent>
                </Select>
                {rule.subject === 'var' && (
                  variables.length ? (
                    <Select value={rule.key || undefined} onValueChange={(key) => update(i, { key })}>
                      <SelectTrigger className={small}><SelectValue placeholder="Variable…" /></SelectTrigger>
                      <SelectContent className="bg-bg-card border-input-border-color">
                        {variables.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={rule.key || ''} onChange={(e) => update(i, { key: e.target.value })} placeholder="variable name" className={`${small} font-mono`} />
                  )
                )}
                {rule.subject === 'contact' && (
                  <Select value={rule.key || 'email'} onValueChange={(key) => update(i, { key })}>
                    <SelectTrigger className={small}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-bg-card border-input-border-color">
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="first_name">First name</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Select value={rule.operator} onValueChange={(operator) => update(i, { operator: operator as Rule['operator'] })}>
                  <SelectTrigger className={small}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-bg-card border-input-border-color">
                    {OPERATORS.filter((o) => rule.subject !== 'label' || ['contains', 'exists', 'not_exists'].includes(o.value)).map((o) => (
                      <SelectItem key={o.value} value={o.value}>{rule.subject === 'label' && o.value === 'contains' ? 'includes' : o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {op.needsValue && <Input value={rule.value || ''} onChange={(e) => update(i, { value: e.target.value })} placeholder="value" className={small} />}
              </div>
            </div>
          )
        })}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => set({ rules: [...rules, { subject: 'var', key: '', operator: 'equals', value: '' }] })} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add rule
      </Button>
      <p className="text-[11px] text-subtitle-color leading-snug">Text is compared ignoring capitals. &quot;More/less than&quot; compares numbers.</p>
    </div>
  )
}

export const DelayForm = ({ data, set }: FormProps) => {
  const minutes = Number(data.amount || 0) * (data.unit === 'hours' ? 60 : 1)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Wait" value={data.amount} onChange={(amount) => set({ amount })} min={1} />
        <SelectField label="Unit" value={data.unit || 'minutes'} onChange={(unit) => set({ unit })} options={[{ value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }]} />
      </div>
      {minutes > MAX_DELAY_MINUTES && <p className="text-[11px] text-destructive">Wait at most 23 hours: WhatsApp only allows replies within 24 hours of the customer&apos;s last message.</p>}
      <p className="text-[11px] text-subtitle-color leading-snug">Messages the customer sends during the wait go to the inbox; the flow carries on when the wait is over. Waits are checked every minute.</p>
    </div>
  )
}

export const SetVariableForm = ({ data, set }: FormProps) => (
  <div className="space-y-4">
    <TextField label="Variable" value={data.variable} onChange={(variable) => set({ variable: variable.replace(/[^a-zA-Z0-9_]/g, '_') })} mono placeholder="lead_source" />
    <VarText label="Value" value={data.value} onChange={(value) => set({ value })} placeholder="whatsapp" hint="Can combine variables, e.g. {{vars.city}} - {{vars.budget}}" />
  </div>
)

export const EndForm = ({ data, set }: FormProps) => (
  <div className="space-y-4">
    <VarText label="Closing message (optional)" value={data.text} onChange={(text) => set({ text })} multiline rows={3} placeholder="Thanks for chatting with us!" />
    <Field label="What happens">
      <p className="text-[11px] text-subtitle-color leading-snug">The flow ends here. The next message from the customer can start an automation again.</p>
    </Field>
  </div>
)

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textArea'
import { cn } from '@/lib/utils'
import { FlowNodeData, FlowNodeType, FlowSettings, FlowTrigger } from '@/types/whatsappAutomation'
import { AlertCircle, Copy, Settings2, Trash2, X } from 'lucide-react'
import { ComponentType } from 'react'
import { useBuilder } from './BuilderContext'
import { NODE_META, triggerSummary } from './catalog'
import { ChipsInput, Field, NumberField, SelectField } from './fields'
import { AiReplyForm, AppointmentForm, ContactForm, HandoffForm, VoiceCallForm, WebhookForm } from './forms/ActionForms'
import { ConditionForm, DelayForm, EndForm, SetVariableForm } from './forms/LogicForms'
import { ButtonsForm, FormProps, ListForm, MessageForm, QuestionForm } from './forms/MessageForms'

const FORMS: Partial<Record<FlowNodeType, ComponentType<FormProps>>> = {
  message: MessageForm,
  buttons: ButtonsForm,
  list: ListForm,
  question: QuestionForm,
  condition: ConditionForm,
  delay: DelayForm,
  set_variable: SetVariableForm,
  contact: ContactForm,
  handoff: HandoffForm,
  ai_reply: AiReplyForm,
  webhook: WebhookForm,
  appointment: AppointmentForm,
  voice_call: VoiceCallForm,
  end: EndForm,
}

export const NodePanel = ({ id, type, data, onChange, onDelete, onDuplicate, onClose, onOpenSettings }: {
  id: string
  type: FlowNodeType
  data: FlowNodeData
  onChange: (patch: Partial<FlowNodeData>) => void
  onDelete: () => void
  onDuplicate: () => void
  onClose: () => void
  onOpenSettings: () => void
}) => {
  const { errorsByNode, trigger } = useBuilder()
  const meta = NODE_META[type]
  const Icon = meta.icon
  const Form = FORMS[type]
  const errors = errorsByNode[id] || []

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-input-border-color">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.tone)}><Icon className="w-4 h-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-title">{meta.label}</p>
          <p className="text-[11px] text-subtitle-color truncate">{meta.description}</p>
        </div>
        {type !== 'start' && (
          <>
            <Button type="button" variant="ghost" size="icon-sm" onClick={onDuplicate} aria-label="Duplicate step" title="Duplicate"><Copy className="w-4 h-4" /></Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete step" title="Delete" className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
          </>
        )}
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        {errors.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 space-y-1">
            {errors.map((e) => <p key={e} className="flex gap-1.5 text-[11px] text-destructive"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />{e}</p>)}
          </div>
        )}
        {type !== 'start' && (
          <Field label="Step name (optional)" hint="Shown on the canvas and in run logs.">
            <Input value={data.label || ''} onChange={(e) => onChange({ label: e.target.value })} placeholder={meta.label} className="h-9 bg-input-color border-input-border-color text-sm" />
          </Field>
        )}
        {type === 'start' ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-input-border-color p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-subtitle-color">Starts when</p>
              <p className="text-sm text-title mt-1">{triggerSummary(trigger)}</p>
            </div>
            <Button type="button" variant="outline" onClick={onOpenSettings} className="w-full gap-2 h-9"><Settings2 className="w-4 h-4" /> Edit trigger &amp; settings</Button>
            <p className="text-[11px] text-subtitle-color leading-snug">Connect the Start step to the first message the customer should get.</p>
          </div>
        ) : Form ? (
          <Form data={data} set={onChange} />
        ) : null}
      </div>
    </div>
  )
}

export const SettingsPanel = ({ trigger, settings, priority, description, onTrigger, onSettings, onPriority, onDescription }: {
  trigger: FlowTrigger
  settings: FlowSettings
  priority: number
  description: string
  onTrigger: (t: FlowTrigger) => void
  onSettings: (s: FlowSettings) => void
  onPriority: (p: number) => void
  onDescription: (d: string) => void
}) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-input-border-color">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Settings2 className="w-4 h-4" /></span>
      <div>
        <p className="text-sm font-semibold text-title">Flow settings</p>
        <p className="text-[11px] text-subtitle-color">Click a step to edit it.</p>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
      <SelectField
        label="Start this flow when"
        value={trigger.type}
        onChange={(type) => onTrigger({ ...trigger, type })}
        options={[
          { value: 'keyword', label: 'The message has a keyword' },
          { value: 'first_message', label: 'A customer messages for the first time' },
          { value: 'any_message', label: 'Any message (fallback)' },
        ]}
        hint="Keyword flows are checked first, then 'first message', then 'any message'. A chat already in a flow stays in it."
      />
      {trigger.type === 'keyword' && (
        <>
          <ChipsInput label="Keywords" values={trigger.keywords} onChange={(keywords) => onTrigger({ ...trigger, keywords })} placeholder="hi, menu, price" hint="Press Enter or comma after each. Taps on buttons also count." />
          <SelectField
            label="Match"
            value={trigger.match}
            onChange={(match) => onTrigger({ ...trigger, match })}
            options={[{ value: 'contains', label: 'Message contains the keyword' }, { value: 'exact', label: 'Message is exactly the keyword' }]}
          />
        </>
      )}
      <NumberField label="Priority" value={priority} onChange={onPriority} min={0} max={1000} hint="When two flows of the same kind match, the lower number wins." />
      <SelectField
        label="When the reply matches no option"
        value={settings.on_unknown_reply}
        onChange={(on_unknown_reply) => onSettings({ ...settings, on_unknown_reply })}
        options={[
          { value: 'reprompt', label: 'Ask again, then hand over to the team' },
          { value: 'handoff', label: 'Hand over to the team straight away' },
          { value: 'end', label: 'End the flow' },
        ]}
      />
      {settings.on_unknown_reply === 'reprompt' && (
        <NumberField label="Ask again up to" value={settings.max_reprompts} onChange={(max_reprompts) => onSettings({ ...settings, max_reprompts })} min={0} max={5} suffix="times" />
      )}
      <NumberField label="Give up waiting after" value={settings.timeout_hours} onChange={(timeout_hours) => onSettings({ ...settings, timeout_hours })} min={1} max={72} suffix="hours" hint="A customer who doesn't answer is released from the flow." />
      <Field label="Description (optional)">
        <Textarea value={description} onChange={(e) => onDescription(e.target.value)} rows={3} className="min-h-0 bg-input-color border-input-border-color text-sm" placeholder="What this automation is for" />
      </Field>
    </div>
  </div>
)

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/constants/routes'
import { Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useBuilder } from '../BuilderContext'
import { ChipsInput, Field, MultiPick, NumberField, SectionTitle, SelectField, SwitchField, TextField, VarText } from '../fields'
import { FormProps } from './MessageForms'

const NONE = '__none__'

export const ContactForm = ({ data, set }: FormProps) => {
  const { options } = useBuilder()
  const fields = data.fields || {}
  const groups = options?.contact_groups || []
  const setField = (key: 'first_name' | 'last_name' | 'email', value: string) => set({ fields: { ...fields, [key]: value } })
  return (
    <div className="space-y-4">
      <SectionTitle>Save to the contact</SectionTitle>
      <VarText label="First name" value={fields.first_name} onChange={(v) => setField('first_name', v)} placeholder="{{vars.name}}" />
      <VarText label="Last name" value={fields.last_name} onChange={(v) => setField('last_name', v)} />
      <VarText label="Email" value={fields.email} onChange={(v) => setField('email', v)} placeholder="{{vars.email}}" hint="Empty fields are left as they are." />
      <SectionTitle>Contact groups</SectionTitle>
      <MultiPick label="Add to groups" values={data.add_group_ids} onChange={(add_group_ids) => set({ add_group_ids })} options={groups} empty={<>No contact groups yet. <Link href={ROUTES.CONTACT_GROUP} className="text-primary hover:underline">Create one</Link>.</>} />
      <MultiPick label="Remove from groups" values={data.remove_group_ids} onChange={(remove_group_ids) => set({ remove_group_ids })} options={groups} />
      <SectionTitle>Chat labels</SectionTitle>
      <ChipsInput label="Add labels" values={data.add_labels} onChange={(add_labels) => set({ add_labels })} placeholder="lead, hot, demo" hint="Labels show on the chat in the inbox and can be filtered." />
      <ChipsInput label="Remove labels" values={data.remove_labels} onChange={(remove_labels) => set({ remove_labels })} />
    </div>
  )
}

export const HandoffForm = ({ data, set }: FormProps) => {
  const { options } = useBuilder()
  const members = options?.team_members || []
  return (
    <div className="space-y-4">
      <VarText label="Message to the customer (optional)" value={data.text} onChange={(text) => set({ text })} multiline rows={3} placeholder="Thanks! A team member will reply shortly." />
      <SelectField
        label="Assign to"
        value={data.assign_member_id || NONE}
        onChange={(v) => set({ assign_member_id: v === NONE ? null : v })}
        options={[{ value: NONE, label: 'Nobody (anyone can pick it up)' }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
      />
      <SelectField
        label="Mark the chat as"
        value={data.status || 'pending'}
        onChange={(status) => set({ status })}
        options={[{ value: 'pending', label: 'Pending (needs a reply)' }, { value: 'open', label: 'Open' }]}
      />
      <VarText label="Note for the team (optional)" value={data.note} onChange={(note) => set({ note })} placeholder="New lead: {{vars.requirement}}" hint="Shown in the chat for your team only." />
      <p className="text-[11px] text-subtitle-color leading-snug">The flow ends here, and automations and AI stop answering this chat until it is resolved or resumed from the inbox.</p>
    </div>
  )
}

export const AiReplyForm = ({ data, set }: FormProps) => (
  <div className="space-y-4">
    <SelectField
      label="Mode"
      value={data.mode || 'once'}
      onChange={(mode) => set({ mode })}
      options={[
        { value: 'once', label: 'Answer the last message once, then continue' },
        { value: 'chat', label: 'Chat: keep answering until an exit word or limit' },
      ]}
    />
    {data.mode === 'chat' && (
      <>
        <VarText label="Opening message (optional)" value={data.intro_text} onChange={(intro_text) => set({ intro_text })} multiline rows={2} placeholder='Ask me anything! Type "agent" to talk to a person.' />
        <ChipsInput label="Exit words" values={data.exit_keywords} onChange={(exit_keywords) => set({ exit_keywords })} placeholder="agent, human" hint="If the customer's message contains one, the flow moves to the next step." />
        <NumberField label="Stop after this many AI replies" value={data.max_turns} onChange={(max_turns) => set({ max_turns })} min={1} max={50} />
      </>
    )}
    <VarText label="Extra instructions for this step (optional)" value={data.instructions} onChange={(instructions) => set({ instructions })} multiline rows={3} placeholder="Focus on our home-loan products. Always ask for the customer's city." />
    <Field label="Knowledge and AI model">
      <p className="text-[11px] text-subtitle-color leading-snug">
        Uses the instructions and knowledge bases from the <Link href={`${ROUTES.WHATSAPP_AUTOMATIONS}?tab=ai`} className="text-primary hover:underline">AI auto-reply</Link> tab, and the AI model in your settings. Free during the beta.
      </p>
    </Field>
  </div>
)

export const WebhookForm = ({ data, set }: FormProps) => {
  const headers = data.headers || []
  const save = data.save || []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[96px_1fr] gap-2 items-end">
        <SelectField
          label="Method"
          value={data.method || 'POST'}
          onChange={(method) => set({ method })}
          options={(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => ({ value: m, label: m }))}
        />
        <VarText label="URL" value={data.url} onChange={(url) => set({ url })} placeholder="https://hooks.zapier.com/…" />
      </div>
      <Field label="Headers" hint="e.g. Authorization: Bearer your-token">
        <div className="space-y-1.5">
          {headers.map((h, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input value={h.key} onChange={(e) => set({ headers: headers.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)) })} placeholder="Header" className="h-8 bg-input-color border-input-border-color text-xs font-mono" />
              <Input value={h.value} onChange={(e) => set({ headers: headers.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} placeholder="Value" className="h-8 bg-input-color border-input-border-color text-xs font-mono" />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => set({ headers: headers.filter((_, j) => j !== i) })} aria-label="Remove header" className="hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => set({ headers: [...headers, { key: '', value: '' }] })} className="gap-1 text-primary"><Plus className="w-3.5 h-3.5" /> Add header</Button>
        </div>
      </Field>
      {data.method !== 'GET' && (
        <VarText label="Body (JSON)" value={data.body} onChange={(body) => set({ body })} multiline rows={6} mono hint="Variables are inserted safely as JSON strings." />
      )}
      <Field label="Save from the response" hint={<>Path into the JSON reply, e.g. <code>data.id</code> or <code>items[0].name</code>. <code>webhook_status</code> is always saved.</>}>
        <div className="space-y-1.5">
          {save.map((m, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input value={m.variable} onChange={(e) => set({ save: save.map((x, j) => (j === i ? { ...x, variable: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') } : x)) })} placeholder="variable" className="h-8 bg-input-color border-input-border-color text-xs font-mono" />
              <span className="text-subtitle-color text-xs">←</span>
              <Input value={m.path} onChange={(e) => set({ save: save.map((x, j) => (j === i ? { ...x, path: e.target.value } : x)) })} placeholder="data.id" className="h-8 bg-input-color border-input-border-color text-xs font-mono" />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => set({ save: save.filter((_, j) => j !== i) })} aria-label="Remove mapping" className="hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => set({ save: [...save, { variable: '', path: '' }] })} className="gap-1 text-primary"><Plus className="w-3.5 h-3.5" /> Add mapping</Button>
        </div>
      </Field>
      <NumberField label="Timeout" value={data.timeout_seconds} onChange={(timeout_seconds) => set({ timeout_seconds })} min={2} max={15} suffix="seconds" />
      <p className="text-[11px] text-subtitle-color leading-snug">A 2xx reply follows <b className="text-emerald-600">Success</b>; anything else, a timeout or a private address follows <b className="text-rose-500">Error</b> (with <code>{'{{vars.webhook_error}}'}</code>).</p>
    </div>
  )
}

export const AppointmentForm = ({ data, set }: FormProps) => {
  const { options, variables } = useBuilder()
  const calendars = options?.calendars || []
  return (
    <div className="space-y-4">
      <VarText label="Message with the slots" value={data.text} onChange={(text) => set({ text })} multiline rows={2} placeholder="Pick a time that suits you:" />
      <TextField label="Menu button label" value={data.button_label} onChange={(button_label) => set({ button_label })} max={20} placeholder="Choose a time" />
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Days ahead" value={data.days_ahead} onChange={(days_ahead) => set({ days_ahead })} min={1} max={14} />
        <SelectField
          label="Slot length"
          value={String(data.slot_minutes || 30)}
          onChange={(v) => set({ slot_minutes: Number(v) })}
          options={['15', '30', '45', '60', '90', '120'].map((m) => ({ value: m, label: `${m} min` }))}
        />
      </div>
      <SelectField
        label="Book under the name from"
        value={data.name_variable || NONE}
        onChange={(v) => set({ name_variable: v === NONE ? '' : v })}
        options={[{ value: NONE, label: 'The WhatsApp profile name' }, ...variables.map((v) => ({ value: v, label: `vars.${v}` }))]}
      />
      <TextField label="Appointment type" value={data.appointment_type} onChange={(appointment_type) => set({ appointment_type })} placeholder="General" />
      <SwitchField label="Send a Google Meet link" description="Adds {{meet_link}} when the calendar is connected." checked={!!data.send_meet_link} onChange={(send_meet_link) => set({ send_meet_link })} />
      <SelectField
        label="Google Calendar"
        value={data.calendar_id || NONE}
        onChange={(v) => set({ calendar_id: v === NONE ? null : v })}
        options={[{ value: NONE, label: 'Default calendar' }, ...calendars.map((c) => ({ value: c.id, label: c.name }))]}
      />
      <VarText label="Confirmation" value={data.confirm_text} onChange={(confirm_text) => set({ confirm_text })} multiline rows={3} hint="{{appointment_date}}, {{appointment_time}} and {{meet_link}} are filled in." />
      <VarText label="When no slot is free" value={data.no_slots_text} onChange={(no_slots_text) => set({ no_slots_text })} multiline rows={2} placeholder="Sorry, there are no free slots right now. A team member will contact you." />
      <p className="text-[11px] text-subtitle-color leading-snug">
        Up to 10 free slots from your <Link href={`${ROUTES.TOOLBOX}/appointment-setting`} className="text-primary hover:underline">appointment settings</Link> (working days and hours) are offered as a list, at least an hour from now.
      </p>
    </div>
  )
}

export const VoiceCallForm = ({ data, set }: FormProps) => {
  const { options } = useBuilder()
  return (
    <div className="space-y-4">
      <VarText label="Message before calling (optional)" value={data.text} onChange={(text) => set({ text })} multiline rows={2} />
      <SelectField
        label="AI voice agent"
        value={data.agent_id}
        onChange={(agent_id) => set({ agent_id })}
        options={(options?.voice_agents || []).map((a) => ({ value: a.id, label: a.name }))}
        empty={<>No active flow agents. <Link href={ROUTES.AI_ASSISTANTS} className="text-primary hover:underline">Create one</Link> with a call flow.</>}
      />
      <SelectField
        label="Call from"
        value={data.from_number}
        onChange={(from_number) => set({ from_number })}
        options={(options?.phone_numbers || []).map((n) => ({ value: n.number, label: `${n.number} · ${n.provider}` }))}
        empty={<>No phone numbers. <Link href={ROUTES.PHONE_NUMBERS} className="text-primary hover:underline">Add one</Link>.</>}
      />
      <p className="text-[11px] text-subtitle-color leading-snug">The agent calls the customer&apos;s WhatsApp number. Calls use your normal call credits.</p>
    </div>
  )
}

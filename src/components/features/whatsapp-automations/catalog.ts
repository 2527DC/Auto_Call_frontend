import { FlowNodeData, FlowNodeType } from '@/types/whatsappAutomation'
import {
  Bot,
  CalendarCheck,
  Clock,
  Flag,
  GitBranch,
  Hand,
  ListChecks,
  LucideIcon,
  MessageSquareText,
  MousePointerClick,
  PhoneCall,
  Play,
  TextCursorInput,
  UserPen,
  Variable,
  Webhook,
} from 'lucide-react'

// Meta's limits for interactive messages (Voxeno_backend/services/whatsapp/meta.js).
export const LIMITS = {
  body: 1024,
  header: 60,
  footer: 60,
  buttons: 3,
  button_title: 20,
  list_button: 20,
  list_rows: 10,
  row_title: 24,
  row_description: 72,
  text: 4096,
}

export const MAX_DELAY_MINUTES = 23 * 60

export type NodeCategory = 'messages' | 'logic' | 'actions' | 'end'

export interface NodeOutput {
  id: string
  label: string
  tone?: 'default' | 'good' | 'bad'
}

export interface NodeMeta {
  label: string
  description: string
  icon: LucideIcon
  // Tailwind classes for the icon tile
  tone: string
  category: NodeCategory | null
}

export const NODE_META: Record<FlowNodeType, NodeMeta> = {
  start: { label: 'Start', description: 'Where the flow begins', icon: Play, tone: 'bg-emerald-500/10 text-emerald-600', category: null },
  message: { label: 'Message', description: 'Send text, an image or a file', icon: MessageSquareText, tone: 'bg-sky-500/10 text-sky-600', category: 'messages' },
  buttons: { label: 'Buttons', description: 'Up to 3 reply buttons', icon: MousePointerClick, tone: 'bg-violet-500/10 text-violet-600', category: 'messages' },
  list: { label: 'List menu', description: 'A menu of up to 10 options', icon: ListChecks, tone: 'bg-violet-500/10 text-violet-600', category: 'messages' },
  question: { label: 'Question', description: 'Ask and save the answer', icon: TextCursorInput, tone: 'bg-indigo-500/10 text-indigo-600', category: 'messages' },
  condition: { label: 'Condition', description: 'Branch on an answer or field', icon: GitBranch, tone: 'bg-amber-500/10 text-amber-600', category: 'logic' },
  delay: { label: 'Wait', description: 'Pause before the next step', icon: Clock, tone: 'bg-amber-500/10 text-amber-600', category: 'logic' },
  set_variable: { label: 'Set variable', description: 'Store a value for later', icon: Variable, tone: 'bg-amber-500/10 text-amber-600', category: 'logic' },
  contact: { label: 'Update contact', description: 'Save fields, groups, labels', icon: UserPen, tone: 'bg-teal-500/10 text-teal-600', category: 'actions' },
  handoff: { label: 'Hand over to team', description: 'A person takes the chat', icon: Hand, tone: 'bg-rose-500/10 text-rose-600', category: 'actions' },
  ai_reply: { label: 'AI reply', description: 'Answer with AI + knowledge base', icon: Bot, tone: 'bg-fuchsia-500/10 text-fuchsia-600', category: 'actions' },
  webhook: { label: 'Webhook / API', description: 'Send data to a CRM or URL', icon: Webhook, tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-300', category: 'actions' },
  appointment: { label: 'Book appointment', description: 'Offer free slots and book', icon: CalendarCheck, tone: 'bg-teal-500/10 text-teal-600', category: 'actions' },
  voice_call: { label: 'AI voice call', description: 'A voice agent calls them', icon: PhoneCall, tone: 'bg-orange-500/10 text-orange-600', category: 'actions' },
  end: { label: 'End', description: 'Finish the flow', icon: Flag, tone: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300', category: 'end' },
}

export const CATEGORIES: { key: NodeCategory; label: string }[] = [
  { key: 'messages', label: 'Messages' },
  { key: 'logic', label: 'Logic' },
  { key: 'actions', label: 'Actions' },
  { key: 'end', label: 'Finish' },
]

// The output handles a step has. Ids must match the backend engine exactly.
export const outputsOf = (type: FlowNodeType, data: FlowNodeData): NodeOutput[] => {
  switch (type) {
    case 'buttons':
      return (data.buttons || []).map((b) => ({ id: `btn:${b.id}`, label: b.title || 'Button' }))
    case 'list':
      return (data.sections || []).flatMap((s) => s.rows || []).map((r) => ({ id: `row:${r.id}`, label: r.title || 'Option' }))
    case 'condition':
      return [{ id: 'true', label: 'Yes', tone: 'good' }, { id: 'false', label: 'No', tone: 'bad' }]
    case 'webhook':
    case 'voice_call':
      return [{ id: 'success', label: 'Success', tone: 'good' }, { id: 'error', label: 'Error', tone: 'bad' }]
    case 'appointment':
      return [{ id: 'booked', label: 'Booked', tone: 'good' }, { id: 'failed', label: 'No slots', tone: 'bad' }]
    case 'handoff':
    case 'end':
      return []
    default:
      return [{ id: 'next', label: 'Next' }]
  }
}

// Short random ids for buttons and rows: stable once created, so edges keep pointing at them.
export const shortId = (prefix = '') => `${prefix}${Math.random().toString(36).slice(2, 8)}`

export const defaultData = (type: FlowNodeType, existingVars: string[] = []): FlowNodeData => {
  const freeVar = (base: string) => {
    if (!existingVars.includes(base)) return base
    let i = 2
    while (existingVars.includes(`${base}_${i}`)) i++
    return `${base}_${i}`
  }
  switch (type) {
    case 'message':
      return { text: '' }
    case 'buttons':
      return { text: '', buttons: [{ id: shortId('b_'), title: 'Yes' }, { id: shortId('b_'), title: 'No' }] }
    case 'list':
      return { text: '', button_label: 'Choose', sections: [{ title: '', rows: [{ id: shortId('r_'), title: 'Option 1' }, { id: shortId('r_'), title: 'Option 2' }] }] }
    case 'question':
      return { text: '', variable: freeVar('answer'), validation: 'any' }
    case 'condition':
      return { match: 'all', rules: [{ subject: 'var', key: '', operator: 'equals', value: '' }] }
    case 'delay':
      return { amount: 10, unit: 'minutes' }
    case 'set_variable':
      return { variable: freeVar('value'), value: '' }
    case 'contact':
      return { fields: {}, add_group_ids: [], remove_group_ids: [], add_labels: [], remove_labels: [] }
    case 'handoff':
      return { text: 'Thanks! A team member will reply to you shortly.', status: 'pending', assign_member_id: null }
    case 'ai_reply':
      return { mode: 'once', exit_keywords: ['agent', 'human'], max_turns: 5 }
    case 'webhook':
      return {
        method: 'POST',
        url: '',
        headers: [],
        body: '{\n  "name": "{{contact.name}}",\n  "phone": "{{contact.phone}}"\n}',
        save: [],
        timeout_seconds: 8,
      }
    case 'appointment':
      return {
        text: 'Pick a time that suits you:',
        button_label: 'Choose a time',
        days_ahead: 7,
        slot_minutes: 30,
        confirm_text: "You're booked for {{appointment_date}} at {{appointment_time}}. See you then!",
        no_slots_text: '',
      }
    case 'voice_call':
      return { text: 'Our assistant will call you now.', agent_id: '', from_number: '' }
    case 'end':
      return { text: '' }
    default:
      return {}
  }
}

export const triggerSummary = (trigger: { type: string; keywords?: string[]; match?: string }) => {
  if (trigger.type === 'first_message') return 'A customer messages for the first time'
  if (trigger.type === 'any_message') return 'Any message (when nothing else matches)'
  const kws = (trigger.keywords || []).filter(Boolean)
  if (!kws.length) return 'Keyword: none set'
  return `${trigger.match === 'exact' ? 'Message is' : 'Message contains'} ${kws.map((k) => `"${k}"`).join(', ')}`
}

// A one-glance description of a step, shown on the canvas card.
export const nodePreview = (type: FlowNodeType, d: FlowNodeData): string => {
  switch (type) {
    case 'message':
      return d.text || (d.media?.url ? `📎 ${d.media.filename || d.media.type}` : '')
    case 'buttons':
    case 'list':
    case 'question':
      return d.text || ''
    case 'condition': {
      const n = d.rules?.length || 0
      const r = d.rules?.[0]
      if (!r) return 'No rules yet'
      const subject = r.subject === 'message' ? 'last message' : r.subject === 'label' ? 'chat label' : `${r.subject === 'contact' ? 'contact.' : ''}${r.key || '…'}`
      const op = { equals: '=', not_equals: '≠', contains: 'contains', starts_with: 'starts with', exists: 'is set', not_exists: 'is empty', greater_than: '>', less_than: '<' }[r.operator]
      return `${subject} ${op}${['exists', 'not_exists'].includes(r.operator) ? '' : ` "${r.value || ''}"`}${n > 1 ? ` ${d.match === 'any' ? 'or' : 'and'} ${n - 1} more` : ''}`
    }
    case 'delay':
      return `Wait ${d.amount || 0} ${d.unit || 'minutes'}`
    case 'set_variable':
      return `${d.variable || '…'} = ${d.value || '""'}`
    case 'contact': {
      const parts: string[] = []
      const fields = Object.entries(d.fields || {}).filter(([, v]) => v).map(([k]) => k.replace('_', ' '))
      if (fields.length) parts.push(`Save ${fields.join(', ')}`)
      if (d.add_group_ids?.length) parts.push(`+${d.add_group_ids.length} group`)
      if (d.add_labels?.length) parts.push(`label ${d.add_labels.join(', ')}`)
      return parts.join(' · ') || 'Nothing to change yet'
    }
    case 'handoff':
      return d.text || 'Chat goes to the inbox'
    case 'ai_reply':
      return d.mode === 'chat' ? `AI chat · up to ${d.max_turns || 5} replies` : 'AI answers the last message'
    case 'webhook':
      return `${d.method || 'POST'} ${d.url || 'no URL yet'}`
    case 'appointment':
      return d.text || ''
    case 'voice_call':
      return d.agent_id ? 'Calls the customer with an AI agent' : 'Choose an AI voice agent'
    case 'end':
      return d.text || 'Flow ends'
    default:
      return ''
  }
}

// Variables a flow defines, for the variable picker.
export const flowVariables = (nodes: { type: FlowNodeType; data: FlowNodeData }[]) => {
  const vars = new Set<string>()
  for (const n of nodes) {
    const d = n.data || {}
    if ((n.type === 'question' || n.type === 'set_variable' || n.type === 'buttons' || n.type === 'list') && d.variable) vars.add(d.variable)
    if (n.type === 'webhook') {
      vars.add('webhook_status')
      ;(d.save || []).forEach((s) => s.variable && vars.add(s.variable))
    }
    if (n.type === 'appointment') ['appointment_date', 'appointment_time', 'meet_link'].forEach((v) => vars.add(v))
    if (n.type === 'voice_call') ['call_id', 'call_error'].forEach((v) => vars.add(v))
  }
  return [...vars]
}

export const CONTACT_VARS = [
  { token: '{{contact.name}}', label: 'Contact name' },
  { token: '{{contact.first_name}}', label: 'First name' },
  { token: '{{contact.phone}}', label: 'Phone' },
  { token: '{{contact.email}}', label: 'Email' },
  { token: '{{message.text}}', label: 'Last message' },
]

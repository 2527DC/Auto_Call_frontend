export type FlowStatus = 'draft' | 'active' | 'paused'
export type TriggerType = 'keyword' | 'first_message' | 'any_message'

export type FlowNodeType =
  | 'start' | 'message' | 'buttons' | 'list' | 'question' | 'condition' | 'delay' | 'set_variable'
  | 'contact' | 'handoff' | 'ai_reply' | 'webhook' | 'appointment' | 'voice_call' | 'end'

// Step settings, per type. Every step can also carry a `label` shown on the canvas.
export interface FlowNodeData {
  label?: string
  // message
  text?: string
  media?: { type: 'image' | 'video' | 'document'; url: string; filename?: string } | null
  // buttons / list
  header?: string
  footer?: string
  variable?: string
  buttons?: { id: string; title: string }[]
  button_label?: string
  sections?: { title?: string; rows: { id: string; title: string; description?: string }[] }[]
  // question
  validation?: 'any' | 'email' | 'phone' | 'number' | 'date'
  error_text?: string
  // condition
  match?: 'all' | 'any'
  rules?: { subject: 'var' | 'contact' | 'message' | 'label'; key?: string; operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'exists' | 'not_exists' | 'greater_than' | 'less_than'; value?: string }[]
  // delay
  amount?: number
  unit?: 'minutes' | 'hours'
  // set_variable
  value?: string
  // contact
  fields?: { first_name?: string; last_name?: string; email?: string }
  add_group_ids?: string[]
  remove_group_ids?: string[]
  add_labels?: string[]
  remove_labels?: string[]
  // handoff
  assign_member_id?: string | null
  status?: 'pending' | 'open'
  note?: string
  // ai_reply
  mode?: 'once' | 'chat'
  intro_text?: string
  instructions?: string
  exit_keywords?: string[]
  max_turns?: number
  // webhook
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url?: string
  headers?: { key: string; value: string }[]
  body?: string
  save?: { variable: string; path: string }[]
  timeout_seconds?: number
  // appointment
  days_ahead?: number
  slot_minutes?: number
  max_slots?: number
  name_variable?: string
  appointment_type?: string
  send_meet_link?: boolean
  calendar_id?: string | null
  confirm_text?: string
  no_slots_text?: string
  notes?: string
  // voice_call
  agent_id?: string
  from_number?: string
}

export interface FlowNode {
  id: string
  type: FlowNodeType
  position: { x: number; y: number }
  data: FlowNodeData
}

// sourceHandle: next | true | false | success | error | booked | failed | btn:<id> | row:<id>
export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle: string
}

export interface FlowTrigger {
  type: TriggerType
  keywords: string[]
  match: 'exact' | 'contains'
}

export interface FlowSettings {
  on_unknown_reply: 'reprompt' | 'handoff' | 'end'
  max_reprompts: number
  timeout_hours: number
}

export interface WhatsappFlow {
  id: string
  name: string
  description: string
  status: FlowStatus
  trigger: FlowTrigger
  priority: number
  settings: FlowSettings
  nodes: FlowNode[]
  edges: FlowEdge[]
  stats: { runs: number; completed: number; handed_off: number; failed: number }
  created_at: string
  updated_at: string
}

export type WhatsappFlowSummary = Omit<WhatsappFlow, 'nodes' | 'edges'> & { active_runs: number }

export interface FlowTemplateInfo {
  key: string
  name: string
  description: string
}

export interface FlowValidation {
  errors: { node_id?: string; message: string }[]
  warnings: { node_id?: string; message: string }[]
}

export interface FlowRun {
  id: string
  status: 'active' | 'completed' | 'handed_off' | 'timed_out' | 'stopped' | 'failed'
  end_reason: string | null
  step: string | null
  waiting: string | null
  customer: { name: string; phone: string; conversation_id: string } | null
  vars: Record<string, unknown>
  events: { at: string; type: string; node_id?: string; detail?: string }[]
  created_at: string
  ended_at: string | null
}

export type SimMessage =
  | { type: 'text'; sender: 'bot' | 'ai'; text: string }
  | { type: 'media'; sender: 'bot'; text?: string; media: { type: string; url: string; filename?: string } }
  | { type: 'buttons'; sender: 'bot'; text: string; header?: string; footer?: string; buttons: { id: string; title: string }[] }
  | { type: 'list'; sender: 'bot'; text: string; header?: string; footer?: string; button_label: string; sections: { title?: string; rows: { id: string; title: string; description?: string }[] }[] }
  | { type: 'note'; text: string }

export interface SimResult {
  run_id: string
  status: FlowRun['status']
  end_reason: string | null
  current_node_id: string | null
  waiting: string | null
  vars: Record<string, unknown>
  messages: SimMessage[]
}

export interface BuilderOptions {
  knowledge_bases: { id: string; name: string }[]
  contact_groups: { id: string; name: string }[]
  team_members: { id: string; name: string }[]
  voice_agents: { id: string; name: string }[]
  phone_numbers: { id: string; number: string; provider: string }[]
  calendars: { id: string; name: string }[]
}

export interface WaAiSettings {
  enabled: boolean
  instructions: string
  knowledge_base_ids: string[]
  max_replies: number
  handoff_keywords: string[]
  handoff_message: string
  model: { name: string; provider: string } | null
}

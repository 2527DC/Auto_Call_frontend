export type ConversationStatus = 'open' | 'pending' | 'resolved'
export type InboxFilter = 'all' | 'mine' | 'unassigned' | 'unread'

export interface WaTeamMemberRef {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  avatar?: string | null
}

export interface WaConversation {
  id: string
  user_id: string
  wa_id: string
  profile_name: string
  status: ConversationStatus
  contact_id: { id: string; first_name: string; last_name: string; email: string; group_ids?: { id: string; group_name: string }[] } | null
  assigned_member_id: WaTeamMemberRef | null
  phone_number_id: { id: string; display_phone_number: string; verified_name?: string } | null
  labels: string[]
  unread_count: number
  last_message: { text: string; type: string; direction: 'inbound' | 'outbound' | 'internal'; at: string | null }
  last_inbound_at: string | null
  bot_paused: boolean
  ai_reply_count: number
  window_open: boolean
  window_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface WaActiveRun {
  id: string
  flow_id: string
  flow_name: string
  step: string | null
  waiting: 'reply' | 'input' | 'delay' | 'ai_chat' | 'slot' | null
  vars: Record<string, unknown>
  started_at: string
}

export type WaConversationDetail = WaConversation & { active_run: WaActiveRun | null }

export type WaMessageType =
  | 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contacts'
  | 'interactive' | 'button_reply' | 'template' | 'note' | 'event' | 'unsupported'

export interface WaInteractive {
  kind?: 'buttons' | 'list'
  text?: string
  header?: string
  footer?: string
  button_label?: string
  buttons?: { id: string; title: string }[]
  sections?: { title?: string; rows: { id: string; title: string; description?: string }[] }[]
  // An inbound tap
  id?: string
  title?: string
  description?: string | null
}

export interface WaMessage {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound' | 'internal'
  sender: 'customer' | 'agent' | 'bot' | 'ai' | 'system'
  sent_by: string | null
  type: WaMessageType
  text: string
  media: { meta_id?: string | null; url: string | null; mime_type: string | null; filename: string | null; size: number | null } | null
  location?: { latitude: number; longitude: number; name?: string; address?: string } | null
  interactive: WaInteractive | null
  template?: { name: string | null; language: string | null }
  reply_to_message_id: { id: string; text: string; type: WaMessageType; direction: string; media?: { filename?: string } } | null
  reactions: { actor: 'customer' | 'agent'; emoji: string; at: string }[]
  wamid: string | null
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received'
  error: { code: number | null; message: string | null } | null
  created_at: string
}

export interface WaConversationList {
  success: boolean
  data: WaConversation[]
  has_more: boolean
  counts: { open: number; pending: number; resolved: number; unread: number }
  labels: string[]
}

export interface WaConversationQuery {
  status?: ConversationStatus | 'all'
  filter?: InboxFilter
  search?: string
  label?: string
  before?: string
}

export interface WaTeamMember {
  id: string
  name: string
  email: string
  avatar?: string | null
  open_chats: number
}

export interface WaTemplate {
  id: string
  name: string
  language: string
  category: string
  body: string
  waba_id: string
  body_variables: number
  url_buttons: number[]
}

export interface WaQuickReply {
  id?: string
  title: string
  text: string
}

export interface WaSetup {
  // webhook_subscribed: null when Meta wouldn't say (the token can't check).
  numbers: { id: string; display_phone_number: string; verified_name?: string; webhook_subscribed: boolean | null }[]
  ai_enabled: boolean
  ai_model_configured: boolean
  webhook_path: string
}

export type WaSendBody =
  | { type: 'text'; text: string; reply_to?: string | null }
  | { type: 'note'; text: string }
  | { type: 'template'; template_id: string; body_values: string[]; button_values?: Record<number, string> }

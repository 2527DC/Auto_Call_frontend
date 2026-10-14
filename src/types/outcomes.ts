// Call outcomes (what happened on a call), lead statuses (where a person
// stands across calls) and follow-ups. Mirrors the backend's /api/outcomes.

export type OutcomeResult = 'good' | 'bad' | 'neutral'
export type OutcomeNextStep = 'none' | 'retry' | 'follow_up' | 'team_task'
export type LeadStatusKind = 'open' | 'won' | 'lost' | 'closed'
export type FollowUpMode = 'ai_call' | 'team'
export type FollowUpStatus = 'pending' | 'in_progress' | 'done' | 'missed' | 'cancelled'
export type FollowUpTab = 'due_today' | 'overdue' | 'upcoming' | 'done'

export interface OutcomeDefinition {
  key: string
  label: string
  description: string
  reached: boolean
  result: OutcomeResult
  next_step: OutcomeNextStep
  stops_calls: boolean
  lead_status: string | null
  system: boolean
  archived: boolean
  order: number
}

export interface LeadStatusDefinition {
  key: string
  label: string
  kind: LeadStatusKind
  order: number
}

export interface OutcomePreset {
  key: string
  label: string
  success: string
  fields: { key: string; label: string; type: string; options?: string[] }[]
}

export interface OutcomeSettings {
  preset: string
  success_description: string
  outcomes: OutcomeDefinition[]
  lead_statuses: LeadStatusDefinition[]
  follow_up: { mode: FollowUpMode; max_attempts: number; retry_after_hours: number; max_unreached: number }
  summary_language: string
  digest?: { enabled: boolean; email: string; whatsapp_template_id: string | null; whatsapp_to: string; last_sent_on?: string | null }
  version: number
  saved?: boolean
}

export interface OutcomeReason {
  text: string
  quote?: string
}

// Call.outcome as saved by the backend.
export interface CallOutcome {
  state?: string | null
  key: string | null
  label: string | null
  reached?: boolean | null
  result?: OutcomeResult | null
  summary?: string | null
  sentiment?: 'positive' | 'neutral' | 'negative' | null
  confidence?: number | null
  reasons?: OutcomeReason[]
  details?: Record<string, string | number | boolean>
  follow_up?: { requested?: boolean; at?: string; note?: string }
  source?: 'rule' | 'workflow' | 'live' | 'ai' | 'person' | null
  ai_suggestion?: { key?: string; label?: string; confidence?: number | null; why?: string; summary?: string } | null
  locked?: boolean
  note?: string
  error?: string | null
  set_at?: string | null
}

export interface LeadHistoryEntry {
  at: string
  from?: string
  to?: string
  source?: string
  call_id?: string
  outcome_key?: string
  note?: string
}

export interface LeadNote {
  text: string
  at: string
  by?: string | null
}

export interface LeadInfo {
  status: string
  status_label?: string
  locked?: boolean
  owner_member_id?: string | null
  last_outcome_key?: string | null
  last_outcome_label?: string | null
  last_call_id?: string | null
  last_call_at?: string | null
  last_contacted_at?: string | null
  next_follow_up_at?: string | null
  calls?: number
  unreached_streak?: number
  details?: Record<string, string | number | boolean>
  tags?: string[]
  notes?: LeadNote[]
  notes_count?: number
  history?: LeadHistoryEntry[]
  dnc?: { at?: string; reason?: string; source?: string } | null
  updated_at?: string | null
}

export interface LeadRow {
  id: string
  name: string
  first_name?: string
  last_name?: string
  phone_number: string
  email?: string
  source?: string | null
  is_blocked?: boolean
  created_at?: string
  lead: LeadInfo
}

export interface LeadsResponse {
  success: boolean
  data: LeadRow[]
  counts: Record<string, number>
  statuses: LeadStatusDefinition[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export interface LeadCall {
  id: string
  direction: 'inbound' | 'outbound'
  status: string
  duration: number
  created_at: string
  agent?: string
  campaign?: string
  recording_url?: string | null
  end_reason?: string | null
  outcome?: CallOutcome | null
  transcript?: { role: string; text: string; timestamp?: string; interrupted?: boolean; heard?: string }[]
}

export interface FollowUpRow {
  id: string
  contact_id: string | null
  name: string
  phone: string
  due_at: string
  reason: string
  note?: string
  said?: string
  mode: FollowUpMode
  status: FollowUpStatus
  attempts: number
  max_attempts: number
  error?: string | null
  closed_reason?: string | null
  closed_at?: string | null
  call_id?: string | null
  last_call_id?: string | null
  agent?: string | null
  campaign?: string | null
  assigned_member?: { id: string; name: string } | null
  created_at?: string
}

export interface LeadDetail extends LeadRow {
  calls: LeadCall[]
  appointments: { _id: string; appointment_date: string; appointment_time: string; status: string; appointment_type?: string }[]
  follow_ups: FollowUpRow[]
  statuses: LeadStatusDefinition[]
  outcomes: OutcomeDefinition[]
}

export interface FollowUpsResponse {
  success: boolean
  data: FollowUpRow[]
  counts: Record<FollowUpTab, number>
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export interface OutcomeTestResult {
  key: string
  label: string
  result?: OutcomeResult
  reached?: boolean
  lead_status: string | null
  summary?: string | null
  sentiment?: string | null
  confidence?: number | null
  reasons?: OutcomeReason[]
  details?: Record<string, string | number | boolean>
  follow_up?: { requested?: boolean; at?: string; note?: string }
  source?: string
  ai_suggestion?: CallOutcome['ai_suggestion']
  error?: string
  waiting?: string
}

export interface CampaignOutcomeCount {
  key: string
  label: string
  result: OutcomeResult
  reached: boolean
  count: number
}

export interface DashboardOutcomes {
  funnel: { calls: number; analysed: number; reached: number; good: number; goal_achieved: number }
  top: { key: string; label: string; result: OutcomeResult; reached?: boolean; count: number }[]
  follow_ups: { due_today: number; overdue: number }
}

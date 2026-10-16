export interface AiInsightModel {
  model_id: string
  provider: string
  calls_count: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost: number
  tokens_percentage: number
  cost_percentage: number
}

export interface AiInsightProvider {
  provider: string
  service: string
  usage_label: string
  usage_value: number
  cost: number
  percentage: number
}

export interface AiInsightTimeline {
  date: string
  tokens: number
  input_tokens: number
  output_tokens: number
  cost: number
  calls: number
}

export interface AiInsightClient {
  user_id: string
  name: string
  email: string
  calls_count: number
  total_tokens: number
  input_tokens: number
  output_tokens: number
  stt_minutes: number
  tts_characters: number
  cost: number
  tokens_percentage: number
  cost_percentage: number
}

export interface AiInsightPhoneNumber {
  phone_number: string
  provider: string
  calls_count: number
  inbound_calls: number
  outbound_calls: number
  duration_seconds: number
  billed_minutes: number
  telephony_cost: number
  ai_cost: number
  total_cost: number
  cost_percentage: number
  agents: string
  clients: string
}

export interface AiInsightRecentCall {
  id: string
  created_at: string
  user: {
    id: string
    name: string
    email: string
  }
  agent: {
    id: string | null
    name: string
  }
  phone_number?: string
  direction?: string
  telephony_provider?: string
  duration: number
  telephony_cost?: number
  ai_cost?: number
  cost: number
  model: string
  provider: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  stt_provider: string
  tts_provider: string
  stt_seconds: number
  tts_characters: number
}

export interface AiInsightsSummary {
  total_cost: number
  total_ai_cost?: number
  total_telephony_cost?: number
  total_telephony_minutes?: number
  cost_breakdown: {
    llm: number
    stt: number
    tts: number
    telephony?: number
  }
  total_tokens: number
  input_tokens: number
  output_tokens: number
  total_calls: number
  total_audio_minutes: number
  total_tts_chars: number
  top_model: string
  top_provider: string
  top_phone_number?: string
  avg_tokens_per_call: number
  avg_cost_per_call: number
}

export interface AiInsightsResponse {
  success: boolean
  from: string
  to: string
  filter: {
    user_id: string
    model: string
    available_models: string[]
  }
  summary: AiInsightsSummary
  models: AiInsightModel[]
  providers: AiInsightProvider[]
  phone_numbers?: AiInsightPhoneNumber[]
  timeline: AiInsightTimeline[]
  clients: AiInsightClient[]
  recent_calls: AiInsightRecentCall[]
}

export interface AiInsightsParams {
  from?: string
  to?: string
  user_id?: string
  model?: string
}

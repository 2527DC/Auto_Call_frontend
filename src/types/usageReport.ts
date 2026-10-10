export interface UsageCost {
  telephony: number
  stt: number
  tts: number
  llm: number
  sms: number
  whatsapp: number
  total: number
}

export interface UsageReportClient {
  user: { id: string; name: string; email: string; is_admin: boolean }
  plan: { name: string; price_per_credit: number } | null
  calls: number
  minutes: number
  credits_used: number
  sms: number
  whatsapp: number
  usage: { stt_minutes: number; tts_characters: number; llm_tokens: number }
  cost: UsageCost
  revenue: number
  profit: number
  margin_percent: number | null
}

export interface UsageReport {
  success: boolean
  from: string
  to: string
  clients: UsageReportClient[]
  totals: Omit<UsageReportClient, 'user' | 'plan' | 'usage'>
}

export interface VoiceCreditCost {
  provider: 'deepgram' | 'sarvam_ai' | 'elevenlabs'
  credits_per_minute: number
  estimated_cost_per_credit: number
  measured_calls: number
  measured_cost_per_credit: number | null
  cost_per_credit: number
}

export interface MessageCreditCost {
  credits_per_message: number
  cost_per_message: number
  cost_per_credit: number
}

export interface PlanCreditPrice {
  id: string
  name: string
  amount: number
  total_credits: number
  plan_type: string
  billing_cycle: string
  visibility: 'public' | 'private'
  price_per_credit: number
  margin_percent: number | null
}

export interface CreditCost {
  success: boolean
  deduction_type: 'per_minute' | 'per_call'
  measure_days: number
  min_measured_calls: number
  voices: VoiceCreditCost[]
  sms: MessageCreditCost | null
  whatsapp: MessageCreditCost | null
  cost_per_credit: number
  plans: PlanCreditPrice[]
}

export type VoiceProvider = 'deepgram' | 'sarvam_ai' | 'elevenlabs'
export type UsageProfileKey = 'light' | 'typical' | 'heavy'
export type QuoteStatus = 'draft' | 'sent' | 'negotiating' | 'won' | 'lost'

export interface UsageProfile {
  stt_seconds: number
  tts_characters: number
  llm_input_tokens: number
  llm_output_tokens: number
}

export interface ProviderRates {
  telephony_per_minute: number
  number_rental_per_month: number
  stt_per_minute: Record<VoiceProvider, number>
  tts_per_1k_chars: Record<VoiceProvider, number>
  llm_input_per_1m_tokens: number
  llm_output_per_1m_tokens: number
  sms_per_message: number
  whatsapp_per_message: number
}

export interface EstimatorPlan {
  id: string
  name: string
  amount: number
  total_credits: number
  plan_type: string
  billing_cycle: string
  visibility: 'public' | 'private'
  price_per_credit: number
}

export interface EstimatorRates {
  success: boolean
  rates: ProviderRates
  usage_profiles: Record<UsageProfileKey, UsageProfile>
  measure_days: number
  min_measured_calls: number
  measured: Record<VoiceProvider, { calls: number; cost_per_minute: number | null }>
  credits: {
    deduction_type: 'per_minute' | 'per_call'
    credits_per_minute: number
    credits_per_call: number
    credits_per_sms: number
    credits_per_whatsapp_message: number
    multipliers: Record<VoiceProvider, number>
  }
  plans: EstimatorPlan[]
}

export interface AddonInput {
  enabled: boolean
  monthly_price: number
  setup_hours: number
}

// Everything the calculator needs. Saved as-is on a quote.
export interface EstimateInputs {
  voice: {
    enabled: boolean
    direction: 'outbound' | 'inbound' | 'both'
    calls_per_month: number
    avg_minutes: number
    provider: VoiceProvider
    profile: UsageProfileKey | 'measured'
    price_per_minute: number
  }
  numbers: { enabled: boolean; count: number; price_per_number: number }
  sms: { enabled: boolean; messages_per_month: number; price_per_message: number }
  whatsapp: { enabled: boolean; messages_per_month: number; price_per_message: number; client_pays_meta: boolean }
  platform: { monthly_fee: number }
  addons: Record<string, AddonInput>
  setup: { fee: number; hourly_cost: number; extra_hours: number; extra_cost: number }
  overhead: { server_share: number; support_hours: number; support_hourly_cost: number; other: number }
  pricing: {
    discount_percent: number
    agreed_price: number | null
    gst_percent: number
    gateway_fee_percent: number
    target_margin_percent: number
    min_margin_percent: number
    contract_months: number
  }
  // Provider rates for this quote; filled from Settings and editable per quote.
  rates: ProviderRates | null
}

export interface RequirementAnswer {
  question: string
  answer: string
}

export interface QuoteOffer {
  party: 'you' | 'client'
  amount: number
  note: string
  at: string
}

export interface QuoteSummary {
  minutes: number
  monthly_cost: number
  monthly_price: number
  monthly_profit: number
  margin_percent: number | null
  setup_fee: number
  setup_cost: number
}

export interface QuoteClient {
  name: string
  company: string
  phone: string
  email: string
  industry: string
  city: string
}

export interface PriceQuotePayload {
  client: QuoteClient
  status: QuoteStatus
  inputs: EstimateInputs
  requirements: RequirementAnswer[]
  offers: QuoteOffer[]
  summary: QuoteSummary
  notes: string
}

export interface PriceQuote extends PriceQuotePayload {
  id: string
  created_by: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

export type PriceQuoteListItem = Omit<PriceQuote, 'inputs' | 'requirements'>

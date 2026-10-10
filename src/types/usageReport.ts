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

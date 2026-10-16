export interface CallCostTelephonyBreakdown {
  provider: string
  billed_minutes: number
  rate_per_minute: number
  cost: number
  percent: number
}

export interface CallCostLlmBreakdown {
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  rate_input_1m: number
  rate_output_1m: number
  cost: number
  percent: number
}

export interface CallCostSttBreakdown {
  provider: string
  seconds: number
  rate_per_minute: number
  cost: number
  percent: number
}

export interface CallCostTtsBreakdown {
  provider: string
  characters: number
  rate_per_1k: number
  cost: number
  percent: number
}

export interface CallCostBreakdownData {
  call_id: string
  created_at: string
  client: {
    id: string | null
    name: string
    email: string
  }
  agent: {
    id: string | null
    name: string
  }
  routing: {
    direction: string
    client_number: string
    app_number: string
    telephony_provider: string
  }
  duration: {
    seconds: number
    formatted: string
    billed_minutes: number
    billing_increment: string
  }
  credits_used: number
  total_cost: number
  total_ai_cost: number
  currency: string
  breakdown: {
    telephony: CallCostTelephonyBreakdown
    llm: CallCostLlmBreakdown
    stt: CallCostSttBreakdown
    tts: CallCostTtsBreakdown
  }
}

export interface CallCostResponse {
  success: boolean
  data: CallCostBreakdownData
}

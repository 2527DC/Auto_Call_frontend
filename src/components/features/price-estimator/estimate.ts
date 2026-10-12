import {
  EstimateInputs,
  EstimatorRates,
  ProviderRates,
  QuoteSummary,
  RequirementAnswer,
  UsageProfileKey,
  VoiceProvider,
} from '@/types/priceEstimator'

export const VOICE_LABELS: Record<VoiceProvider, string> = { deepgram: 'Deepgram', sarvam_ai: 'Sarvam AI', elevenlabs: 'ElevenLabs' }

// Platform modules that cost you nothing per use but take set-up time and can be
// charged as monthly add-ons. Hours are a rough first estimate; edit them per deal.
export const ADDONS: { key: string; label: string; hint: string; setup_hours: number }[] = [
  { key: 'voice_agents', label: 'AI voice agents', hint: 'Prompt, voice and script per agent', setup_hours: 3 },
  { key: 'workflows', label: 'Workflow builder flows', hint: 'Bookings, transfers, verification, follow-ups', setup_hours: 4 },
  { key: 'knowledge_base', label: 'Knowledge base', hint: 'Upload and tune the client\'s documents', setup_hours: 2 },
  { key: 'campaigns', label: 'AI calling campaigns', hint: 'Outbound campaigns from contact lists', setup_hours: 1 },
  { key: 'contact_hub', label: 'Contact hub & groups', hint: 'Import and segment contacts', setup_hours: 1 },
  { key: 'appointments', label: 'Appointment booking', hint: 'Google Calendar booking on calls', setup_hours: 2 },
  { key: 'google_sheets', label: 'Google Sheets sync', hint: 'Push call results to a sheet', setup_hours: 1 },
  { key: 'lead_forms', label: 'Lead capture forms', hint: 'Forms that trigger calls', setup_hours: 1 },
  { key: 'widget', label: 'Website voice widget', hint: 'Embeddable talk-to-AI button', setup_hours: 1 },
  { key: 'sms_agents', label: 'AI SMS agents', hint: 'AI replies to SMS (needs DLT)', setup_hours: 2 },
  { key: 'api_webhooks', label: 'API & webhooks / CRM', hint: 'Custom integration with their CRM', setup_hours: 6 },
  { key: 'whatsapp_calls', label: 'WhatsApp AI voice calls', hint: 'AI answers WhatsApp calls', setup_hours: 3 },
]

// What to ask a prospect before quoting, grouped as you'd walk through a call.
export const DEFAULT_QUESTIONS: { group: string; question: string }[] = [
  { group: 'Business', question: 'What does the business do, and who are its customers?' },
  { group: 'Business', question: 'What should the AI achieve: lead qualification, reminders, support, collections or bookings?' },
  { group: 'Volume', question: 'Inbound, outbound or both? How many calls a day?' },
  { group: 'Volume', question: 'How long is a typical call? What share of dialled calls get answered?' },
  { group: 'Volume', question: 'Peak hours, and how many calls must run at the same time?' },
  { group: 'Voice', question: 'Which languages: Hindi, Hinglish, Kannada, Tamil, Telugu, English…?' },
  { group: 'Voice', question: 'Is a premium voice (ElevenLabs) needed, or is a standard voice fine?' },
  { group: 'Numbers & compliance', question: 'Our +91 number, or their own SIP trunk / number forwarding?' },
  { group: 'Numbers & compliance', question: 'Is DLT registration done for SMS? Do contacts consent to calls (TRAI / DPDP)?' },
  { group: 'Integrations', question: 'Which CRM, Google Sheets or Calendar must be connected?' },
  { group: 'Integrations', question: 'Do they have a Meta WhatsApp Business account? Who pays Meta?' },
  { group: 'Commercials', question: 'What budget per month do they have in mind? What are they paying today?' },
  { group: 'Commercials', question: 'Who decides, and by when? Which competitors are they comparing (Bolna, Ringg, Tabbly…)?' },
  { group: 'Commercials', question: 'Contract length, payment terms (prepaid monthly / quarterly) and go-live date?' },
]

export const defaultRequirements = (): RequirementAnswer[] => DEFAULT_QUESTIONS.map((q) => ({ question: q.question, answer: '' }))

export const defaultInputs = (rates: ProviderRates | null): EstimateInputs => ({
  voice: { enabled: true, direction: 'outbound', calls_per_month: 3000, avg_minutes: 1, provider: 'deepgram', profile: 'typical', price_per_minute: 5 },
  numbers: { enabled: true, count: 1, price_per_number: 499 },
  sms: { enabled: false, messages_per_month: 1000, price_per_message: 0.5 },
  whatsapp: { enabled: false, messages_per_month: 1000, price_per_message: 0.5, client_pays_meta: true },
  platform: { monthly_fee: 0 },
  addons: Object.fromEntries(ADDONS.map((a) => [a.key, {
    enabled: a.key === 'voice_agents' || a.key === 'workflows',
    monthly_price: 0,
    setup_hours: a.setup_hours,
  }])),
  setup: { fee: 9999, hourly_cost: 500, extra_hours: 0, extra_cost: 0 },
  overhead: { server_share: 500, support_hours: 2, support_hourly_cost: 500, other: 0 },
  pricing: {
    discount_percent: 0,
    agreed_price: null,
    gst_percent: 18,
    gateway_fee_percent: 2,
    target_margin_percent: 60,
    min_margin_percent: 35,
    contract_months: 12,
  },
  rates,
})

// Fills in anything a quote saved by an older version of the screen doesn't have.
export const withDefaults = (saved: Partial<EstimateInputs> | undefined, rates: ProviderRates | null): EstimateInputs => {
  const base = defaultInputs(rates)
  if (!saved) return base
  return {
    voice: { ...base.voice, ...saved.voice },
    numbers: { ...base.numbers, ...saved.numbers },
    sms: { ...base.sms, ...saved.sms },
    whatsapp: { ...base.whatsapp, ...saved.whatsapp },
    platform: { ...base.platform, ...saved.platform },
    addons: Object.fromEntries(ADDONS.map((a) => [a.key, { ...base.addons[a.key], ...saved.addons?.[a.key] }])),
    setup: { ...base.setup, ...saved.setup },
    overhead: { ...base.overhead, ...saved.overhead },
    pricing: { ...base.pricing, ...saved.pricing },
    rates: saved.rates || rates,
  }
}

const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0)

export interface ModuleLine {
  key: string
  label: string
  detail: string
  cost: number
  price: number
}

export interface Estimate {
  minutes: number
  lines: ModuleLine[]
  voiceCost: { telephony: number; stt: number; tts: number; llm: number; measured: number }
  costPerMinute: number
  listPrice: number
  discountedPrice: number
  dealPrice: number
  gatewayFee: number
  monthlyCost: number
  monthlyProfit: number
  marginPercent: number | null
  breakEvenPrice: number
  floorPrice: number
  targetPrice: number
  maxDiscountPercent: number
  pricePerMinute: number | null
  setup: { fee: number; hours: number; cost: number; profit: number }
  contract: { months: number; value: number; profit: number; paybackMonths: number | null }
  invoice: { monthly: number; setup: number }
  credits: { total: number; pricePerCredit: number | null; costPerCredit: number | null }
  warnings: string[]
}

// Voice cost for a month at a given usage profile and volume.
const voiceCost = (inputs: EstimateInputs, data: EstimatorRates, profileOverride?: UsageProfileKey, volumeFactor = 1) => {
  const v = inputs.voice
  const rates = inputs.rates || data.rates
  const calls = n(v.calls_per_month) * volumeFactor
  const minutes = calls * n(v.avg_minutes)
  const empty = { telephony: 0, stt: 0, tts: 0, llm: 0, measured: 0 }
  if (!v.enabled || minutes === 0) return { minutes: 0, ...empty }

  const profile = profileOverride || v.profile
  const measured = data.measured[v.provider]?.cost_per_minute
  if (profile === 'measured' && measured != null) return { minutes, ...empty, measured: minutes * measured }

  const usage = data.usage_profiles[profile === 'measured' ? 'typical' : profile]
  // Plivo bills each call in 30-second steps.
  const billedPerCall = Math.ceil(n(v.avg_minutes) * 2) / 2
  return {
    minutes,
    telephony: calls * billedPerCall * n(rates.telephony_per_minute),
    stt: minutes * (usage.stt_seconds / 60) * n(rates.stt_per_minute[v.provider]),
    tts: minutes * (usage.tts_characters / 1000) * n(rates.tts_per_1k_chars[v.provider]),
    llm: minutes * ((usage.llm_input_tokens / 1e6) * n(rates.llm_input_per_1m_tokens) + (usage.llm_output_tokens / 1e6) * n(rates.llm_output_per_1m_tokens)),
    measured: 0,
  }
}

// Profit after the payment gateway's cut, which it takes on the GST-inclusive amount.
export const profitAt = (price: number, monthlyCost: number, inputs: EstimateInputs) => {
  const fee = price * (1 + n(inputs.pricing.gst_percent) / 100) * (n(inputs.pricing.gateway_fee_percent) / 100)
  return price - fee - monthlyCost
}

export const marginAt = (price: number, monthlyCost: number, inputs: EstimateInputs) =>
  price > 0 ? (profitAt(price, monthlyCost, inputs) / price) * 100 : null

// Monthly profit if usage turns out different from the estimate, with the deal price unchanged.
export const scenarioProfit = (inputs: EstimateInputs, data: EstimatorRates, est: Estimate, profile?: UsageProfileKey, volumeFactor = 1) => {
  const base = voiceCost(inputs, data)
  const alt = voiceCost(inputs, data, profile, volumeFactor)
  const extraCost = (alt.telephony + alt.stt + alt.tts + alt.llm + alt.measured) - (base.telephony + base.stt + base.tts + base.llm + base.measured)
  const cost = est.monthlyCost + extraCost
  return { cost, profit: profitAt(est.dealPrice, cost, inputs), margin: marginAt(est.dealPrice, cost, inputs) }
}

export const estimate = (inputs: EstimateInputs, data: EstimatorRates): Estimate => {
  const rates = inputs.rates || data.rates
  const p = inputs.pricing
  const warnings: string[] = []
  const lines: ModuleLine[] = []

  const vc = voiceCost(inputs, data)
  const voiceTotal = vc.telephony + vc.stt + vc.tts + vc.llm + vc.measured
  if (inputs.voice.enabled) {
    lines.push({
      key: 'voice',
      label: 'AI voice calls',
      detail: `${Math.round(vc.minutes).toLocaleString('en-IN')} min · ${VOICE_LABELS[inputs.voice.provider]}`,
      cost: voiceTotal,
      price: vc.minutes * n(inputs.voice.price_per_minute),
    })
    if (inputs.voice.profile === 'measured' && data.measured[inputs.voice.provider]?.cost_per_minute == null) {
      warnings.push(`Not enough real ${VOICE_LABELS[inputs.voice.provider]} calls yet to measure cost; using the typical estimate.`)
    }
  }

  if (inputs.numbers.enabled) {
    const count = n(inputs.numbers.count)
    lines.push({
      key: 'numbers',
      label: 'Phone numbers',
      detail: `${count} × +91 number`,
      cost: count * n(rates.number_rental_per_month),
      price: count * n(inputs.numbers.price_per_number),
    })
  }

  if (inputs.sms.enabled) {
    const msgs = n(inputs.sms.messages_per_month)
    lines.push({ key: 'sms', label: 'SMS', detail: `${msgs.toLocaleString('en-IN')} messages`, cost: msgs * n(rates.sms_per_message), price: msgs * n(inputs.sms.price_per_message) })
    if (msgs > 0 && n(rates.sms_per_message) === 0) warnings.push('Your SMS cost is ₹0. Enter the real per-SMS rate (incl. DLT scrubbing) under "Provider rates" or SMS profit will look higher than it is.')
  }

  if (inputs.whatsapp.enabled) {
    const msgs = n(inputs.whatsapp.messages_per_month)
    const cost = inputs.whatsapp.client_pays_meta ? 0 : msgs * n(rates.whatsapp_per_message)
    lines.push({ key: 'whatsapp', label: 'WhatsApp messages', detail: `${msgs.toLocaleString('en-IN')} messages${inputs.whatsapp.client_pays_meta ? ' · client pays Meta' : ''}`, cost, price: msgs * n(inputs.whatsapp.price_per_message) })
    if (!inputs.whatsapp.client_pays_meta && msgs > 0 && n(rates.whatsapp_per_message) === 0) warnings.push('Your WhatsApp cost is ₹0 but you pay Meta for this client. Enter Meta\'s per-message rate under "Provider rates".')
  }

  const enabledAddons = ADDONS.filter((a) => inputs.addons[a.key]?.enabled)
  const addonPrice = enabledAddons.reduce((s, a) => s + n(inputs.addons[a.key].monthly_price), 0)
  const platformPrice = n(inputs.platform.monthly_fee) + addonPrice
  if (platformPrice > 0 || enabledAddons.length > 0) {
    lines.push({ key: 'platform', label: 'Platform & modules', detail: `${enabledAddons.length} modules`, cost: 0, price: platformPrice })
  }

  const o = inputs.overhead
  const overheadCost = n(o.server_share) + n(o.support_hours) * n(o.support_hourly_cost) + n(o.other)
  lines.push({ key: 'overhead', label: 'Server, support & other', detail: `${n(o.support_hours)} h support / month`, cost: overheadCost, price: 0 })

  const monthlyCost = lines.reduce((s, l) => s + l.cost, 0)
  const listPrice = lines.reduce((s, l) => s + l.price, 0)
  const discountedPrice = listPrice * (1 - Math.min(n(p.discount_percent), 100) / 100)
  const dealPrice = p.agreed_price != null && p.agreed_price >= 0 ? p.agreed_price : discountedPrice

  const gatewayRate = (1 + n(p.gst_percent) / 100) * (n(p.gateway_fee_percent) / 100)
  const gatewayFee = dealPrice * gatewayRate
  const monthlyProfit = dealPrice - gatewayFee - monthlyCost
  const marginPercent = dealPrice > 0 ? (monthlyProfit / dealPrice) * 100 : null

  // Price P with margin m: P − P·gatewayRate − cost = m·P  →  P = cost / (1 − gatewayRate − m)
  const priceForMargin = (m: number) => {
    const d = 1 - gatewayRate - m / 100
    return d > 0 ? monthlyCost / d : Infinity
  }
  const breakEvenPrice = priceForMargin(0)
  const floorPrice = priceForMargin(n(p.min_margin_percent))
  const targetPrice = priceForMargin(n(p.target_margin_percent))
  const maxDiscountPercent = listPrice > 0 ? Math.max(0, ((listPrice - floorPrice) / listPrice) * 100) : 0

  const setupHours = enabledAddons.reduce((s, a) => s + n(inputs.addons[a.key].setup_hours), 0) + n(inputs.setup.extra_hours)
  const setupCost = setupHours * n(inputs.setup.hourly_cost) + n(inputs.setup.extra_cost)
  const setupFee = n(inputs.setup.fee)
  const setupProfit = setupFee - setupFee * gatewayRate - setupCost

  const months = Math.max(1, Math.round(n(p.contract_months)) || 1)
  const contractProfit = setupProfit + months * monthlyProfit
  const paybackMonths = setupProfit >= 0 ? 0 : monthlyProfit > 0 ? Math.ceil(-setupProfit / monthlyProfit) : null

  // The same deal sold as a private credit plan.
  const c = data.credits
  const multiplier = n(c.multipliers[inputs.voice.provider]) || 1
  const voiceCredits = !inputs.voice.enabled ? 0 : c.deduction_type === 'per_minute'
    ? n(inputs.voice.calls_per_month) * Math.ceil(Math.ceil(n(inputs.voice.avg_minutes)) * (c.credits_per_minute || 1) * multiplier)
    : n(inputs.voice.calls_per_month) * Math.ceil((c.credits_per_call || 1) * multiplier)
  const smsCredits = inputs.sms.enabled ? n(inputs.sms.messages_per_month) * n(c.credits_per_sms) : 0
  const waCredits = inputs.whatsapp.enabled ? n(inputs.whatsapp.messages_per_month) * n(c.credits_per_whatsapp_message) : 0
  const totalCredits = voiceCredits + smsCredits + waCredits

  if (listPrice === 0) warnings.push('Nothing is priced yet. Set a price per minute or a monthly platform fee.')
  if (dealPrice > 0 && dealPrice < breakEvenPrice) warnings.push('At this price you lose money every month.')
  if (vc.minutes > 0 && dealPrice / vc.minutes < 3) warnings.push('Below ₹3 a minute all-in. Indian AI calling sells at about ₹4–6 a minute.')

  return {
    minutes: vc.minutes,
    lines,
    voiceCost: { telephony: vc.telephony, stt: vc.stt, tts: vc.tts, llm: vc.llm, measured: vc.measured },
    costPerMinute: vc.minutes > 0 ? voiceTotal / vc.minutes : 0,
    listPrice,
    discountedPrice,
    dealPrice,
    gatewayFee,
    monthlyCost,
    monthlyProfit,
    marginPercent,
    breakEvenPrice,
    floorPrice,
    targetPrice,
    maxDiscountPercent,
    pricePerMinute: vc.minutes > 0 ? dealPrice / vc.minutes : null,
    setup: { fee: setupFee, hours: setupHours, cost: setupCost, profit: setupProfit },
    contract: { months, value: setupFee + months * dealPrice, profit: contractProfit, paybackMonths },
    invoice: { monthly: dealPrice * (1 + n(p.gst_percent) / 100), setup: setupFee * (1 + n(p.gst_percent) / 100) },
    credits: {
      total: totalCredits,
      pricePerCredit: totalCredits > 0 ? dealPrice / totalCredits : null,
      costPerCredit: totalCredits > 0 ? (monthlyCost - overheadCost) / totalCredits : null,
    },
    warnings,
  }
}

export type Verdict = 'loss' | 'thin' | 'healthy' | 'excellent'

export const verdictFor = (margin: number | null, inputs: EstimateInputs): Verdict => {
  if (margin === null || margin < 0) return 'loss'
  if (margin < n(inputs.pricing.min_margin_percent)) return 'thin'
  if (margin < n(inputs.pricing.target_margin_percent)) return 'healthy'
  return 'excellent'
}

export const toSummary = (est: Estimate): QuoteSummary => ({
  minutes: est.minutes,
  monthly_cost: est.monthlyCost,
  monthly_price: est.dealPrice,
  monthly_profit: est.monthlyProfit,
  margin_percent: est.marginPercent,
  setup_fee: est.setup.fee,
  setup_cost: est.setup.cost,
})

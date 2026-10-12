import {
  EstimateInputs,
  EstimatorRates,
  ProviderRates,
  QuoteSummary,
  RequirementAnswer,
  UsageProfile,
  VoiceProvider,
  VoiceUnitCosts,
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

const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0)

// What one minute of talk costs with this voice at the provider rates in Settings:
// how long the caller speaks, how many characters the agent says and how many
// tokens the AI model reads and writes in a minute.
export const settingsUnitCosts = (rates: ProviderRates, provider: VoiceProvider, usage: UsageProfile): VoiceUnitCosts => ({
  stt: (usage.stt_seconds / 60) * n(rates.stt_per_minute[provider]),
  tts: (usage.tts_characters / 1000) * n(rates.tts_per_1k_chars[provider]),
  llm: (usage.llm_input_tokens / 1e6) * n(rates.llm_input_per_1m_tokens) + (usage.llm_output_tokens / 1e6) * n(rates.llm_output_per_1m_tokens),
})

export const unitCostsFor = (inputs: EstimateInputs, data: EstimatorRates): VoiceUnitCosts =>
  inputs.voice.unit_costs || settingsUnitCosts(inputs.rates || data.rates, inputs.voice.provider, data.usage_profiles.typical)

// Plivo bills each call in 30-second steps.
export const billedMinutesPerCall = (avgMinutes: number) => Math.ceil(n(avgMinutes) * 2) / 2

export const defaultInputs = (rates: ProviderRates | null): EstimateInputs => ({
  voice: { enabled: true, direction: 'outbound', calls_per_month: 3000, avg_minutes: 1, provider: 'deepgram', unit_costs: null, price_per_minute: 5 },
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
    interstate: false,
    gateway_fee_percent: 2,
    target_margin_percent: 60,
    min_margin_percent: 35,
    contract_months: 12,
  },
  rates,
})

// Fills in anything a quote saved by an older version of the screen doesn't have.
export const withDefaults = (saved: Partial<EstimateInputs> | undefined, data: EstimatorRates): EstimateInputs => {
  const base = defaultInputs(data.rates)
  if (!saved) return base
  const rates = saved.rates || data.rates
  const voice = { ...base.voice, ...saved.voice }
  voice.unit_costs = voice.unit_costs ?? null
  // Older quotes picked a light / heavy talk profile; keep their cost as it was.
  if (saved.voice && saved.voice.unit_costs === undefined && (saved.voice.profile === 'light' || saved.voice.profile === 'heavy')) {
    voice.unit_costs = settingsUnitCosts(rates, voice.provider, data.usage_profiles[saved.voice.profile])
  }
  delete voice.profile
  return {
    voice,
    numbers: { ...base.numbers, ...saved.numbers },
    sms: { ...base.sms, ...saved.sms },
    whatsapp: { ...base.whatsapp, ...saved.whatsapp },
    platform: { ...base.platform, ...saved.platform },
    addons: Object.fromEntries(ADDONS.map((a) => [a.key, { ...base.addons[a.key], ...saved.addons?.[a.key] }])),
    setup: { ...base.setup, ...saved.setup },
    overhead: { ...base.overhead, ...saved.overhead },
    pricing: { ...base.pricing, ...saved.pricing },
    rates,
  }
}

export type ModuleKey = 'voice' | 'numbers' | 'sms' | 'whatsapp' | 'platform' | 'overhead'

// One row of the price calculation: quantity × rate = amount.
export interface SheetItem {
  key: string
  module: ModuleKey
  label: string
  qty: number
  unit: string
  rate: number
  amount: number
  note?: string
}

export interface ModuleLine {
  key: ModuleKey
  label: string
  detail: string
  cost: number
  price: number
}

export interface Estimate {
  minutes: number
  unitCosts: VoiceUnitCosts
  priceItems: SheetItem[]
  costItems: SheetItem[]
  setupCostItems: SheetItem[]
  lines: ModuleLine[]
  costPerMinute: number
  listPrice: number
  discountedPrice: number
  dealPrice: number
  adjustment: number
  gatewayRate: number
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
  gst: { monthly: number; setup: number }
  invoice: { monthly: number; setup: number }
  credits: { total: number; pricePerCredit: number | null; costPerCredit: number | null }
  warnings: string[]
}

const MODULE_LABELS: Record<ModuleKey, string> = {
  voice: 'AI voice calls',
  numbers: 'Phone numbers',
  sms: 'SMS',
  whatsapp: 'WhatsApp messages',
  platform: 'Platform & modules',
  overhead: 'Server, support & other',
}

const item = (key: string, module: ModuleKey, label: string, qty: number, unit: string, rate: number, note?: string): SheetItem =>
  ({ key, module, label, qty, unit, rate, amount: qty * rate, note })

// Profit after the payment gateway's cut, which it takes on the GST-inclusive amount.
export const profitAt = (price: number, monthlyCost: number, inputs: EstimateInputs) => {
  const fee = price * (1 + n(inputs.pricing.gst_percent) / 100) * (n(inputs.pricing.gateway_fee_percent) / 100)
  return price - fee - monthlyCost
}

export const marginAt = (price: number, monthlyCost: number, inputs: EstimateInputs) =>
  price > 0 ? (profitAt(price, monthlyCost, inputs) / price) * 100 : null

export const estimate = (inputs: EstimateInputs, data: EstimatorRates): Estimate => {
  const rates = inputs.rates || data.rates
  const p = inputs.pricing
  const v = inputs.voice
  const warnings: string[] = []
  const priceItems: SheetItem[] = []
  const costItems: SheetItem[] = []

  const unitCosts = unitCostsFor(inputs, data)
  const calls = v.enabled ? n(v.calls_per_month) : 0
  const minutes = calls * n(v.avg_minutes)
  if (v.enabled) {
    const voice = VOICE_LABELS[v.provider]
    priceItems.push(item('voice', 'voice', 'AI voice calls', minutes, 'min', n(v.price_per_minute)))
    costItems.push(
      item('telephony', 'voice', 'Phone line (Plivo, billed per 30 s)', calls * billedMinutesPerCall(v.avg_minutes), 'billed min', n(rates.telephony_per_minute)),
      item('stt', 'voice', `Speech-to-text (${voice})`, minutes, 'min', n(unitCosts.stt)),
      item('tts', 'voice', `AI voice (${voice})`, minutes, 'min', n(unitCosts.tts)),
      item('llm', 'voice', 'AI model', minutes, 'min', n(unitCosts.llm)),
    )
  }

  if (inputs.numbers.enabled) {
    const count = n(inputs.numbers.count)
    priceItems.push(item('numbers', 'numbers', 'Dedicated +91 phone number', count, 'number', n(inputs.numbers.price_per_number)))
    costItems.push(item('numbers', 'numbers', 'Number rental (Plivo)', count, 'number', n(rates.number_rental_per_month)))
  }

  if (inputs.sms.enabled) {
    const msgs = n(inputs.sms.messages_per_month)
    priceItems.push(item('sms', 'sms', 'SMS', msgs, 'SMS', n(inputs.sms.price_per_message)))
    costItems.push(item('sms', 'sms', 'SMS (provider + DLT)', msgs, 'SMS', n(rates.sms_per_message)))
    if (msgs > 0 && n(rates.sms_per_message) === 0) warnings.push('Your SMS cost is ₹0. Enter the real per-SMS rate (incl. DLT scrubbing) under "Provider rates" or SMS profit will look higher than it is.')
  }

  if (inputs.whatsapp.enabled) {
    const msgs = n(inputs.whatsapp.messages_per_month)
    const clientPays = inputs.whatsapp.client_pays_meta
    priceItems.push(item('whatsapp', 'whatsapp', 'WhatsApp messages', msgs, 'message', n(inputs.whatsapp.price_per_message)))
    costItems.push(item('whatsapp', 'whatsapp', 'WhatsApp (Meta)', msgs, 'message', clientPays ? 0 : n(rates.whatsapp_per_message), clientPays ? 'Client pays Meta' : undefined))
    if (!clientPays && msgs > 0 && n(rates.whatsapp_per_message) === 0) warnings.push('Your WhatsApp cost is ₹0 but you pay Meta for this client. Enter Meta\'s per-message rate under "Provider rates".')
  }

  const enabledAddons = ADDONS.filter((a) => inputs.addons[a.key]?.enabled)
  if (n(inputs.platform.monthly_fee) > 0) priceItems.push(item('platform', 'platform', 'Platform fee', 1, 'month', n(inputs.platform.monthly_fee)))
  for (const a of enabledAddons) {
    const price = n(inputs.addons[a.key].monthly_price)
    priceItems.push(item(`addon-${a.key}`, 'platform', a.label, 1, 'month', price, price === 0 ? 'Included' : undefined))
  }

  const o = inputs.overhead
  if (n(o.server_share) > 0) costItems.push(item('server', 'overhead', 'Server & database share', 1, 'month', n(o.server_share)))
  if (n(o.support_hours) > 0) costItems.push(item('support', 'overhead', 'Support', n(o.support_hours), 'h', n(o.support_hourly_cost)))
  if (n(o.other) > 0) costItems.push(item('other', 'overhead', 'Other monthly costs', 1, 'month', n(o.other)))

  const sum = (items: SheetItem[]) => items.reduce((s, i) => s + i.amount, 0)
  const monthlyCost = sum(costItems)
  const listPrice = sum(priceItems)
  const discountedPrice = listPrice * (1 - Math.min(n(p.discount_percent), 100) / 100)
  const dealPrice = p.agreed_price != null && p.agreed_price >= 0 ? p.agreed_price : discountedPrice

  const gstRate = n(p.gst_percent) / 100
  const gatewayRate = (1 + gstRate) * (n(p.gateway_fee_percent) / 100)
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

  const hourly = n(inputs.setup.hourly_cost)
  const setupCostItems: SheetItem[] = [
    ...enabledAddons.filter((a) => n(inputs.addons[a.key].setup_hours) > 0)
      .map((a) => item(`setup-${a.key}`, 'platform', `${a.label} set-up`, n(inputs.addons[a.key].setup_hours), 'h', hourly)),
    ...(n(inputs.setup.extra_hours) > 0 ? [item('setup-extra', 'platform', 'Custom work', n(inputs.setup.extra_hours), 'h', hourly)] : []),
    ...(n(inputs.setup.extra_cost) > 0 ? [item('setup-other', 'platform', 'Other one-time costs', 1, 'lot', n(inputs.setup.extra_cost))] : []),
  ]
  const setupHours = setupCostItems.filter((i) => i.unit === 'h').reduce((s, i) => s + i.qty, 0)
  const setupCost = sum(setupCostItems)
  const setupFee = n(inputs.setup.fee)
  const setupProfit = setupFee - setupFee * gatewayRate - setupCost

  const months = Math.max(1, Math.round(n(p.contract_months)) || 1)
  const contractProfit = setupProfit + months * monthlyProfit
  const paybackMonths = setupProfit >= 0 ? 0 : monthlyProfit > 0 ? Math.ceil(-setupProfit / monthlyProfit) : null

  const details: Record<ModuleKey, string> = {
    voice: `${Math.round(minutes).toLocaleString('en-IN')} min · ${VOICE_LABELS[v.provider]}`,
    numbers: `${n(inputs.numbers.count)} × +91 number`,
    sms: `${n(inputs.sms.messages_per_month).toLocaleString('en-IN')} messages`,
    whatsapp: `${n(inputs.whatsapp.messages_per_month).toLocaleString('en-IN')} messages`,
    platform: `${enabledAddons.length} modules`,
    overhead: `${n(o.support_hours)} h support / month`,
  }
  const allItems = [...priceItems, ...costItems]
  const lines: ModuleLine[] = (Object.keys(MODULE_LABELS) as ModuleKey[])
    .filter((key) => allItems.some((i) => i.module === key))
    .map((key) => ({
      key,
      label: MODULE_LABELS[key],
      detail: details[key],
      price: sum(priceItems.filter((i) => i.module === key)),
      cost: sum(costItems.filter((i) => i.module === key)),
    }))

  // The same deal sold as a private credit plan.
  const c = data.credits
  const multiplier = n(c.multipliers[v.provider]) || 1
  const voiceCredits = !v.enabled ? 0 : c.deduction_type === 'per_minute'
    ? calls * Math.ceil(Math.ceil(n(v.avg_minutes)) * (c.credits_per_minute || 1) * multiplier)
    : calls * Math.ceil((c.credits_per_call || 1) * multiplier)
  const smsCredits = inputs.sms.enabled ? n(inputs.sms.messages_per_month) * n(c.credits_per_sms) : 0
  const waCredits = inputs.whatsapp.enabled ? n(inputs.whatsapp.messages_per_month) * n(c.credits_per_whatsapp_message) : 0
  const totalCredits = voiceCredits + smsCredits + waCredits
  const usageCost = sum(costItems.filter((i) => i.module !== 'overhead'))

  if (listPrice === 0) warnings.push('Nothing is priced yet. Set a price per minute or a monthly platform fee.')
  if (dealPrice > 0 && dealPrice < breakEvenPrice) warnings.push('At this price you lose money every month.')
  if (minutes > 0 && dealPrice / minutes < 3) warnings.push('Below ₹3 a minute all-in. Indian AI calling sells at about ₹4–6 a minute.')

  const voiceCost = sum(costItems.filter((i) => i.module === 'voice'))
  return {
    minutes,
    unitCosts,
    priceItems,
    costItems,
    setupCostItems,
    lines,
    costPerMinute: minutes > 0 ? voiceCost / minutes : 0,
    listPrice,
    discountedPrice,
    dealPrice,
    adjustment: dealPrice - listPrice,
    gatewayRate,
    gatewayFee,
    monthlyCost,
    monthlyProfit,
    marginPercent,
    breakEvenPrice,
    floorPrice,
    targetPrice,
    maxDiscountPercent,
    pricePerMinute: minutes > 0 ? dealPrice / minutes : null,
    setup: { fee: setupFee, hours: setupHours, cost: setupCost, profit: setupProfit },
    contract: { months, value: setupFee + months * dealPrice, profit: contractProfit, paybackMonths },
    gst: { monthly: dealPrice * gstRate, setup: setupFee * gstRate },
    invoice: { monthly: dealPrice * (1 + gstRate), setup: setupFee * (1 + gstRate) },
    credits: {
      total: totalCredits,
      pricePerCredit: totalCredits > 0 ? dealPrice / totalCredits : null,
      costPerCredit: totalCredits > 0 ? usageCost / totalCredits : null,
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

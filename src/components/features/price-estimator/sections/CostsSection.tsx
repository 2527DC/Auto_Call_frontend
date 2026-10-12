'use client'

import { Button } from '@/components/ui/button'
import { EstimateInputs, EstimatorRates, ProviderRates, VoiceProvider } from '@/types/priceEstimator'
import { ChevronDown, RotateCcw, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Estimate, VOICE_LABELS } from '../estimate'
import { NumberField, rupees, Section } from '../fields'

const Group = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-semibold text-title">{title}</h3>
      <p className="text-xs text-subtitle-color">{description}</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{children}</div>
  </div>
)

const CostsSection = ({ inputs, data, est, onChange }: {
  inputs: EstimateInputs
  data: EstimatorRates
  est: Estimate
  onChange: (next: EstimateInputs) => void
}) => {
  const [showRates, setShowRates] = useState(false)
  const set = <K extends 'setup' | 'overhead' | 'pricing'>(key: K, patch: Partial<EstimateInputs[K]>) =>
    onChange({ ...inputs, [key]: { ...inputs[key], ...patch } })

  const rates = inputs.rates || data.rates
  const setRate = (patch: Partial<ProviderRates>) => onChange({ ...inputs, rates: { ...rates, ...patch } })
  const setVoiceRate = (key: 'stt_per_minute' | 'tts_per_1k_chars', p: VoiceProvider, value: number) =>
    setRate({ [key]: { ...rates[key], [p]: value } })
  const ratesEdited = JSON.stringify(rates) !== JSON.stringify(data.rates)
  const supportCost = inputs.overhead.support_hours * inputs.overhead.support_hourly_cost

  return (
    <Section step={4} icon={Wallet} title="Your costs & pricing rules" description="Set-up effort, the monthly overheads this client adds, and the margins you won't go below.">
      <div className="space-y-6">
        <Group title="One-time set-up" description={`${est.setup.hours} hours from the modules above plus extra hours · costs you ${rupees(est.setup.cost)}`}>
          <NumberField label="Set-up fee you charge" prefix="₹" value={inputs.setup.fee} onChange={(fee) => set('setup', { fee })} hint="Building flows, scripts, testing" />
          <NumberField label="Your cost per hour" prefix="₹" value={inputs.setup.hourly_cost} onChange={(hourly_cost) => set('setup', { hourly_cost })} hint="Your or a developer's time" />
          <NumberField label="Extra hours (custom work)" suffix="h" value={inputs.setup.extra_hours} onChange={(extra_hours) => set('setup', { extra_hours })} />
          <NumberField label="Other one-time costs" prefix="₹" value={inputs.setup.extra_cost} onChange={(extra_cost) => set('setup', { extra_cost })} hint="DLT registration, number KYC, travel" />
        </Group>

        <Group title="Monthly overheads for this client" description={`Support costs ${rupees(supportCost)} a month`}>
          <NumberField label="Server & database share" prefix="₹" value={inputs.overhead.server_share} onChange={(server_share) => set('overhead', { server_share })} hint="₹1,000–3,000 total ÷ number of clients" />
          <NumberField label="Support hours / month" suffix="h" value={inputs.overhead.support_hours} onChange={(support_hours) => set('overhead', { support_hours })} />
          <NumberField label="Support cost per hour" prefix="₹" value={inputs.overhead.support_hourly_cost} onChange={(support_hourly_cost) => set('overhead', { support_hourly_cost })} />
          <NumberField label="Other monthly costs" prefix="₹" value={inputs.overhead.other} onChange={(other) => set('overhead', { other })} hint="Commission, extra tools" />
        </Group>

        <Group title="Pricing rules" description="GST is passed on to the client; the payment gateway takes its fee on the GST-inclusive amount.">
          <NumberField label="Target margin" suffix="%" value={inputs.pricing.target_margin_percent} onChange={(target_margin_percent) => set('pricing', { target_margin_percent })} />
          <NumberField label="Minimum margin (walk-away)" suffix="%" value={inputs.pricing.min_margin_percent} onChange={(min_margin_percent) => set('pricing', { min_margin_percent })} />
          <NumberField label="GST" suffix="%" value={inputs.pricing.gst_percent} onChange={(gst_percent) => set('pricing', { gst_percent })} />
          <NumberField label="Payment gateway fee" suffix="%" value={inputs.pricing.gateway_fee_percent} onChange={(gateway_fee_percent) => set('pricing', { gateway_fee_percent })} hint="Razorpay ≈ 2%. 0 for bank transfer" />
          <NumberField label="Contract length" suffix="months" step="1" value={inputs.pricing.contract_months} onChange={(contract_months) => set('pricing', { contract_months })} />
        </Group>

        <div className="rounded-lg border border-input-border-color">
          <button type="button" onClick={() => setShowRates((s) => !s)} aria-expanded={showRates} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
            <span>
              <span className="text-sm font-semibold text-title block">Provider rates {ratesEdited && <span className="ml-1 text-[11px] font-semibold text-amber-600">edited for this quote</span>}</span>
              <span className="text-xs text-subtitle-color">From Settings → Credits → Provider costs. Change them here only for this quote.</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-subtitle-color transition-transform ${showRates ? 'rotate-180' : ''}`} />
          </button>
          {showRates && (
            <div className="border-t border-input-border-color p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <NumberField label="Phone line (Plivo)" prefix="₹" suffix="/ min" value={rates.telephony_per_minute} onChange={(telephony_per_minute) => setRate({ telephony_per_minute })} />
                <NumberField label="Number rental" prefix="₹" suffix="/ month" value={rates.number_rental_per_month} onChange={(number_rental_per_month) => setRate({ number_rental_per_month })} />
                <NumberField label="AI model input" prefix="₹" suffix="/ 1M tok" value={rates.llm_input_per_1m_tokens} onChange={(llm_input_per_1m_tokens) => setRate({ llm_input_per_1m_tokens })} />
                <NumberField label="AI model output" prefix="₹" suffix="/ 1M tok" value={rates.llm_output_per_1m_tokens} onChange={(llm_output_per_1m_tokens) => setRate({ llm_output_per_1m_tokens })} />
                <NumberField label="SMS" prefix="₹" suffix="/ msg" value={rates.sms_per_message} onChange={(sms_per_message) => setRate({ sms_per_message })} />
                <NumberField label="WhatsApp (Meta)" prefix="₹" suffix="/ msg" value={rates.whatsapp_per_message} onChange={(whatsapp_per_message) => setRate({ whatsapp_per_message })} />
                {(Object.keys(VOICE_LABELS) as VoiceProvider[]).map((p) => (
                  <NumberField key={`stt-${p}`} label={`Speech-to-text: ${VOICE_LABELS[p]}`} prefix="₹" suffix="/ min" value={rates.stt_per_minute[p]} onChange={(val) => setVoiceRate('stt_per_minute', p, val)} />
                ))}
                {(Object.keys(VOICE_LABELS) as VoiceProvider[]).map((p) => (
                  <NumberField key={`tts-${p}`} label={`Voice: ${VOICE_LABELS[p]}`} prefix="₹" suffix="/ 1K chr" value={rates.tts_per_1k_chars[p]} onChange={(val) => setVoiceRate('tts_per_1k_chars', p, val)} />
                ))}
              </div>
              {ratesEdited && (
                <Button className="gap-1.5" type="button" variant="outline" size="sm" onClick={() => onChange({ ...inputs, rates: data.rates })}>
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to Settings
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

export default CostsSection

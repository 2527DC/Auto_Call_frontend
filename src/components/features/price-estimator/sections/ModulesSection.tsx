'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { EstimateInputs, EstimatorRates, VoiceProvider } from '@/types/priceEstimator'
import { Blocks, Hash, MessageCircle, MessageSquareText, PhoneCall } from 'lucide-react'
import { ADDONS, Estimate, VOICE_LABELS } from '../estimate'
import { ModuleCard, money, NumberField, rupees, Section, Segmented } from '../fields'

const PROFILE_LABELS = {
  light: 'Light: short replies, small prompt',
  typical: 'Typical: ~450 chars spoken a minute',
  heavy: 'Heavy: chatty agent, big knowledge base',
  measured: 'Measured from your real calls',
}

const ModulesSection = ({ inputs, data, est, onChange }: {
  inputs: EstimateInputs
  data: EstimatorRates
  est: Estimate
  onChange: (next: EstimateInputs) => void
}) => {
  const rates = inputs.rates || data.rates
  const line = (key: string) => est.lines.find((l) => l.key === key)
  const set = <K extends keyof EstimateInputs>(key: K, patch: Partial<EstimateInputs[K]>) =>
    onChange({ ...inputs, [key]: { ...(inputs[key] as object), ...patch } })

  const v = inputs.voice
  const measured = data.measured[v.provider]
  const minuteMargin = v.price_per_minute > 0 ? ((v.price_per_minute - est.costPerMinute) / v.price_per_minute) * 100 : null
  const voiceLine = line('voice')
  const platformLine = line('platform')

  return (
    <Section step={3} icon={Blocks} title="Services & modules" description="Switch on what the client needs, enter their volumes, and set what you charge for each.">
      <div className="space-y-3">
        <ModuleCard
          icon={PhoneCall}
          title="AI voice calls"
          description="Phone line, speech-to-text, AI voice and AI model, charged per minute"
          enabled={v.enabled}
          onToggle={(enabled) => set('voice', { enabled })}
          cost={voiceLine?.cost}
          price={voiceLine?.price}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Segmented
              label="Direction"
              value={v.direction}
              onChange={(direction) => set('voice', { direction })}
              options={[{ value: 'outbound', label: 'Outbound' }, { value: 'inbound', label: 'Inbound' }, { value: 'both', label: 'Both' }]}
            />
            <NumberField
              label="Connected calls / month"
              value={v.calls_per_month}
              step="1"
              onChange={(calls_per_month) => set('voice', { calls_per_month })}
              hint={`≈ ${Math.round(v.calls_per_month / 30).toLocaleString('en-IN')} a day`}
            />
            <NumberField label="Average call length" suffix="min" value={v.avg_minutes} onChange={(avg_minutes) => set('voice', { avg_minutes })} hint={`${Math.round(est.minutes).toLocaleString('en-IN')} minutes a month`} />
            <NumberField
              label="Your price per minute"
              prefix="₹"
              value={v.price_per_minute}
              onChange={(price_per_minute) => set('voice', { price_per_minute })}
              hint={<>Market ₹4–6 · margin <b className={cn(minuteMargin !== null && minuteMargin < 0 ? 'text-destructive' : 'text-emerald-600')}>{minuteMargin === null ? '—' : `${minuteMargin.toFixed(0)}%`}</b></>}
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-subtitle-color">Voice</Label>
              <Select value={v.provider} onValueChange={(p) => set('voice', { provider: p as VoiceProvider })}>
                <SelectTrigger className="h-10 w-full shadow-none bg-input-color border-input-border-color text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-bg-card border-input-border-color">
                  {(Object.keys(VOICE_LABELS) as VoiceProvider[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {VOICE_LABELS[p]}{p === 'elevenlabs' ? ' (premium)' : p === 'sarvam_ai' ? ' (Indian languages)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-1 xl:col-span-2">
              <Label className="text-xs font-semibold text-subtitle-color">How much the agent talks</Label>
              <Select value={v.profile} onValueChange={(profile) => set('voice', { profile: profile as EstimateInputs['voice']['profile'] })}>
                <SelectTrigger className="h-10 w-full shadow-none bg-input-color border-input-border-color text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-bg-card border-input-border-color">
                  {(Object.keys(PROFILE_LABELS) as (keyof typeof PROFILE_LABELS)[]).map((k) => (
                    <SelectItem key={k} value={k} disabled={k === 'measured' && measured?.cost_per_minute == null}>
                      {PROFILE_LABELS[k]}{k === 'measured' && (measured?.cost_per_minute != null ? ` (${money(measured.cost_per_minute)}/min)` : ` (needs ${data.min_measured_calls} calls)`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2 text-xs space-y-0.5 tabular-nums">
              <p className="text-subtitle-color">Your cost per minute</p>
              <p className="text-lg font-bold text-amber-600">{money(est.costPerMinute)}</p>
              {est.voiceCost.measured === 0 && est.minutes > 0 && (
                <p className="text-[11px] text-subtitle-color leading-snug">
                  Line {rupees(est.voiceCost.telephony)} · STT {rupees(est.voiceCost.stt)} · Voice {rupees(est.voiceCost.tts)} · AI {rupees(est.voiceCost.llm)}
                </p>
              )}
            </div>
          </div>
        </ModuleCard>

        <ModuleCard
          icon={Hash}
          title="Phone numbers"
          description={`+91 numbers on your Plivo account (you pay ${rupees(rates.number_rental_per_month)}/month each)`}
          enabled={inputs.numbers.enabled}
          onToggle={(enabled) => set('numbers', { enabled })}
          cost={line('numbers')?.cost}
          price={line('numbers')?.price}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <NumberField label="Numbers" step="1" value={inputs.numbers.count} onChange={(count) => set('numbers', { count })} />
            <NumberField label="Your price per number / month" prefix="₹" value={inputs.numbers.price_per_number} onChange={(price_per_number) => set('numbers', { price_per_number })} hint="Ringg charges ₹499" />
          </div>
        </ModuleCard>

        <ModuleCard
          icon={MessageSquareText}
          title="SMS"
          description="Campaign SMS and AI SMS replies (DLT registration required)"
          enabled={inputs.sms.enabled}
          onToggle={(enabled) => set('sms', { enabled })}
          cost={line('sms')?.cost}
          price={line('sms')?.price}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <NumberField label="SMS / month" step="1" value={inputs.sms.messages_per_month} onChange={(messages_per_month) => set('sms', { messages_per_month })} />
            <NumberField label="Your price per SMS" prefix="₹" value={inputs.sms.price_per_message} onChange={(price_per_message) => set('sms', { price_per_message })} hint={`Your cost ${money(rates.sms_per_message)} / SMS`} />
          </div>
        </ModuleCard>

        <ModuleCard
          icon={MessageCircle}
          title="WhatsApp messages"
          description="Template messages after calls and in workflows"
          enabled={inputs.whatsapp.enabled}
          onToggle={(enabled) => set('whatsapp', { enabled })}
          cost={line('whatsapp')?.cost}
          price={line('whatsapp')?.price}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            <NumberField label="Messages / month" step="1" value={inputs.whatsapp.messages_per_month} onChange={(messages_per_month) => set('whatsapp', { messages_per_month })} />
            <NumberField label="Your price per message" prefix="₹" value={inputs.whatsapp.price_per_message} onChange={(price_per_message) => set('whatsapp', { price_per_message })} hint="Charge 0 if it's part of the package" />
            <label className="flex items-start gap-3 rounded-lg border border-input-border-color px-3 py-2.5 sm:col-span-2 cursor-pointer">
              <Switch checked={inputs.whatsapp.client_pays_meta} onCheckedChange={(client_pays_meta) => set('whatsapp', { client_pays_meta })} className="mt-0.5" />
              <span className="text-xs">
                <span className="font-semibold text-title block">Client pays Meta directly</span>
                <span className="text-subtitle-color">Their own WhatsApp Business account is billed by Meta, so it costs you nothing. Turn off if Meta bills you ({money(rates.whatsapp_per_message)}/msg).</span>
              </span>
            </label>
          </div>
        </ModuleCard>

        <ModuleCard
          icon={Blocks}
          title="Platform & modules"
          description="Software features with no per-use cost. Charge a monthly fee or add-ons, and count their set-up time."
          enabled
          cost={platformLine?.cost ?? 0}
          price={platformLine?.price ?? 0}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <NumberField label="Monthly platform fee" prefix="₹" value={inputs.platform.monthly_fee} onChange={(monthly_fee) => set('platform', { monthly_fee })} hint="Outpero charges ₹1,899 a month" />
            </div>
            <div className="rounded-lg border border-input-border-color divide-y divide-input-border-color">
              <div className="hidden md:grid grid-cols-[1fr_140px_110px] gap-3 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-subtitle-color">
                <span>Module</span><span>Add-on / month</span><span>Set-up hours</span>
              </div>
              {ADDONS.map((a) => {
                const addon = inputs.addons[a.key]
                const setAddon = (patch: Partial<typeof addon>) => onChange({ ...inputs, addons: { ...inputs.addons, [a.key]: { ...addon, ...patch } } })
                return (
                  <div key={a.key} className={cn('grid grid-cols-1 md:grid-cols-[1fr_140px_110px] gap-3 px-3 py-2.5 items-center', !addon.enabled && 'opacity-60')}>
                    <label className="flex items-start gap-3 cursor-pointer min-w-0">
                      <Switch checked={addon.enabled} onCheckedChange={(enabled) => setAddon({ enabled })} className="mt-0.5" aria-label={a.label} />
                      <span className="min-w-0">
                        <span className="text-sm font-medium text-title block">{a.label}</span>
                        <span className="text-xs text-subtitle-color">{a.hint}</span>
                      </span>
                    </label>
                    {addon.enabled ? (
                      <>
                        <NumberField label="Add-on / month" prefix="₹" value={addon.monthly_price} onChange={(monthly_price) => setAddon({ monthly_price })} className="md:[&>label]:sr-only" />
                        <NumberField label="Set-up hours" suffix="h" value={addon.setup_hours} onChange={(setup_hours) => setAddon({ setup_hours })} className="md:[&>label]:sr-only" />
                      </>
                    ) : <span className="hidden md:block md:col-span-2 text-xs text-subtitle-color">Not included</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </ModuleCard>
      </div>
    </Section>
  )
}

export default ModulesSection

'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { EstimateInputs, EstimatorRates, VoiceProvider, VoiceUnitCosts } from '@/types/priceEstimator'
import { Blocks, Hash, MessageCircle, MessageSquareText, PhoneCall, RotateCcw } from 'lucide-react'
import { ADDONS, billedMinutesPerCall, Estimate, settingsUnitCosts, VOICE_LABELS } from '../estimate'
import { ModuleCard, money, NumberField, rupees, Section, Segmented } from '../fields'

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
  const measured = data.measured[v.provider]?.cost_per_minute ?? null
  const typical = data.usage_profiles.typical
  const fromSettings = settingsUnitCosts(rates, v.provider, typical)
  const u = est.unitCosts
  const setUnit = (k: keyof VoiceUnitCosts, value: number) => set('voice', { unit_costs: { ...u, [k]: value } })
  // The phone line per minute of talk, after Plivo rounds each call up to 30 seconds.
  const linePerMinute = v.avg_minutes > 0 ? (rates.telephony_per_minute * billedMinutesPerCall(v.avg_minutes)) / v.avg_minutes : 0
  // Scale speech, voice and AI so the all-in minute matches what real calls cost.
  const useMeasured = () => {
    const base = fromSettings.stt + fromSettings.tts + fromSettings.llm
    const target = (measured ?? 0) - linePerMinute
    if (base <= 0 || target <= 0) return
    const f = target / base
    const r2 = (x: number) => Math.round(x * f * 100) / 100
    set('voice', { unit_costs: { stt: r2(fromSettings.stt), tts: r2(fromSettings.tts), llm: r2(fromSettings.llm) } })
  }
  const perMinuteProfit = v.price_per_minute - est.costPerMinute
  const minuteMargin = v.price_per_minute > 0 ? (perMinuteProfit / v.price_per_minute) * 100 : null
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
          <div className="space-y-4">
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
              <NumberField label="Average call length" suffix="min" value={v.avg_minutes} onChange={(avg_minutes) => set('voice', { avg_minutes })} hint={`= ${Math.round(est.minutes).toLocaleString('en-IN')} minutes a month`} />
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-subtitle-color">Voice</Label>
                <Select value={v.provider} onValueChange={(p) => set('voice', { provider: p as VoiceProvider, unit_costs: null })}>
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-4 items-start">
              <div className="rounded-lg border border-input-border-color overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-amber-500/5 border-b border-input-border-color">
                  <span className="text-xs font-bold uppercase tracking-wider text-subtitle-color">Your cost per minute of talk</span>
                  <span className="flex flex-wrap gap-2">
                    {measured !== null && (
                      <Button type="button" size="sm" variant="outline" onClick={useMeasured} className="h-7 text-[11px]">
                        Use real calls ({money(measured)}/min)
                      </Button>
                    )}
                    {v.unit_costs && (
                      <Button type="button" size="sm" variant="outline" onClick={() => set('voice', { unit_costs: null })} className="h-7 text-[11px]">
                        <RotateCcw className="w-3 h-3" /> Settings rates
                      </Button>
                    )}
                  </span>
                </div>
                <div className="divide-y divide-input-border-color">
                  {[
                    { key: null, label: 'Phone line', formula: `${money(rates.telephony_per_minute)} × ${billedMinutesPerCall(v.avg_minutes)} billed min per ${v.avg_minutes || 0}-min call`, value: linePerMinute },
                    { key: 'stt' as const, label: 'Speech-to-text', formula: `${typical.stt_seconds} s of caller speech × ${money(rates.stt_per_minute[v.provider])}/min`, value: u.stt, auto: fromSettings.stt },
                    { key: 'tts' as const, label: 'AI voice', formula: `${typical.tts_characters} characters × ${money(rates.tts_per_1k_chars[v.provider])}/1K`, value: u.tts, auto: fromSettings.tts },
                    { key: 'llm' as const, label: 'AI model', formula: `${(typical.llm_input_tokens / 1000).toFixed(1)}K in + ${typical.llm_output_tokens} out tokens`, value: u.llm, auto: fromSettings.llm },
                  ].map((row) => (
                    <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_150px] gap-3 items-center px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-title">{row.label}</p>
                        <p className="text-[11px] text-subtitle-color truncate" title={row.formula}>
                          {row.key && v.unit_costs ? `From Settings: ${money(row.auto ?? 0)}` : row.formula}
                        </p>
                      </div>
                      {row.key ? (
                        <NumberField label={`${row.label} cost per minute`} prefix="₹" suffix="/ min" value={Math.round(row.value * 100) / 100} onChange={(val) => setUnit(row.key, val)} className="[&>label]:sr-only" />
                      ) : (
                        <span className="text-right text-sm tabular-nums text-title pr-3">{money(row.value)} <span className="text-[11px] text-subtitle-color">/ min</span></span>
                      )}
                    </div>
                  ))}
                  <div className="grid grid-cols-[minmax(0,1fr)_150px] gap-3 items-center px-3 py-2 bg-amber-500/5">
                    <span className="text-sm font-bold text-title">Total cost per minute</span>
                    <span className="text-right text-base font-bold tabular-nums text-amber-600 pr-3">{money(est.costPerMinute)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-primary/25 bg-primary/[0.04] p-3 space-y-3">
                <NumberField label="Your price per minute" prefix="₹" value={v.price_per_minute} onChange={(price_per_minute) => set('voice', { price_per_minute })} hint="Market ₹4–6 a minute all-in" />
                <div className="space-y-1 text-sm tabular-nums">
                  <div className="flex justify-between"><span className="text-subtitle-color">Price</span><span className="text-title">{money(v.price_per_minute)}</span></div>
                  <div className="flex justify-between"><span className="text-subtitle-color">− Cost</span><span className="text-amber-600">{money(est.costPerMinute)}</span></div>
                  <div className="flex justify-between border-t border-input-border-color pt-1 font-bold">
                    <span className="text-title">Profit / min</span>
                    <span className={cn(perMinuteProfit < 0 ? 'text-destructive' : 'text-emerald-600')}>{money(perMinuteProfit)}{minuteMargin !== null && <span className="ml-1 text-xs font-semibold">({minuteMargin.toFixed(0)}%)</span>}</span>
                  </div>
                </div>
              </div>
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

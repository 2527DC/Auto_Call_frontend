'use client'

import TextInput from '@/components/shared/TextInput'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CURRENCY_SYMBOL } from '@/lib/currency'
import { Calculator } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// What providers charge you. Used only by the Cost & Profit report.
const COST_FIELDS = [
  { name: 'cost_telephony_per_minute', label: 'Phone line (Plivo)', unit: '/ min' },
  { name: 'cost_stt_per_minute_deepgram', label: 'Speech-to-text: Deepgram', unit: '/ min' },
  { name: 'cost_stt_per_minute_sarvam_ai', label: 'Speech-to-text: Sarvam', unit: '/ min' },
  { name: 'cost_stt_per_minute_elevenlabs', label: 'Speech-to-text: ElevenLabs', unit: '/ min' },
  { name: 'cost_tts_per_1k_chars_deepgram', label: 'Voice: Deepgram', unit: '/ 1K chars' },
  { name: 'cost_tts_per_1k_chars_sarvam_ai', label: 'Voice: Sarvam', unit: '/ 1K chars' },
  { name: 'cost_tts_per_1k_chars_elevenlabs', label: 'Voice: ElevenLabs', unit: '/ 1K chars' },
  { name: 'cost_llm_input_per_1m_tokens', label: 'AI model input', unit: '/ 1M tokens' },
  { name: 'cost_llm_output_per_1m_tokens', label: 'AI model output', unit: '/ 1M tokens' },
  { name: 'cost_sms_per_message', label: 'SMS', unit: '/ message' },
  { name: 'cost_whatsapp_per_message', label: 'WhatsApp', unit: '/ message' },
] as const

const ProviderCostsCard = () => {
  const { t } = useTranslation()

  return (
    <Card className="bg-bg-card border border-input-border-color rounded-lg overflow-hidden">
      <CardHeader className="sm:px-6 px-4 py-4 border-b border-input-border-color bg-bg-card">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-zinc-500" />
          <CardTitle className="text-xl font-semibold text-title">{t('provider_costs', 'Provider costs')}</CardTitle>
        </div>
        <p className="text-md text-subtitle-color">
          {t('provider_costs_desc', 'What your providers charge you, in rupees. The Cost & Profit report uses these. Set a cost to 0 when the client pays that provider directly.')}
        </p>
      </CardHeader>
      <CardContent className="sm:p-6 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {COST_FIELDS.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label className="text-md font-semibold text-title">{field.label}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-subtitle-color">{CURRENCY_SYMBOL}</span>
              <TextInput
                name={field.name}
                type="number"
                placeholder="0"
                className="h-10 w-full pl-7 pr-24 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 rounded-lg text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-zinc-400">{field.unit}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default ProviderCostsCard

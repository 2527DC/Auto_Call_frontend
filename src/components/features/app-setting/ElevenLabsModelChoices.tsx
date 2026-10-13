'use client'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetVoiceModelsQuery } from '@/redux/api/voiceApi'
import { VoiceModel } from '@/types/voice'
import { useFormikContext } from 'formik'
import { AudioWaveform } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ModelChoiceValues {
  elevenlabs_allowed_models: string[]
  elevenlabs_default_model: string
}

// Languages that matter for Voxeno's market, shown per model.
const KEY_LANGUAGES = ['English', 'Hindi', 'Kannada']

const speaks = (model: VoiceModel, language: string) =>
  model.languages.some((l) => l.name.toLowerCase().startsWith(language.toLowerCase()))

// Admin: which ElevenLabs voice models clients may pick for an agent, and the
// default. Lists every model on Voxeno's ElevenLabs account, deprecated ones included.
export function ElevenLabsModelChoices() {
  const { t } = useTranslation()
  const { values, setFieldValue } = useFormikContext<ModelChoiceValues>()
  const { data, isLoading } = useGetVoiceModelsQuery({ scope: 'all' })
  const models = data?.data?.elevenlabs || []
  const allowed = values.elevenlabs_allowed_models || []

  const toggle = (modelId: string, checked: boolean) => {
    if (modelId === values.elevenlabs_default_model) return
    setFieldValue('elevenlabs_allowed_models', checked ? [...allowed, modelId] : allowed.filter((id) => id !== modelId))
  }

  const setDefault = (modelId: string) => {
    setFieldValue('elevenlabs_default_model', modelId)
    if (!allowed.includes(modelId)) setFieldValue('elevenlabs_allowed_models', [...allowed, modelId])
  }

  return (
    <div className="pt-4 border-t border-zinc-200 dark:border-white/10 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
        <AudioWaveform className="w-3 h-3" />
        {t('elevenlabs_voice_models')}
      </div>
      <p className="text-xs text-zinc-500">{t('elevenlabs_voice_models_desc')}</p>

      <div className="space-y-2 max-w-sm">
        <Label className="text-sm font-medium text-title">{t('default_voice_model')}</Label>
        <Select value={values.elevenlabs_default_model} onValueChange={setDefault}>
          <SelectTrigger className="h-10 bg-input-color border-input-border-color font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.filter((m) => m.realtime !== false).map((m) => (
              <SelectItem key={m.model_id} value={m.model_id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-xs text-zinc-500">{t('loading')}</p>
      ) : (
        <div className="divide-y divide-input-border-color rounded-lg border border-input-border-color">
          {models.map((m) => (
            <label key={m.model_id} className="flex items-start gap-3 p-3 cursor-pointer">
              <Checkbox
                checked={allowed.includes(m.model_id) || m.model_id === values.elevenlabs_default_model}
                disabled={m.model_id === values.elevenlabs_default_model}
                onCheckedChange={(checked) => toggle(m.model_id, checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-title">{m.name}</span>
                  <span className="text-[11px] text-zinc-400">{m.model_id}</span>
                  {m.deprecated && <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">{t('deprecated')}</Badge>}
                  {m.realtime === false && <Badge variant="outline" className="text-[10px]">{t('not_for_live_calls')}</Badge>}
                  {m.price_per_1k_chars_usd != null && (
                    <Badge variant="outline" className="text-[10px]">${m.price_per_1k_chars_usd} / 1K {t('characters')}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {m.languages.length > 0 ? (
                    <>
                      {KEY_LANGUAGES.map((lang) => (
                        <span key={lang} className={speaks(m, lang) ? 'text-emerald-600' : 'text-zinc-400 line-through'}>{lang}</span>
                      ))}
                      <span className="text-zinc-400">· {m.languages.length} {t('languages')}</span>
                    </>
                  ) : (
                    <span className="text-zinc-400">{t('languages_unknown')}</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

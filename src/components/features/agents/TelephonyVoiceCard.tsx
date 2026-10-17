'use client'

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useGetVoiceModelsQuery } from '@/redux/api/voiceApi'
import { TelephonyProvider, TelephonyVoiceCardProps, VoiceProvider } from '@/types/agent'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TransferTeamSelector } from './TransferTeamSelector'

const SARVAM_DEFAULT_VOICES = [
  { voice_id: 'kavitha', name: 'Kavitha (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Female', accent: 'South Indian', description: 'Recommended for Kannada • Natural Tone' } },
  { voice_id: 'roopa', name: 'Roopa (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Female', accent: 'South Indian', description: 'Warm Kannada / Indic Voice' } },
  { voice_id: 'shubh', name: 'Shubh (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Male', accent: 'Indian', description: 'Clear & Professional' } },
  { voice_id: 'ratan', name: 'Ratan (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Male', accent: 'South Indian', description: 'Mature Business Voice' } },
  { voice_id: 'aditya', name: 'Aditya (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Male', accent: 'Indian', description: 'Energetic & Conversational' } },
  { voice_id: 'priya', name: 'Priya (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Female', accent: 'Indian', description: 'Crisp Customer Care' } },
  { voice_id: 'kavya', name: 'Kavya (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Female', accent: 'Indian', description: 'Expressive & Gentle' } },
  { voice_id: 'gokul', name: 'Gokul (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Male', accent: 'South Indian', description: 'Approachable & Natural' } },
  { voice_id: 'mani', name: 'Mani (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Male', accent: 'South Indian', description: 'Calm & Friendly' } },
  { voice_id: 'neha', name: 'Neha (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Female', accent: 'Indian', description: 'Soft & Polite' } },
  { voice_id: 'pooja', name: 'Pooja (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Female', accent: 'Indian', description: 'Friendly Support' } },
  { voice_id: 'rahul', name: 'Rahul (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Male', accent: 'Indian', description: 'Young & Clear' } },
  { voice_id: 'simran', name: 'Simran (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Female', accent: 'Indian', description: 'Calm & Natural' } },
  { voice_id: 'ishita', name: 'Ishita (Sarvam AI)', category: 'Predefined', provider: 'sarvam_ai', labels: { gender: 'Female', accent: 'Indian', description: 'Upbeat & Clear' } },
]

export function TelephonyVoiceCard({
  telephonyProvider,
  setTelephonyProvider,
  voiceProvider,
  setVoiceProvider,
  voiceId,
  setVoiceId,
  voicesData,
  ttsModel,
  setTtsModel,
  language,
  setLanguage,
  idleTimeout,
  setIdleTimeout,
  maxCallDuration,
  setMaxCallDuration,
  enableCallTranscription,
  setEnableCallTranscription,
  enableCallRecording,
  setEnableCallRecording,
  transferEnabled,
  setTransferEnabled,
  transferKeywords,
  setTransferKeywords,
  teamId,
  setTeamId,
  memberId,
  setMemberId,
  transferPhoneNumber,
  setTransferPhoneNumber,
}: TelephonyVoiceCardProps) {
  // Only the models the admin allows (and priced) are offered.
  const { data: modelsData } = useGetVoiceModelsQuery(undefined, { skip: voiceProvider !== VoiceProvider.ELEVENLABS })
  const models = modelsData?.data?.elevenlabs || []
  const defaultModel = models.find((m) => m.is_default)
  const chosenModel = models.find((m) => m.model_id === ttsModel) || defaultModel
  const languageCode = (language || '').split(/[-_]/)[0].toLowerCase()
  const modelLacksLanguage = !!chosenModel && chosenModel.languages.length > 0 && !!languageCode &&
    !chosenModel.languages.some((l) => l.id.toLowerCase().startsWith(languageCode))
  const { t } = useTranslation()

  const availableVoices = useMemo(() => {
    const list = (voicesData?.data || []).filter((voice: any) => voice.provider === voiceProvider)
    if (list.length > 0) return list
    if (voiceProvider === VoiceProvider.SARVAM_AI) return SARVAM_DEFAULT_VOICES
    return list
  }, [voicesData?.data, voiceProvider])

  const handleKeywordAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = e.currentTarget.value.trim()
      if (val && !transferKeywords.includes(val)) {
        setTransferKeywords([...transferKeywords, val])
        e.currentTarget.value = ''
      }
    }
  }

  const removeKeyword = (kw: string) => {
    setTransferKeywords(transferKeywords.filter((k) => k !== kw))
  }

  return (
    <div className="bg-bg-card p-4 sm:p-6 rounded-radius border border-input-border-color">
      <h2 className="text-title text-lg font-black flex items-center gap-2.5 mb-6">
        <span>{t('telephony_voice')}</span>
      </h2>

      <div className="space-y-6">
        {/* ── Providers & Voice Language ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label className="text-md font-medium text-title">{t('telephony_provider', 'Telephony Provider')}</Label>
            <Select value={telephonyProvider} onValueChange={(val) => setTelephonyProvider(val as TelephonyProvider)}>
              <SelectTrigger className="h-10 rounded-radius bg-input-color shadow-none border-input-border-color font-bold dark:bg-white/5 dark:border-white/10">
                <SelectValue placeholder={t('select_telephony_provider')} />
              </SelectTrigger>
              <SelectContent className="rounded-radius border-input-border-color">
                <SelectItem value={TelephonyProvider.TWILIO}>{t('twilio')}</SelectItem>
                <SelectItem value={TelephonyProvider.SIP}>{t('sip_trunk')}</SelectItem>
                <SelectItem value={TelephonyProvider.META_WHATSAPP}>{t('meta_whatsapp')}</SelectItem>
                <SelectItem value={TelephonyProvider.PLIVO}>{t('plivo', 'Plivo')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-md font-medium text-title">{t('voice_provider', 'AI Voice Provider')}</Label>
            <Select
              value={voiceProvider}
              onValueChange={(val) => {
                const newProv = val as VoiceProvider
                setVoiceProvider(newProv)
                if (newProv === VoiceProvider.SARVAM_AI) {
                  setVoiceId('kavitha')
                } else {
                  setVoiceId('')
                }
              }}
            >
              <SelectTrigger className="h-10 rounded-radius bg-input-color shadow-none border-input-border-color font-bold dark:bg-white/5 dark:border-white/10">
                <SelectValue placeholder={t('select_voice_provider')} />
              </SelectTrigger>
              <SelectContent className="rounded-radius border-input-border-color">
                <SelectItem value={VoiceProvider.SARVAM_AI}>{t('sarvam_ai')} (Bulbul v3 • Kannada/Indic)</SelectItem>
                <SelectItem value={VoiceProvider.ELEVENLABS}>{t('elevenlabs')}</SelectItem>
                <SelectItem value={VoiceProvider.DEEPGRAM}>{t('deepgram')}</SelectItem>
              </SelectContent>
            </Select>
            {voiceProvider === VoiceProvider.SARVAM_AI && (
              <p className="text-[11px] text-primary font-bold">
                ⚡ Native Indian voices (Bulbul v3). Best for Kannada & regional languages.
              </p>
            )}
          </div>

          {setLanguage && (
            <div className="space-y-3">
              <Label className="text-md font-medium text-title flex items-center gap-1.5">
                <span>{t('voice_language', 'Voice Language')}</span>
                <span className="text-xs font-normal text-muted-foreground">({t('speaks_in', 'AI speaks in')})</span>
              </Label>
              <Select value={language || 'en'} onValueChange={setLanguage}>
                <SelectTrigger className="h-10 rounded-radius bg-input-color shadow-none border-input-border-color font-bold dark:bg-white/5 dark:border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-radius border-input-border-color">
                  <SelectItem value="en" className="font-bold">English (EN)</SelectItem>
                  <SelectItem value="kn" className="font-bold">ಕನ್ನಡ (Kannada - KN)</SelectItem>
                  <SelectItem value="hi" className="font-bold">हिन्दी (Hindi - HI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ── Voice ID Selection ── */}
        <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <Label className="text-md font-medium text-title">{t('voice_id', 'Voice ID / Speaker')}</Label>
            {voiceProvider === VoiceProvider.SARVAM_AI && language === 'kn' && (
              <span className="text-xs font-semibold text-primary">
                ✨ Kavitha recommended for Kannada
              </span>
            )}
          </div>
          <Select value={voiceId || (voiceProvider === VoiceProvider.SARVAM_AI ? 'kavitha' : '')} onValueChange={setVoiceId}>
            <SelectTrigger className="h-10 rounded-radius bg-input-color shadow-none border-input-border-color font-bold dark:bg-white/5 dark:border-white/10">
              <SelectValue placeholder={t('select_voice_agent', 'Select Voice Speaker')} />
            </SelectTrigger>
            <SelectContent className="rounded-radius border-input-border-color max-h-75 w-[var(--radix-select-trigger-width)]">
              {availableVoices.map((voice: any) => (
                <SelectItem key={voice.voice_id} value={voice.voice_id} className="font-bold py-3">
                  <div className="flex flex-col gap-1 text-left overflow-hidden">
                    <span className="text-sm font-black truncate block w-full">{voice.name}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black truncate block w-full">
                      {voice.category?.toLowerCase() === 'premade' ? 'Predefined' : voice.category?.replace(/_/g, ' ')} • {voice.labels?.gender?.replace(/_/g, ' ')} • {voice.labels?.accent?.replace(/_/g, ' ')} {voice.labels?.description ? `• ${voice.labels.description}` : ''}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {voiceProvider === VoiceProvider.SARVAM_AI && (
            <p className="text-[12px] text-muted-foreground">
              {language === 'kn'
                ? '💡 Tip: For natural Kannada conversations, Kavitha (Female) or Ratan / Shubh (Male) sound authentic and clear.'
                : 'Select the voice character that best matches your agent persona.'}
            </p>
          )}
        </div>

        {/* ── ElevenLabs voice model ── */}
        {voiceProvider === VoiceProvider.ELEVENLABS && models.length > 0 && (
          <div className="space-y-3">
            <Label className="text-md mb-2 font-medium text-title">{t('voice_model')}</Label>
            <Select value={ttsModel || 'default'} onValueChange={(val) => setTtsModel(val === 'default' ? '' : val)}>
              <SelectTrigger className="h-10 rounded-radius bg-input-color shadow-none border-input-border-color font-bold dark:bg-white/5 dark:border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-radius border-input-border-color">
                <SelectItem value="default">{t('default_voice_model_option', { name: defaultModel?.name || '' })}</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m.model_id} value={m.model_id}>
                    {m.name}{m.deprecated ? ` (${t('deprecated')})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modelLacksLanguage && (
              <p className="text-xs font-medium text-amber-600">{t('voice_model_language_warning')}</p>
            )}
          </div>
        )}

        {/* ── Call Settings ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-white/5">
          <div className="space-y-3">
            <Label className="text-md font-medium text-title">
              {t('idle_timeout')}
            </Label>
            <Input
              type="number"
              value={idleTimeout}
              onChange={(e) => setIdleTimeout(Number(e.target.value))}
              min={0}
              className="h-10 rounded-radius bg-input-color border-input-border-color font-bold focus:bg-input-color transition-all text-sm"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-md font-medium text-title">
              {t('max_call_duration')}
            </Label>
            <Input
              type="number"
              value={maxCallDuration}
              onChange={(e) => setMaxCallDuration(Number(e.target.value))}
              min={1}
              className="h-10 rounded-radius bg-input-color border-input-border-color font-bold focus:bg-input-color transition-all text-sm"
            />
          </div>
        </div>

        {/* ── Toggles ── */}
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-md font-bold text-title">
                {t('enable_call_transcription')}
              </Label>
              <p className="text-[13px] text-muted-foreground">
                {t('enable_call_transcription_desc')}
              </p>
            </div>
            <Switch
              checked={enableCallTranscription}
              onCheckedChange={setEnableCallTranscription}
              className="data-[state=checked]:bg-primary shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-md font-bold text-title">
                {t('enable_call_recording')}
              </Label>
              <p className="text-[13px] text-muted-foreground">
                {t('enable_call_recording_desc')}
              </p>
            </div>
            <Switch
              checked={enableCallRecording}
              onCheckedChange={setEnableCallRecording}
              className="data-[state=checked]:bg-primary shadow-sm"
            />
          </div>
        </div>

        {/* ── Transfer to Human ── */}
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-md font-bold text-title">
                {t('transfer_to_human')}
              </Label>
              <p className="text-[13px] text-muted-foreground">
                {t('transfer_to_human_desc')}
              </p>
            </div>
            <Switch
              checked={transferEnabled}
              onCheckedChange={setTransferEnabled}
              className="data-[state=checked]:bg-primary shadow-sm"
            />
          </div>

          {transferEnabled && (
            <div className="space-y-6 bg-input-color p-4 rounded-radius border border-input-border-color mt-4 animate-in fade-in slide-in-from-top-2">
              {/* Direct Forward / Transfer Phone Number */}
              <div className="space-y-2">
                <Label className="text-md font-medium text-title">
                  {t('transfer_phone_number', 'Direct Transfer Phone Number (Mobile / Landline)')}
                </Label>
                <Input
                  type="tel"
                  placeholder="+919876543210"
                  value={transferPhoneNumber || ''}
                  onChange={(e) => setTransferPhoneNumber?.(e.target.value)}
                  className="h-10 rounded-radius bg-input-color border-input-border-color font-bold focus:bg-input-color transition-all text-sm"
                />
                <p className="text-[12px] text-muted-foreground">
                  {t('transfer_phone_desc', 'Enter the normal mobile or landline number with country code (e.g. +91XXXXXXXXXX) to transfer the call directly to a real person.')}
                </p>
              </div>

              {/* Or Select from Team Member */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('or_select_team_member', 'Or Transfer to Team Member')}
                </div>
                <TransferTeamSelector
                  teamId={teamId}
                  setTeamId={setTeamId}
                  memberId={memberId}
                  setMemberId={setMemberId}
                />
              </div>

              {/* Transfer Keywords */}
              <div className="space-y-3">
                <Label className="text-md font-medium text-title">
                  {t('transfer_keywords')}
                </Label>
                <Input
                  placeholder={t('transfer_keywords_placeholder')}
                  onKeyDown={handleKeywordAdd}
                  className="h-10 rounded-radius bg-input-color border-input-border-color font-bold focus:bg-input-color transition-all text-sm mb-2"
                />
                <div className="flex flex-wrap gap-2">
                  {transferKeywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="px-2 py-1 flex items-center gap-1.5 text-xs font-bold rounded-lg bg-primary/10 text-primary max-w-full"
                    >
                      <span className="truncate max-w-[200px] block">{kw}</span>
                      <X
                        className="w-3 h-3 shrink-0 cursor-pointer transition-colors"
                        onClick={() => removeKeyword(kw)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

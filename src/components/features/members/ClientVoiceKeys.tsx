'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from '@/components/reusable/Loader2'
import { useGetClientProviderKeysQuery, useUpdateClientProviderKeysMutation } from '@/redux/api/voiceApi'
import { ClientProviderKeys } from '@/types/voice'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const VOICE_FIELDS: { name: keyof ClientProviderKeys; label: string; placeholder?: string; type?: string }[] = [
  { name: 'elevenlabs_api_key', label: 'ElevenLabs API Key', type: 'password' },
  { name: 'deepgram_api_key', label: 'Deepgram API Key', type: 'password' },
  { name: 'sarvam_ai_api_key', label: 'Sarvam AI API Key', type: 'password' },
]

const PLIVO_FIELDS: { name: keyof ClientProviderKeys; label: string; placeholder?: string; type?: string }[] = [
  { name: 'plivo_auth_id', label: 'Plivo Auth ID', placeholder: 'M...' },
  { name: 'plivo_auth_token', label: 'Plivo Auth Token', placeholder: 'Enter Auth Token', type: 'password' },
  { name: 'plivo_app_id', label: 'Plivo App ID', placeholder: 'Enter App ID' },
]

// Admin: keys made for this client inside Voxeno's own provider accounts, so
// each provider reports this client's usage per key. Empty = Voxeno's key.
// Its own Save button: it is saved separately from the member form.
export function ClientVoiceKeys({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useGetClientProviderKeysQuery(userId)
  const [saveKeys, { isLoading: isSaving }] = useUpdateClientProviderKeysMutation()
  const [edits, setEdits] = useState<Partial<ClientProviderKeys>>({})
  const saved = data?.data

  const save = async () => {
    try {
      const res = await saveKeys({ userId, ...edits }).unwrap()
      toast.success(res.message || t('provider_keys_saved', 'Provider credentials saved'))
      setEdits({})
    } catch (err: any) {
      toast.error(err?.data?.message || t('failed_to_save_provider_keys', 'Failed to save provider credentials'))
    }
  }

  return (
    <div className="space-y-4 p-4 mb-4 rounded-lg bg-subcard border border-input-border-color">
      <div className="space-y-0.5">
        <Label className="text-md font-bold text-gray-900 dark:text-white">{t('client_voice_keys', 'Client Provider & Telephony Keys')}</Label>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('client_voice_keys_desc', 'Custom provider credentials for this client. If empty, the platform defaults are used.')}</p>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-subtitle-color uppercase tracking-wider">Voice Engines</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VOICE_FIELDS.map(({ name, label, type }) => (
            <div key={name} className="space-y-1">
              <Label htmlFor={name} className="text-xs font-semibold">{label}</Label>
              <Input
                id={name}
                type={type || 'text'}
                autoComplete="off"
                disabled={isLoading}
                value={edits[name] ?? saved?.[name] ?? ''}
                placeholder={t('uses_voxeno_key', 'Default')}
                onChange={(e) => setEdits((prev) => ({ ...prev, [name]: e.target.value }))}
                className="h-9 bg-input-color border-input-border-color text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-input-border-color/60">
        <span className="text-xs font-bold text-subtitle-color uppercase tracking-wider">Plivo Telephony</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PLIVO_FIELDS.map(({ name, label, placeholder, type }) => (
            <div key={name} className="space-y-1">
              <Label htmlFor={name} className="text-xs font-semibold">{label}</Label>
              <Input
                id={name}
                type={type || 'text'}
                autoComplete="off"
                disabled={isLoading}
                value={edits[name] ?? saved?.[name] ?? ''}
                placeholder={placeholder || t('uses_voxeno_key', 'Default')}
                onChange={(e) => setEdits((prev) => ({ ...prev, [name]: e.target.value }))}
                className="h-9 bg-input-color border-input-border-color text-xs"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={isSaving || Object.keys(edits).length === 0} className="h-9 px-4 bg-primary text-white">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save_keys')}
        </Button>
      </div>
    </div>
  )
}

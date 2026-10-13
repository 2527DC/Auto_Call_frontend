'use client'

import { useGetPublicSettingsQuery } from '@/redux/api/adminSettingApi'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

// How many AI call minutes (or calls, when credits are charged per call) a plan's credits buy,
// using the admin's credit settings. Defaults match the backend: 1 credit a minute.
export function useCallMinutes() {
  const { t } = useTranslation()
  const { data } = useGetPublicSettingsQuery(undefined)
  const settings = data?.settings
  const perCall = settings?.credit_deduction_type === 'per_call'
  const creditsEach = Number(perCall ? settings?.credits_per_call : settings?.credits_per_minute) || 1
  const premiumMultiplier = Number(settings?.credit_multiplier_elevenlabs) || 2

  const allowance = useCallback((credits?: number) => Math.floor((credits || 0) / creditsEach), [creditsEach])

  // "300 call minutes" or "300 calls".
  const describe = useCallback(
    (credits?: number) => {
      const amount = allowance(credits).toLocaleString('en-IN')
      return perCall ? `${amount} ${t('ai_calls_unit', 'AI calls')}` : `${amount} ${t('call_minutes_unit', 'call minutes')}`
    },
    [allowance, perCall, t],
  )

  const unitLabel = perCall ? t('ai_calls_label', 'AI calls') : t('call_minutes_label', 'Call minutes')
  const shortUnit = perCall ? t('calls_short', 'calls') : t('minutes_short', 'min')

  return { allowance, describe, unitLabel, shortUnit, perCall, premiumMultiplier }
}

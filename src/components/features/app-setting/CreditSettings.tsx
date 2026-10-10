'use client'

import Spinner from '@/components/reusable/Spinner'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import { useGetAdminSettingsQuery, useUpdateAdminSettingsMutation } from '@/redux/api/adminSettingApi'
import { ApiError } from '@/types/api'
import { adminSettingSchemas } from '@/utils/validation-schemas'
import { Form, Formik } from 'formik'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import CreditSettingsCard from './credits/CreditSettingsCard'
import ProviderCostsCard from './credits/ProviderCostsCard'

const FormikStateConnector = ({
  setSaveState,
  isUpdating,
  dirty,
  canUpdate,
}: {
  setSaveState: (state: any) => void
  isUpdating: boolean
  dirty: boolean
  canUpdate: boolean
}) => {
  useEffect(() => {
    setSaveState({
      isUpdating,
      canSave: dirty && canUpdate,
      formId: 'credit-settings-form',
    })
  }, [isUpdating, dirty, canUpdate, setSaveState])

  return null
}

const CreditSettings = ({ setSaveState }: { setSaveState: (state: any) => void }) => {
  const { t } = useTranslation()
  const { hasPermission } = usePermission()
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_SETTINGS)
  const { data: settingsData, isLoading: isFetching } = useGetAdminSettingsQuery(undefined)
  const [updateSettings, { isLoading: isUpdating }] = useUpdateAdminSettingsMutation()

  // Same defaults as the backend, for settings saved before these fields existed.
  const initialValues = {
    credit_deduction_type: 'per_minute',
    credits_per_call: 1,
    credits_per_minute: 1,
    credits_per_sms: 1,
    free_credits_on_registration: 0,
    credit_multiplier_deepgram: 1,
    credit_multiplier_sarvam_ai: 1,
    credit_multiplier_elevenlabs: 2,
    credits_per_whatsapp_message: 0,
    cost_telephony_per_minute: 0.38,
    cost_stt_per_minute_deepgram: 0.42,
    cost_stt_per_minute_sarvam_ai: 0.5,
    cost_stt_per_minute_elevenlabs: 0.36,
    cost_tts_per_1k_chars_deepgram: 1.46,
    cost_tts_per_1k_chars_sarvam_ai: 3,
    cost_tts_per_1k_chars_elevenlabs: 3.88,
    cost_llm_input_per_1m_tokens: 14.55,
    cost_llm_output_per_1m_tokens: 58.2,
    cost_sms_per_message: 0,
    cost_whatsapp_per_message: 0,
  }

  const onSubmit = async (values: typeof initialValues) => {
    try {
      const response = await updateSettings(values).unwrap()
      toast.success(response.message || t('settings_updated_successfully'))
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError?.data?.message || t('failed_to_update_settings'))
    }
  }

  if (isFetching) {
    return <Spinner className="h-auto py-20" size="md" />
  }

  const settings = settingsData?.settings || {}
  const currentValues = {
    ...initialValues,
    ...settings,
    credits_per_sms: settings.credits_per_sms ?? initialValues.credits_per_sms,
  }

  return (
    <Formik
      initialValues={currentValues}
      enableReinitialize
      validationSchema={adminSettingSchemas.credits()}
      onSubmit={onSubmit}
    >
      {({ dirty }) => (
        <Form id="credit-settings-form" className="space-y-6 animate-in fade-in duration-700">
          <FormikStateConnector
            setSaveState={setSaveState}
            isUpdating={isUpdating}
            dirty={dirty}
            canUpdate={canUpdate}
          />
          <div className="grid grid-cols-1 gap-6">
            <CreditSettingsCard />
            <ProviderCostsCard />
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default CreditSettings

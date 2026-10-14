'use client'

import TextInput from '@/components/shared/TextInput'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditSettingsFormValues } from '@/types/settings'
import { useFormikContext } from 'formik'
import { ClipboardCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const inputClass =
  'h-10 w-full px-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 focus:ring-1 focus:ring-primary/20 transition-all rounded-lg text-sm'

const CallOutcomesCard = () => {
  const { t } = useTranslation()
  const { values, setFieldValue } = useFormikContext<CreditSettingsFormValues>()

  return (
    <Card className="bg-bg-card border border-input-border-color rounded-lg overflow-hidden">
      <CardHeader className="sm:px-6 px-4 py-4 border-b border-input-border-color bg-bg-card">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-zinc-500" />
          <CardTitle className="text-xl font-semibold text-title">{t('call_outcomes', 'Call outcomes')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="sm:p-6 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="outcomes_mode" className="text-md font-semibold text-title">
            {t('ai_call_outcomes', 'AI call outcomes')}
          </Label>
          <Select
            value={values.outcomes_mode || 'off'}
            onValueChange={(value) => setFieldValue('outcomes_mode', value)}
          >
            <SelectTrigger id="outcomes_mode" className="h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 rounded-lg text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">{t('outcomes_mode_off', 'Off')}</SelectItem>
              <SelectItem value="admin_only">{t('outcomes_mode_admin_only', "Only admins' own agents (to try it)")}</SelectItem>
              <SelectItem value="all">{t('outcomes_mode_all', 'Everyone')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-subtitle-color">
            {t('ai_call_outcomes_hint', 'After each call the AI writes a summary, picks an outcome and plans follow-ups.')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="credits_per_analysis" className="text-md font-semibold text-title">
            {t('credits_per_analysis', 'Credits per analysed call')}
          </Label>
          <div className="relative">
            <TextInput
              name="credits_per_analysis"
              type="number"
              min={0}
              step={0.05}
              placeholder="0"
              className={`${inputClass} pr-16`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {t('credits')}
            </div>
          </div>
          <p className="text-sm text-subtitle-color">{t('credits_per_analysis_hint', '0 = free')}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-md font-semibold text-title">
            {t('calling_hours_india', 'Calling hours (India time)')}
          </Label>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <TextInput
                name="calling_window_start"
                type="number"
                min={0}
                max={23}
                step={1}
                placeholder="10"
                aria-label={t('calling_window_start', 'Start hour')}
                className={inputClass}
              />
            </div>
            <span className="h-10 flex items-center text-sm text-subtitle-color">{t('to', 'to')}</span>
            <div className="flex-1">
              <TextInput
                name="calling_window_end"
                type="number"
                min={1}
                max={24}
                step={1}
                placeholder="21"
                aria-label={t('calling_window_end', 'End hour')}
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-sm text-subtitle-color">
            {t('calling_hours_hint', 'Campaigns, retries and AI callbacks only call within these hours.')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default CallOutcomesCard

'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textArea'
import { ROUTES } from '@/constants/routes'
import { useGetFormsQuery } from '@/redux/api/formApi'
import { useGetGoogleSheetsQuery } from '@/redux/api/googleSheetsApi'
import { AfterCallCardProps, AgentFollowUpMode } from '@/types/agent'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

const NONE = '__none'

// After each call the AI writes a summary, picks the outcome and fills in the
// chosen form's details; this card sets how, and who follows up.
export function AfterCallCard({ analysis, onChange }: AfterCallCardProps) {
  const { t } = useTranslation()
  const { data: forms } = useGetFormsQuery({ limit: 100 })
  const { data: sheets } = useGetGoogleSheetsQuery()
  const trigger = 'h-10 rounded-radius bg-input-color border-input-border-color dark:border-white/10 shadow-none font-bold'

  return (
    <div className="bg-bg-card p-4 sm:p-6 rounded-radius border border-input-border-color">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-black">{t('after_the_call', 'After the call')}</h2>
          <p className="text-sm text-subtitle-color mt-1">{t('after_the_call_hint', 'A summary, what happened, and the details the caller gave.')}</p>
        </div>
        <Switch checked={analysis.enabled} onCheckedChange={(v) => onChange({ enabled: v })} aria-label={t('analyse_calls', 'Analyse calls after they end')} />
      </div>

      {analysis.enabled ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-md font-medium text-title">{t('details_to_collect', 'Details to collect')}</Label>
            <Select value={analysis.form_id || NONE} onValueChange={(v) => onChange({ form_id: v === NONE ? null : v })}>
              <SelectTrigger className={trigger}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-radius bg-bg-card">
                <SelectItem value={NONE}>{t('none', 'None')}</SelectItem>
                {(forms?.data || []).map((f) => <SelectItem key={f.id || f._id} value={(f.id || f._id) as string}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-subtitle-color">
              {t('details_to_collect_hint', 'The AI fills in this Lead Capture Form from what the caller said.')}{' '}
              <Link href={`${ROUTES.LEAD_CAPTURE_FORMS}/new`} className="text-primary font-semibold hover:underline">{t('create_form', 'Create a form')}</Link>
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-md font-medium text-title">{t('success_for_agent', 'What counts as success for this agent')}</Label>
            <Textarea value={analysis.success_description} maxLength={1000} onChange={(e) => onChange({ success_description: e.target.value })}
              placeholder={t('success_for_agent_placeholder', 'e.g. A site visit was booked. Leave empty to use your Call Outcomes setting.')}
              className="min-h-20 bg-input-color border-input-border-color" />
          </div>

          <div className="space-y-2">
            <Label className="text-md font-medium text-title">{t('who_follows_up', 'Who follows up')}</Label>
            <Select value={analysis.follow_up_mode} onValueChange={(v) => onChange({ follow_up_mode: v as AgentFollowUpMode })}>
              <SelectTrigger className={trigger}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-radius bg-bg-card">
                <SelectItem value="default">{t('fu_mode_default', 'Use my default')}</SelectItem>
                <SelectItem value="ai_call">{t('fu_mode_ai_calls_back', 'The AI agent calls back')}</SelectItem>
                <SelectItem value="team">{t('fu_mode_team', 'My team')}</SelectItem>
                <SelectItem value="off">{t('fu_mode_off', 'Nobody (no follow-ups)')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-md font-medium text-title">{t('google_sheet_for_results', 'Google Sheet for results')}</Label>
            <Select value={analysis.google_sheet_id || NONE} onValueChange={(v) => onChange({ google_sheet_id: v === NONE ? null : v })}>
              <SelectTrigger className={trigger}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-radius bg-bg-card">
                <SelectItem value={NONE}>{t('none', 'None')}</SelectItem>
                {(sheets?.data || []).map((s) => <SelectItem key={s.id || s._id} value={(s.id || s._id) as string}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-subtitle-color">{t('google_sheet_hint', 'One row per call: outcome, summary and details.')}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-md font-medium text-title">{t('extra_instructions', 'Extra instructions for the summary')}</Label>
            <Textarea value={analysis.extra_instructions} maxLength={1000} onChange={(e) => onChange({ extra_instructions: e.target.value })}
              placeholder={t('extra_instructions_placeholder', 'e.g. Always note which project they asked about.')}
              className="min-h-16 bg-input-color border-input-border-color" />
          </div>
        </div>
      ) : (
        <p className="text-sm text-subtitle-color">{t('analysis_off_hint', "Calls from this agent won't get a summary, outcome or follow-ups.")}</p>
      )}
    </div>
  )
}

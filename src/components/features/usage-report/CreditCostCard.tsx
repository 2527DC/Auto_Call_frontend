'use client'

import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useGetCreditCostQuery } from '@/redux/api/usageReportApi'
import { useTranslation } from 'react-i18next'

const VOICE_LABELS: Record<string, string> = { deepgram: 'Deepgram', sarvam_ai: 'Sarvam AI', elevenlabs: 'ElevenLabs' }

const marginTone = (margin: number | null) =>
  margin === null || margin < 0 ? 'text-destructive' : margin < 30 ? 'text-amber-600' : 'text-emerald-600'

// What one credit costs the owner, next to what each plan charges for one.
const CreditCostCard = () => {
  const { t } = useTranslation()
  const { data } = useGetCreditCostQuery(undefined, { refetchOnMountOrArgChange: true })
  if (!data) return null

  const unit = data.deduction_type === 'per_minute' ? t('min', 'min') : t('call', 'call')
  const credits = (n: number) => `${n} ${n === 1 ? t('credit_lower', 'credit') : t('credits_lower', 'credits')}`
  const rows = [
    ...data.voices.map((v) => ({
      key: v.provider,
      label: `${VOICE_LABELS[v.provider]} ${t('voice_calls', 'voice calls')}`,
      detail: `${credits(v.credits_per_minute)} / ${unit}`,
      cost: v.cost_per_credit,
      source: v.measured_cost_per_credit !== null
        ? t('from_real_calls', 'from {{count}} real calls', { count: v.measured_calls })
        : t('estimate', 'estimate'),
    })),
    ...(data.sms ? [{
      key: 'sms',
      label: 'SMS',
      detail: `${credits(data.sms.credits_per_message)} / SMS`,
      cost: data.sms.cost_per_credit,
      source: data.sms.cost_per_message > 0 ? `${formatMoney(data.sms.cost_per_message)} / SMS` : t('sms_cost_not_set', 'SMS cost not set'),
    }] : []),
    ...(data.whatsapp ? [{
      key: 'whatsapp',
      label: 'WhatsApp',
      detail: `${credits(data.whatsapp.credits_per_message)} / ${t('message_lower', 'message')}`,
      cost: data.whatsapp.cost_per_credit,
      source: `${formatMoney(data.whatsapp.cost_per_message)} / ${t('message_lower', 'message')}`,
    }] : []),
  ]

  return (
    <div className="rounded-lg border border-input-border-color bg-bg-card p-4 sm:p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-title">{t('what_one_credit_costs_you', 'What 1 credit costs you')}</h2>
          <p className="text-sm text-subtitle-color mt-0.5">
            {t('credit_cost_desc', 'Price every plan above the highest cost per credit and no client can use more than they paid for.')}
          </p>
        </div>
        <div className="sm:text-right shrink-0">
          <p className="text-xs text-subtitle-color">{t('highest_cost_per_credit', 'Highest cost per credit')}</p>
          <p className="text-2xl font-bold text-amber-600">{formatMoney(data.cost_per_credit)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-title">{t('cost_per_credit', 'Cost per credit')}</h3>
          <div className="divide-y divide-input-border-color rounded-lg border border-input-border-color">
            {rows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-title">{row.label}</p>
                  <p className="text-xs text-subtitle-color">{row.detail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('text-sm font-semibold', row.cost === data.cost_per_credit ? 'text-amber-600' : 'text-title')}>{formatMoney(row.cost)}</p>
                  <p className="text-xs text-subtitle-color">{row.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-title">{t('what_plans_charge', 'What your plans charge per credit')}</h3>
          <div className="divide-y divide-input-border-color rounded-lg border border-input-border-color">
            {data.plans.length === 0 && <p className="px-3 py-2 text-sm text-subtitle-color">{t('no_active_plans', 'No active plans with credits.')}</p>}
            {data.plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-title flex items-center gap-2 flex-wrap">
                    {plan.name}
                    {plan.visibility === 'private' && <Badge variant="outline" className="text-[10px]">{t('private', 'Private')}</Badge>}
                    {plan.plan_type === 'top_up' && <Badge variant="outline" className="text-[10px]">{t('top_up', 'Top Up')}</Badge>}
                  </div>
                  <p className="text-xs text-subtitle-color">
                    {formatMoney(plan.amount)} / {plan.total_credits.toLocaleString('en-IN')} {t('credits_lower', 'credits')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-title">{formatMoney(plan.price_per_credit)}</p>
                  <p className={cn('text-xs font-medium', marginTone(plan.margin_percent))}>
                    {plan.margin_percent === null
                      ? t('free', 'Free')
                      : plan.margin_percent < 0
                        ? t('loss_per_credit', 'loses up to {{amount}} / credit', { amount: formatMoney(data.cost_per_credit - plan.price_per_credit) })
                        : t('margin_value', '{{value}}% margin', { value: plan.margin_percent })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-subtitle-color">
        {t('credit_cost_note', 'Estimates assume a typical minute: the caller speaks 30 seconds, the agent says 450 characters and the AI reads about 10,000 tokens. A voice switches to its real cost once it has {{calls}} calls in the last {{days}} days. Your server and phone number rental are not included. Rates are in Settings → Credits.', { calls: data.min_measured_calls, days: data.measure_days })}
      </p>
    </div>
  )
}

export default CreditCostCard

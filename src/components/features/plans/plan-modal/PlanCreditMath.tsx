'use client'

import { formatMoney } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useGetCreditCostQuery } from '@/redux/api/usageReportApi'
import { useTranslation } from 'react-i18next'

const TARGET_MARGIN = 0.5

// Live price-per-credit check while an admin sets a plan's price and credits.
const PlanCreditMath = ({ amount, credits }: { amount?: number | null; credits?: number | null }) => {
  const { t } = useTranslation()
  const { data } = useGetCreditCostQuery(undefined, { refetchOnMountOrArgChange: true })
  const price = Number(amount) || 0
  const total = Number(credits) || 0
  if (!data || total <= 0) return null

  const cost = data.cost_per_credit
  const perCredit = price / total
  const keep = perCredit - cost
  const loss = keep < 0
  const margin = perCredit > 0 ? Math.round((keep / perCredit) * 100) : null
  const fullCost = total * cost
  const maxCredits = cost > 0 && price > 0 ? Math.floor((price * (1 - TARGET_MARGIN)) / cost) : null

  return (
    <div className={cn('rounded-lg border p-3 text-sm space-y-1', loss ? 'border-destructive/40 bg-destructive/5' : 'border-emerald-500/30 bg-emerald-500/5')}>
      <p className={cn('font-semibold', loss ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400')}>
        {loss
          ? t('plan_credit_loss', '{{price}} per credit, but a credit can cost you up to {{cost}}. You lose up to {{keep}} per credit.', { price: formatMoney(perCredit), cost: formatMoney(cost), keep: formatMoney(-keep) })
          : t('plan_credit_profit', '{{price}} per credit, costs you up to {{cost}}. You keep {{keep}} per credit ({{margin}}%).', { price: formatMoney(perCredit), cost: formatMoney(cost), keep: formatMoney(keep), margin })}
      </p>
      <p className="text-subtitle-color">
        {price - fullCost < 0
          ? t('plan_credit_full_use_loss', 'If all {{credits}} credits are used: cost up to {{cost}}, a loss of {{amount}}.', { credits: total.toLocaleString('en-IN'), cost: formatMoney(fullCost), amount: formatMoney(fullCost - price) })
          : t('plan_credit_full_use_profit', 'If all {{credits}} credits are used: cost up to {{cost}}, a profit of {{amount}}.', { credits: total.toLocaleString('en-IN'), cost: formatMoney(fullCost), amount: formatMoney(price - fullCost) })}
      </p>
      {maxCredits !== null && (
        <p className="text-subtitle-color">
          {t('plan_credit_suggest', 'For a {{margin}}% margin at this price, give at most {{credits}} credits.', { margin: TARGET_MARGIN * 100, credits: maxCredits.toLocaleString('en-IN') })}
        </p>
      )}
    </div>
  )
}

export default PlanCreditMath

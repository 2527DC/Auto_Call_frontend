'use client'

import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { EstimateInputs, EstimatorRates } from '@/types/priceEstimator'
import { AlertTriangle, ArrowUpRight, CircleCheck, CircleX, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Estimate, scenarioProfit, verdictFor } from './estimate'
import { money, pct, rupees } from './fields'
import { VERDICT_STYLES } from './sections/BargainingSection'

const VERDICT_TEXT = {
  loss: 'You lose money on this deal every month.',
  thin: 'Profitable, but under your walk-away margin. Push back or cut scope.',
  healthy: 'Profitable, a little under your target margin.',
  excellent: 'Profitable at or above your target margin.',
}

const Row = ({ label, value, tone, strong }: { label: string; value: string; tone?: string; strong?: boolean }) => (
  <div className="flex items-baseline justify-between gap-3 py-1">
    <span className="text-sm text-subtitle-color">{label}</span>
    <span className={cn('tabular-nums text-sm', strong && 'font-bold text-base', tone || 'text-title')}>{value}</span>
  </div>
)

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-input-border-color bg-bg-card p-4">
    <h3 className="text-xs font-bold uppercase tracking-wider text-subtitle-color mb-2">{title}</h3>
    {children}
  </div>
)

const SummaryPanel = ({ inputs, data, est }: { inputs: EstimateInputs; data: EstimatorRates; est: Estimate }) => {
  const verdict = verdictFor(est.marginPercent, inputs)
  const style = VERDICT_STYLES[verdict]
  const Icon = verdict === 'loss' ? CircleX : verdict === 'thin' ? AlertTriangle : CircleCheck
  const priced = est.lines.filter((l) => l.cost > 0 || l.price > 0)

  const scenarios = inputs.voice.enabled && est.minutes > 0
    ? [
        { label: 'Light talk', ...scenarioProfit(inputs, data, est, 'light') },
        { label: 'Typical talk', ...scenarioProfit(inputs, data, est, 'typical') },
        { label: 'Heavy talk', ...scenarioProfit(inputs, data, est, 'heavy') },
        { label: '+25% minutes', ...scenarioProfit(inputs, data, est, undefined, 1.25) },
        { label: '+50% minutes', ...scenarioProfit(inputs, data, est, undefined, 1.5) },
      ]
    : []

  return (
    <div className="space-y-4">
      <div className={cn('rounded-lg border p-4', verdict === 'loss' ? 'border-destructive/40 bg-destructive/5' : verdict === 'thin' ? 'border-amber-500/40 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5')}>
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', style.text)} />
          <span className={cn('text-sm font-bold uppercase tracking-wide', style.text)}>{style.label}</span>
        </div>
        <p className="text-sm text-subtitle-color mt-1">{VERDICT_TEXT[verdict]}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-subtitle-color">Profit / month</p>
            <p className={cn('text-2xl font-bold tabular-nums', est.monthlyProfit < 0 ? 'text-destructive' : 'text-emerald-600')}>{rupees(est.monthlyProfit)}</p>
          </div>
          <div>
            <p className="text-xs text-subtitle-color">Margin</p>
            <p className={cn('text-2xl font-bold tabular-nums', style.text)}>{pct(est.marginPercent)}</p>
          </div>
        </div>
        <div className="mt-3 border-t border-input-border-color pt-2">
          <Row label={inputs.pricing.agreed_price != null ? 'Agreed price' : 'Deal price'} value={rupees(est.dealPrice)} />
          <Row label="Your cost" value={`− ${rupees(est.monthlyCost)}`} tone="text-amber-600" />
          <Row label={`Gateway fee (${inputs.pricing.gateway_fee_percent}%)`} value={`− ${rupees(est.gatewayFee)}`} tone="text-amber-600" />
          {est.pricePerMinute !== null && (
            <Row label="All-in price per minute" value={`${money(est.pricePerMinute)} (cost ${money(est.costPerMinute)})`} />
          )}
        </div>
      </div>

      {est.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
          {est.warnings.map((w) => (
            <p key={w} className="flex gap-2 text-xs text-amber-700 dark:text-amber-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{w}</p>
          ))}
        </div>
      )}

      <Card title="Profit by module (monthly)">
        <div className="divide-y divide-input-border-color">
          {priced.map((l) => {
            const profit = l.price - l.cost
            return (
              <div key={l.key} className="py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-title">{l.label}</span>
                  <span className={cn('text-sm font-bold tabular-nums', profit < 0 ? 'text-destructive' : 'text-emerald-600')}>{rupees(profit)}</span>
                </div>
                <div className="flex justify-between gap-2 text-[11px] text-subtitle-color tabular-nums">
                  <span>{l.detail}</span>
                  <span>{rupees(l.price)} − {rupees(l.cost)}{l.price > 0 && ` · ${pct((profit / l.price) * 100)}`}</span>
                </div>
              </div>
            )
          })}
          {est.dealPrice !== est.listPrice && (
            <div className="py-2 flex items-baseline justify-between gap-2">
              <span className="text-sm text-subtitle-color">{inputs.pricing.agreed_price != null ? 'Bargained away' : 'Discount'}</span>
              <span className={cn('text-sm font-bold tabular-nums', est.dealPrice < est.listPrice ? 'text-destructive' : 'text-emerald-600')}>{rupees(est.dealPrice - est.listPrice)}</span>
            </div>
          )}
        </div>
      </Card>

      {scenarios.length > 0 && (
        <Card title="What if usage differs (same price)">
          <div className="space-y-1">
            {scenarios.map((s) => (
              <div key={s.label} className="grid grid-cols-[1fr_auto_56px] gap-3 items-baseline text-sm tabular-nums">
                <span className="text-subtitle-color">{s.label}</span>
                <span className={cn('font-semibold', s.profit < 0 ? 'text-destructive' : 'text-title')}>{rupees(s.profit)}</span>
                <span className={cn('text-xs text-right', VERDICT_STYLES[verdictFor(s.margin, inputs)].text)}>{pct(s.margin)}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-subtitle-color mt-2">If heavy use loses money, cap the minutes in the plan or charge per extra minute.</p>
        </Card>
      )}

      <Card title={`Contract (${est.contract.months} months)`}>
        <Row label={`Set-up fee (${est.setup.hours} h work)`} value={`${rupees(est.setup.fee)} − ${rupees(est.setup.cost)}`} />
        <Row label="Set-up profit" value={rupees(est.setup.profit)} tone={est.setup.profit < 0 ? 'text-destructive' : 'text-emerald-600'} />
        <Row label="Contract value" value={rupees(est.contract.value)} />
        <Row label="Total profit" value={rupees(est.contract.profit)} tone={est.contract.profit < 0 ? 'text-destructive' : 'text-emerald-600'} strong />
        {est.setup.profit < 0 && (
          <p className="text-[11px] text-subtitle-color mt-1">
            {est.contract.paybackMonths === null ? 'Monthly profit never pays back the set-up work.' : `Set-up work pays back in ${est.contract.paybackMonths} month${est.contract.paybackMonths === 1 ? '' : 's'}.`}
          </p>
        )}
      </Card>

      <Card title="Client's invoice (incl. GST)">
        <Row label={`Monthly (+${inputs.pricing.gst_percent}% GST)`} value={money(est.invoice.monthly)} />
        <Row label="Set-up, one time" value={money(est.invoice.setup)} />
      </Card>

      {est.credits.total > 0 && (
        <Card title="Sell it as a private credit plan">
          <Row label="Credits a month" value={est.credits.total.toLocaleString('en-IN')} />
          <Row label="Price per credit" value={est.credits.pricePerCredit !== null ? money(est.credits.pricePerCredit) : '—'} />
          <Row label="Usage cost per credit" value={est.credits.costPerCredit !== null ? money(est.credits.costPerCredit) : '—'} tone="text-amber-600" />
          {data.plans.length > 0 && (
            <p className="text-[11px] text-subtitle-color mt-1">
              Your public plans charge {data.plans.filter((pl) => pl.visibility === 'public').map((pl) => `${pl.name} ${money(pl.price_per_credit)}`).join(' · ') || '—'} per credit.
            </p>
          )}
          <Link href={ROUTES.PLANS} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Create the plan in Plans <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      )}

      <Card title="Market check (India, Oct 2026)">
        <div className="flex items-start gap-2 text-xs text-subtitle-color">
          <TrendingUp className="w-4 h-4 shrink-0 text-primary" />
          <p>AI calling sells at about <b className="text-title">₹4–6 a minute</b> all-in: Tabbly ₹4.65, Trikon ₹5 (₹4 above 5,000 min), Bolna ₹5.52, Ringg ₹6 plus ₹499 per number. Cheap headline prices (₹0.50–3) leave out the line, AI or voice.</p>
        </div>
      </Card>
    </div>
  )
}

export default SummaryPanel

'use client'

import { DataTable } from '@/components/reusable/DataTable'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMoney as money } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useGetUsageReportQuery } from '@/redux/api/usageReportApi'
import { Column } from '@/types/table'
import { UsageReportClient } from '@/types/usageReport'
import { IndianRupee, Percent, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreditCostCard from './CreditCostCard'

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Per client: what they used, what it cost you, what their credits earned and the profit.
const UsageReportPage = () => {
  const { t } = useTranslation()
  const today = new Date()
  const [from, setFrom] = useState(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)))
  const [to, setTo] = useState(isoDate(today))
  const { data, isFetching } = useGetUsageReportQuery({ from, to })
  const totals = data?.totals

  const cards = [
    { label: t('payments_received', 'Payments received'), value: totals ? money(totals.paid) : '—', icon: Wallet, tone: 'text-indigo-600' },
    { label: t('revenue', 'Revenue'), value: totals ? money(totals.revenue) : '—', icon: IndianRupee, tone: 'text-primary' },
    { label: t('provider_cost', 'Provider cost'), value: totals ? money(totals.cost.total) : '—', icon: TrendingDown, tone: 'text-amber-600' },
    { label: t('profit', 'Profit'), value: totals ? money(totals.profit) : '—', icon: TrendingUp, tone: totals && totals.profit < 0 ? 'text-destructive' : 'text-emerald-600' },
    { label: t('margin', 'Margin'), value: totals?.margin_percent != null ? `${totals.margin_percent}%` : '—', icon: Percent, tone: 'text-sky-600' },
  ]

  const columns: Column<UsageReportClient>[] = [
    {
      header: t('client', 'Client'),
      className: 'min-w-[200px]',
      cell: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-title flex items-center gap-2">
            {row.user.name}
            {row.user.is_admin && <Badge variant="outline" className="text-[10px]">{t('admin', 'Admin')}</Badge>}
          </span>
          <span className="text-xs text-subtitle-color break-all">{row.user.email}</span>
        </div>
      ),
    },
    {
      header: t('plan', 'Plan'),
      className: 'min-w-[130px]',
      cell: (row) => (
        <div className="flex flex-col">
          {row.plan
            ? <><span className="font-medium">{row.plan.name}</span><span className="text-xs text-subtitle-color">{money(row.plan.price_per_credit)} / {t('credit', 'credit')}</span></>
            : <span className="text-xs text-subtitle-color">{t('no_plan', 'No plan')}</span>}
          {row.credits_left !== null && (
            <span className={cn('text-xs', row.credits_left <= 0 ? 'text-destructive' : 'text-subtitle-color')}>
              {row.credits_left.toLocaleString('en-IN')} {t('credits_left', 'credits left')}
            </span>
          )}
        </div>
      ),
    },
    {
      header: t('usage', 'Usage'),
      className: 'min-w-[200px]',
      cell: (row) => (
        <div className="text-xs text-subtitle-color space-y-0.5">
          <div><span className="font-semibold text-title">{row.calls}</span> {t('calls', 'calls')} · {row.minutes} {t('min', 'min')}</div>
          {(row.sms > 0 || row.whatsapp > 0) && <div>{row.sms} SMS · {row.whatsapp} WhatsApp</div>}
          <div>{row.credits_used} {t('credits_used', 'credits used')}</div>
          {(row.usage.llm_tokens > 0 || row.usage.tts_characters > 0 || row.usage.stt_minutes > 0) && (
            <div>AI {compact(row.usage.llm_tokens)} {t('tokens', 'tokens')} · {t('voice', 'Voice')} {compact(row.usage.tts_characters)} {t('chars', 'chars')} · STT {row.usage.stt_minutes} {t('min', 'min')}</div>
          )}
        </div>
      ),
    },
    {
      header: t('revenue', 'Revenue'),
      className: 'min-w-[110px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold">{money(row.revenue)}</span>
          {!row.user.is_admin && <span className="text-xs text-subtitle-color">{money(row.paid)} {t('paid_lower', 'paid')}</span>}
        </div>
      ),
    },
    {
      header: t('provider_cost', 'Provider cost'),
      className: 'min-w-[220px]',
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="font-semibold">{money(row.cost.total)}</span>
          <div className="text-[11px] text-subtitle-color leading-snug">
            {t('phone', 'Phone')} {money(row.cost.telephony)} · STT {money(row.cost.stt)} · {t('voice', 'Voice')} {money(row.cost.tts)} · AI {money(row.cost.llm)}
            {(row.cost.sms > 0 || row.cost.whatsapp > 0) && <> · SMS {money(row.cost.sms)} · WA {money(row.cost.whatsapp)}</>}
          </div>
        </div>
      ),
    },
    {
      header: t('profit', 'Profit'),
      className: 'min-w-[120px]',
      cell: (row) => (
        <div className="flex flex-col">
          <span className={cn('font-bold', row.profit < 0 ? 'text-destructive' : 'text-emerald-600')}>{money(row.profit)}</span>
          {row.margin_percent != null && <span className="text-xs text-subtitle-color">{row.margin_percent}%</span>}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-title">{t('cost_and_profit', 'Cost & Profit')}</h1>
          <p className="text-md text-subtitle-color mt-1">
            {t('cost_and_profit_desc', 'What each client used, what it cost you, and what their credits earned. Lowest profit first.')}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="report-from" className="text-xs text-subtitle-color">{t('from', 'From')}</Label>
            <Input id="report-from" type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className="h-10 w-40 bg-input-color border-input-border-color" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="report-to" className="text-xs text-subtitle-color">{t('to', 'To')}</Label>
            <Input id="report-to" type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} className="h-10 w-40 bg-input-color border-input-border-color" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="p-4 rounded-lg border border-input-border-color bg-bg-card">
            <div className="flex items-center gap-2 text-sm text-subtitle-color">
              <card.icon className={cn('w-4 h-4', card.tone)} />
              {card.label}
            </div>
            <p className={cn('text-2xl font-bold mt-2', card.tone)}>{card.value}</p>
          </div>
        ))}
      </div>

      <CreditCostCard />

      <DataTable
        columns={columns}
        data={data?.clients || []}
        isLoading={isFetching}
        emptyMessage={t('no_usage_in_range', 'No usage in this date range.')}
      />

      <p className="text-xs text-subtitle-color">
        {t('cost_report_note', 'Every client with a plan is listed, even with no usage. Payments received are plan purchases and top-ups paid in this period; revenue is what their used credits earned (credits used × the plan\'s price per credit). Costs use the provider rates in Settings → Credits. Speech, voice and AI usage per call is recorded from 10 Oct 2026 onwards; WhatsApp and ElevenLabs SIP calls only count phone minutes.')}
      </p>
    </div>
  )
}

export default UsageReportPage

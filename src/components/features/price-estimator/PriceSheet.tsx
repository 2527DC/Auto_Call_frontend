'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useGetPublicSettingsQuery } from '@/redux/api/adminSettingApi'
import { useAppSelector } from '@/redux/hooks'
import { EstimateInputs, QuoteClient } from '@/types/priceEstimator'
import { Copy, EyeOff, Printer } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { toast } from 'sonner'
import { Estimate, SheetItem } from './estimate'
import { money, pct } from './fields'

const VALID_DAYS = 15

const qtyText = (i: SheetItem) => `${Number(i.qty.toFixed(2)).toLocaleString('en-IN')} ${i.unit}`
const day = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

interface SheetMeta {
  number: string
  date: Date
  validUntil: Date
  business: string
  businessEmail: string
  preparedBy: string
}

// The estimate as plain text, ready to paste into WhatsApp or an email. No costs.
export const sheetText = (client: QuoteClient, inputs: EstimateInputs, est: Estimate, meta: Pick<SheetMeta, 'business' | 'date' | 'validUntil'>) => {
  const gst = inputs.pricing.gst_percent
  const lines = [
    `${meta.business}: price estimate for ${client.company || client.name || 'you'}`,
    `${day(meta.date)} · valid till ${day(meta.validUntil)}`,
    '',
    'Monthly charges',
    ...est.priceItems.map((i) => i.note === 'Included' ? `• ${i.label}: included` : `• ${i.label}: ${qtyText(i)} × ${money(i.rate)} = ${money(i.amount)}`),
    `Subtotal: ${money(est.listPrice)}`,
  ]
  if (Math.abs(est.adjustment) >= 0.005) lines.push(`${inputs.pricing.agreed_price != null ? 'Agreed price adjustment' : `Discount ${inputs.pricing.discount_percent}%`}: ${money(est.adjustment)}`)
  lines.push(`GST ${gst}%: ${money(est.gst.monthly)}`, `Total per month: ${money(est.invoice.monthly)}`)
  if (est.setup.fee > 0) lines.push('', `One-time set-up: ${money(est.setup.fee)} + GST ${money(est.gst.setup)} = ${money(est.invoice.setup)}`)
  lines.push(`Due on sign-up: ${money(est.invoice.monthly + est.invoice.setup)}`)
  if (inputs.voice.enabled && inputs.voice.price_per_minute > 0) lines.push(`Extra minutes beyond ${Math.round(est.minutes).toLocaleString('en-IN')} a month: ${money(inputs.voice.price_per_minute)} per minute + GST.`)
  return lines.join('\n')
}

const Table = ({ head, children }: { head: string[]; children: ReactNode }) => (
  <table className="w-full text-sm tabular-nums">
    <thead>
      <tr className="border-b border-input-border-color text-[11px] font-bold uppercase tracking-wider text-subtitle-color">
        {head.map((h, i) => <th key={h} className={cn('py-2 font-bold', i === 0 ? 'text-left' : 'text-right', i === 1 && 'text-left pl-2')}>{h}</th>)}
      </tr>
    </thead>
    <tbody className="divide-y divide-input-border-color">{children}</tbody>
  </table>
)

const ItemRow = ({ index, item, costs }: { index: number; item: SheetItem; costs?: boolean }) => (
  <tr>
    <td className="py-2 pr-2 w-8 text-subtitle-color align-top">{index}</td>
    <td className="py-2 pl-2 pr-3 text-title align-top">
      {item.label}
      {item.note && item.note !== 'Included' && <span className="block text-[11px] text-subtitle-color">{item.note}</span>}
    </td>
    <td className="py-2 px-2 text-right text-subtitle-color whitespace-nowrap align-top">{qtyText(item)}</td>
    <td className="py-2 px-2 text-right text-subtitle-color whitespace-nowrap align-top">{item.note === 'Included' ? '—' : `× ${money(item.rate)}`}</td>
    <td className={cn('py-2 pl-2 text-right whitespace-nowrap align-top font-medium', costs ? 'text-amber-600' : 'text-title')}>
      {item.note === 'Included' ? 'Included' : money(item.amount)}
    </td>
  </tr>
)

const TotalRow = ({ label, value, strong, tone, sub }: { label: ReactNode; value: string; strong?: boolean; tone?: string; sub?: boolean }) => (
  <div className={cn('flex items-baseline justify-between gap-4 py-1', strong && 'border-t border-input-border-color pt-2 mt-1')}>
    <span className={cn('text-sm', strong ? 'font-bold text-title' : 'text-subtitle-color', sub && 'pl-3 text-xs')}>{label}</span>
    <span className={cn('tabular-nums', strong ? 'text-lg font-bold' : 'text-sm', tone || 'text-title')}>{value}</span>
  </div>
)

const Block = ({ title, children, tint }: { title: string; children: ReactNode; tint?: boolean }) => (
  <div className={cn('pe-avoid-break rounded-lg border border-input-border-color p-4', tint && 'pe-tint bg-amber-500/[0.04]')}>
    <h3 className="text-xs font-bold uppercase tracking-wider text-subtitle-color mb-1">{title}</h3>
    {children}
  </div>
)

const Sheet = ({ client, inputs, est, meta, showCosts }: { client: QuoteClient; inputs: EstimateInputs; est: Estimate; meta: SheetMeta; showCosts: boolean }) => {
  const p = inputs.pricing
  const gst = p.gst_percent
  const hasAdjustment = Math.abs(est.adjustment) >= 0.005
  const taxRows = p.interstate
    ? [{ label: `IGST ${gst}%`, value: est.gst.monthly, setup: est.gst.setup }]
    : [{ label: `CGST ${gst / 2}%`, value: est.gst.monthly / 2, setup: est.gst.setup / 2 }, { label: `SGST ${gst / 2}%`, value: est.gst.monthly / 2, setup: est.gst.setup / 2 }]

  return (
    <div className="pe-sheet mx-auto max-w-4xl rounded-xl border border-input-border-color bg-bg-card shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between gap-4 p-6 border-b border-input-border-color">
        <div>
          <p className="text-xl font-bold text-primary">{meta.business}</p>
          {meta.businessEmail && <p className="text-xs text-subtitle-color">{meta.businessEmail}</p>}
          <p className="mt-3 text-2xl font-bold text-title">Price estimate</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm self-start sm:text-right">
          <dt className="text-subtitle-color">Estimate no.</dt><dd className="font-semibold text-title">{meta.number}</dd>
          <dt className="text-subtitle-color">Date</dt><dd className="text-title">{day(meta.date)}</dd>
          <dt className="text-subtitle-color">Valid until</dt><dd className="text-title">{day(meta.validUntil)}</dd>
          {meta.preparedBy && <><dt className="text-subtitle-color">Prepared by</dt><dd className="text-title">{meta.preparedBy}</dd></>}
        </dl>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtitle-color">Prepared for</p>
          <p className="text-base font-semibold text-title mt-1">{client.company || client.name || 'Client name not entered'}</p>
          <p className="text-sm text-subtitle-color">
            {[client.company && client.name, client.phone, client.email, client.city].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="pe-avoid-break">
          <h3 className="text-sm font-bold text-title mb-1">Monthly charges</h3>
          <Table head={['#', 'Description', 'Quantity', 'Rate', 'Amount']}>
            {est.priceItems.length === 0
              ? <tr><td colSpan={5} className="py-4 text-center text-subtitle-color">No services selected yet.</td></tr>
              : est.priceItems.map((item, i) => <ItemRow key={item.key} index={i + 1} item={item} />)}
          </Table>
          <div className="mt-2 ml-auto max-w-sm">
            <TotalRow label="Subtotal" value={money(est.listPrice)} />
            {hasAdjustment && (
              <TotalRow
                label={p.agreed_price != null ? 'Agreed price adjustment' : `Discount (${p.discount_percent}%)`}
                value={money(est.adjustment)}
                tone={est.adjustment < 0 ? 'text-destructive' : 'text-emerald-600'}
              />
            )}
            <TotalRow label="Taxable value" value={money(est.dealPrice)} />
            {taxRows.map((t) => <TotalRow key={t.label} label={t.label} value={money(t.value)} sub />)}
            <TotalRow label="Total per month" value={money(est.invoice.monthly)} strong />
          </div>
        </div>

        {est.setup.fee > 0 && (
          <div className="pe-avoid-break">
            <h3 className="text-sm font-bold text-title mb-1">One-time set-up</h3>
            <Table head={['#', 'Description', 'Quantity', 'Rate', 'Amount']}>
              <ItemRow index={1} item={{ key: 'setup', module: 'platform', label: 'Set-up & onboarding: flows, scripts, testing and go-live', qty: 1, unit: 'lot', rate: est.setup.fee, amount: est.setup.fee }} />
            </Table>
            <div className="mt-2 ml-auto max-w-sm">
              {taxRows.map((t) => <TotalRow key={t.label} label={t.label} value={money(t.setup)} sub />)}
              <TotalRow label="Total set-up" value={money(est.invoice.setup)} strong />
            </div>
          </div>
        )}

        <div className="pe-avoid-break grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Due on sign-up', value: money(est.invoice.monthly + est.invoice.setup), hint: 'First month + set-up, incl. GST' },
            { label: 'Then every month', value: money(est.invoice.monthly), hint: 'incl. GST' },
            { label: `${est.contract.months}-month contract value`, value: money(est.contract.value), hint: 'excl. GST' },
          ].map((c) => (
            <div key={c.label} className="pe-tint rounded-lg bg-primary/[0.05] px-4 py-3">
              <p className="text-xs text-subtitle-color">{c.label}</p>
              <p className="text-lg font-bold text-title tabular-nums">{c.value}</p>
              <p className="text-[11px] text-subtitle-color">{c.hint}</p>
            </div>
          ))}
        </div>

        <div className="pe-avoid-break text-xs text-subtitle-color space-y-1">
          <p className="font-semibold text-title">Terms</p>
          <p>All prices are in Indian rupees. GST is charged as shown{p.interstate ? ' (IGST, client outside our state)' : ''}.</p>
          {inputs.voice.enabled && inputs.voice.price_per_minute > 0 && (
            <p>Includes {Math.round(est.minutes).toLocaleString('en-IN')} connected minutes a month; extra minutes are billed at {money(inputs.voice.price_per_minute)} per minute + GST.</p>
          )}
          <p>Monthly charges are billed in advance. This estimate is valid until {day(meta.validUntil)}.</p>
        </div>

        {showCosts && (
          <div className="pe-internal space-y-4 border-t-2 border-dashed border-amber-500/40 pt-6">
            <div className="flex items-center gap-2 text-amber-600">
              <EyeOff className="w-4 h-4" />
              <p className="text-sm font-bold">Internal: your cost & profit. Don&apos;t send this part to the client.</p>
            </div>

            <Block title="Your monthly cost" tint>
              <Table head={['#', 'Cost item', 'Quantity', 'Unit cost', 'Amount']}>
                {est.costItems.map((item, i) => <ItemRow key={item.key} index={i + 1} item={item} costs />)}
                <tr>
                  <td className="py-2 pr-2 w-8 text-subtitle-color">{est.costItems.length + 1}</td>
                  <td className="py-2 pl-2 pr-3 text-title">Payment gateway fee</td>
                  <td className="py-2 px-2 text-right text-subtitle-color whitespace-nowrap">{money(est.invoice.monthly)}</td>
                  <td className="py-2 px-2 text-right text-subtitle-color whitespace-nowrap">× {p.gateway_fee_percent}%</td>
                  <td className="py-2 pl-2 text-right font-medium text-amber-600">{money(est.gatewayFee)}</td>
                </tr>
              </Table>
              <div className="mt-2 ml-auto max-w-sm">
                <TotalRow label="Total cost per month" value={money(est.monthlyCost + est.gatewayFee)} tone="text-amber-600" />
                <TotalRow label="Price per month (excl. GST)" value={money(est.dealPrice)} />
                <TotalRow
                  label={<>Profit per month <span className="font-normal text-subtitle-color">({pct(est.marginPercent)} margin)</span></>}
                  value={money(est.monthlyProfit)}
                  tone={est.monthlyProfit < 0 ? 'text-destructive' : 'text-emerald-600'}
                  strong
                />
              </div>
            </Block>

            {(est.setup.fee > 0 || est.setupCostItems.length > 0) && (
              <Block title="Set-up cost" tint>
                <Table head={['#', 'Cost item', 'Quantity', 'Unit cost', 'Amount']}>
                  {est.setupCostItems.map((item, i) => <ItemRow key={item.key} index={i + 1} item={item} costs />)}
                </Table>
                <div className="mt-2 ml-auto max-w-sm">
                  <TotalRow label="Set-up cost" value={money(est.setup.cost)} tone="text-amber-600" />
                  <TotalRow label={`Gateway fee on set-up (${p.gateway_fee_percent}%)`} value={money(est.setup.fee * est.gatewayRate)} tone="text-amber-600" />
                  <TotalRow label="Set-up fee charged" value={money(est.setup.fee)} />
                  <TotalRow label="Set-up profit" value={money(est.setup.profit)} tone={est.setup.profit < 0 ? 'text-destructive' : 'text-emerald-600'} strong />
                </div>
              </Block>
            )}

            <Block title={`Whole contract (${est.contract.months} months)`} tint>
              <TotalRow label={`Monthly profit × ${est.contract.months}`} value={money(est.monthlyProfit * est.contract.months)} />
              <TotalRow label="+ Set-up profit" value={money(est.setup.profit)} />
              <TotalRow label="Total profit" value={money(est.contract.profit)} tone={est.contract.profit < 0 ? 'text-destructive' : 'text-emerald-600'} strong />
              {est.minutes > 0 && (
                <p className="text-[11px] text-subtitle-color mt-1">
                  Per minute: price {money(est.pricePerMinute ?? 0)}, your cost {money(est.costPerMinute)} (calls only).
                </p>
              )}
            </Block>
          </div>
        )}
      </div>
    </div>
  )
}

const PRINT_CSS = `
#pe-print-root { display: none; }
@media print {
  @page { size: A4; margin: 10mm; }
  html, body { background: #fff !important; }
  body > *:not(#pe-print-root) { display: none !important; }
  #pe-print-root { display: block !important; }
  #pe-print-root * { color: #18181b !important; border-color: #d4d4d8 !important; box-shadow: none !important; background-color: transparent !important; }
  #pe-print-root .pe-sheet { border: 0 !important; max-width: none !important; zoom: 0.9; }
  #pe-print-root .pe-tint { background-color: #f4f4f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #pe-print-root .pe-avoid-break { break-inside: avoid; }
  #pe-print-root .pe-internal { break-before: page; }
}`

const PriceSheet = ({ client, inputs, est, quoteId, onInputs }: {
  client: QuoteClient
  inputs: EstimateInputs
  est: Estimate
  quoteId: string | null
  onInputs: (next: EstimateInputs) => void
}) => {
  const [showCosts, setShowCosts] = useState(true)
  const [printing, setPrinting] = useState(false)
  const { data: settings } = useGetPublicSettingsQuery(undefined)
  const userName = useAppSelector((state) => state.auth.user?.name) || ''

  const [date] = useState(() => new Date())
  const meta: SheetMeta = {
    number: quoteId ? `EST-${quoteId.slice(-6).toUpperCase()}` : 'DRAFT',
    date,
    validUntil: new Date(date.getTime() + VALID_DAYS * 24 * 60 * 60 * 1000),
    business: settings?.data?.app_name || 'Voxeno',
    businessEmail: settings?.data?.support_email || settings?.data?.app_email || '',
    preparedBy: userName,
  }

  // Render a copy straight under <body> so the print shows only the estimate.
  const print = () => {
    flushSync(() => setPrinting(true))
    const done = () => {
      setPrinting(false)
      window.removeEventListener('afterprint', done)
    }
    window.addEventListener('afterprint', done)
    window.print()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sheetText(client, inputs, est, meta))
      toast.success('Estimate copied. Paste it into WhatsApp or email.')
    } catch {
      toast.error('Could not copy to the clipboard')
    }
  }

  return (
    <div className="space-y-4">
      <style>{PRINT_CSS}</style>
      <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-3 rounded-lg border border-input-border-color bg-bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-sm text-title cursor-pointer">
            <Switch checked={showCosts} onCheckedChange={setShowCosts} aria-label="Show my costs and profit" />
            Show my costs & profit
          </label>
          <label className="flex items-center gap-2 text-sm text-title cursor-pointer">
            <Switch checked={inputs.pricing.interstate} onCheckedChange={(interstate) => onInputs({ ...inputs, pricing: { ...inputs.pricing, interstate } })} aria-label="Client in another state (IGST)" />
            Client in another state (IGST)
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={copy} className="gap-1.5"><Copy className="w-4 h-4" /> Copy as text</Button>
          <Button type="button" onClick={print} className="text-white gap-1.5"><Printer className="w-4 h-4" /> Print / Save PDF</Button>
        </div>
      </div>
      {showCosts && (
        <p className="mx-auto max-w-4xl text-xs text-amber-600">Turn off &quot;Show my costs &amp; profit&quot; before printing or sharing this with the client. Copy as text never includes your costs.</p>
      )}

      <Sheet client={client} inputs={inputs} est={est} meta={meta} showCosts={showCosts} />

      {printing && createPortal(
        <div id="pe-print-root">
          <Sheet client={client} inputs={inputs} est={est} meta={meta} showCosts={showCosts} />
        </div>,
        document.body,
      )}
    </div>
  )
}

export default PriceSheet

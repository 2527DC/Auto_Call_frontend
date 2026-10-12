'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { EstimateInputs, QuoteOffer } from '@/types/priceEstimator'
import { Check, Handshake, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Estimate, marginAt, profitAt, Verdict, verdictFor } from '../estimate'
import { NumberField, pct, rupees, Section, Segmented } from '../fields'

export const VERDICT_STYLES: Record<Verdict, { label: string; pill: string; text: string }> = {
  loss: { label: 'Loss', pill: 'bg-destructive/10 text-destructive', text: 'text-destructive' },
  thin: { label: 'Below walk-away', pill: 'bg-amber-500/10 text-amber-600', text: 'text-amber-600' },
  healthy: { label: 'Profitable', pill: 'bg-sky-500/10 text-sky-600', text: 'text-sky-600' },
  excellent: { label: 'On target', pill: 'bg-emerald-500/10 text-emerald-600', text: 'text-emerald-600' },
}

// Where each price sits: red below break-even, amber below your walk-away price, green above.
const PriceLadder = ({ est, offers }: { est: Estimate; offers: QuoteOffer[] }) => {
  const finite = (v: number) => (Number.isFinite(v) ? v : 0)
  const max = Math.max(est.listPrice, finite(est.targetPrice), est.dealPrice, ...offers.map((o) => o.amount), 1) * 1.12
  const at = (v: number) => `${Math.min(100, Math.max(0, (finite(v) / max) * 100))}%`
  const markers = [
    { v: est.breakEvenPrice, label: 'Break-even', cls: 'bg-destructive' },
    { v: est.floorPrice, label: 'Walk-away', cls: 'bg-amber-500' },
    { v: est.targetPrice, label: 'Target', cls: 'bg-emerald-600' },
    { v: est.listPrice, label: 'Your ask', cls: 'bg-title' },
  ].filter((m) => Number.isFinite(m.v) && m.v > 0)

  return (
    <div className="pt-7 pb-9 px-1" aria-hidden>
      <div className="relative h-3 rounded-full overflow-visible">
        <div className="absolute inset-y-0 left-0 rounded-l-full bg-destructive/25" style={{ width: at(est.breakEvenPrice) }} />
        <div className="absolute inset-y-0 bg-amber-500/25" style={{ left: at(est.breakEvenPrice), width: `calc(${at(est.floorPrice)} - ${at(est.breakEvenPrice)})` }} />
        <div className="absolute inset-y-0 right-0 rounded-r-full bg-emerald-500/25" style={{ left: at(est.floorPrice) }} />
        {markers.map((m, i) => (
          <div key={m.label} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: at(m.v) }}>
            <span className={cn('h-5 w-0.5 rounded', m.cls)} />
            <span className={cn('absolute whitespace-nowrap text-[10px] font-semibold text-subtitle-color', i % 2 ? 'top-6' : 'bottom-6')}>
              {m.label} <span className="tabular-nums text-title">{rupees(m.v)}</span>
            </span>
          </div>
        ))}
        {offers.filter((o) => o.party === 'client').map((o, i) => (
          <span key={i} title={`Client offer ${rupees(o.amount)}`} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-card bg-sky-500" style={{ left: at(o.amount) }} />
        ))}
        {est.dealPrice > 0 && (
          <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-[3px] border-bg-card bg-primary shadow" style={{ left: at(est.dealPrice) }} />
        )}
      </div>
    </div>
  )
}

const BargainingSection = ({ inputs, est, offers, onInputs, onOffers }: {
  inputs: EstimateInputs
  est: Estimate
  offers: QuoteOffer[]
  onInputs: (next: EstimateInputs) => void
  onOffers: (next: QuoteOffer[]) => void
}) => {
  const [party, setParty] = useState<QuoteOffer['party']>('client')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const setPricing = (patch: Partial<EstimateInputs['pricing']>) => onInputs({ ...inputs, pricing: { ...inputs.pricing, ...patch } })
  const accept = (price: number | null) => setPricing({ agreed_price: price })

  const addOffer = (p: QuoteOffer['party'], value: number, text = '') => {
    if (!(value >= 0)) return
    onOffers([...offers, { party: p, amount: Math.round(value), note: text, at: new Date().toISOString() }])
  }
  const submit = () => {
    if (amount === '') return
    addOffer(party, Number(amount), note.trim())
    setAmount('')
    setNote('')
  }

  // Meet the client halfway between their latest offer and your latest ask, never below walk-away.
  const lastClient = [...offers].reverse().find((o) => o.party === 'client')
  const lastYou = [...offers].reverse().find((o) => o.party === 'you')
  const yourAsk = lastYou?.amount ?? est.discountedPrice
  const counter = lastClient && lastClient.amount < yourAsk && Number.isFinite(est.floorPrice)
    ? Math.round(Math.max(est.floorPrice, (lastClient.amount + yourAsk) / 2) / 10) * 10
    : null
  const clientOfferOk = lastClient && lastClient.amount >= est.floorPrice

  return (
    <Section step={5} icon={Handshake} title="Bargaining" description="Log every offer. Each shows the profit you'd make at that price, so you know when to hold and when to walk away.">
      <div className="space-y-6">
        <PriceLadder est={est} offers={offers} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Break-even', value: est.breakEvenPrice, hint: 'Below this you lose money', tone: 'text-destructive' },
            { label: 'Walk-away price', value: est.floorPrice, hint: `${inputs.pricing.min_margin_percent}% margin: your lowest acceptable`, tone: 'text-amber-600' },
            { label: 'Target price', value: est.targetPrice, hint: `${inputs.pricing.target_margin_percent}% margin`, tone: 'text-emerald-600' },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-input-border-color px-3 py-2.5">
              <p className="text-xs text-subtitle-color">{c.label} / month</p>
              <p className={cn('text-lg font-bold tabular-nums', c.tone)}>{Number.isFinite(c.value) ? rupees(c.value) : 'Not reachable'}</p>
              <p className="text-[11px] text-subtitle-color">{c.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField
            label="Discount on your list price"
            suffix="%"
            value={inputs.pricing.discount_percent}
            onChange={(discount_percent) => setPricing({ discount_percent: Math.min(100, discount_percent) })}
            hint={<>List {rupees(est.listPrice)} → {rupees(est.discountedPrice)}. You can give up to <b>{est.maxDiscountPercent.toFixed(0)}%</b> before walk-away.</>}
          />
          <div className="space-y-1.5">
            <Label htmlFor="agreed-price" className="text-xs font-semibold text-subtitle-color">Agreed monthly price (excl. GST)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-subtitle-color">₹</span>
              <Input
                id="agreed-price"
                type="number"
                min={0}
                value={inputs.pricing.agreed_price ?? ''}
                placeholder={String(Math.round(est.discountedPrice))}
                onChange={(e) => accept(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                className="h-10 pl-7 pr-9 bg-input-color border-input-border-color text-sm tabular-nums"
              />
              {inputs.pricing.agreed_price != null && (
                <button type="button" onClick={() => accept(null)} aria-label="Clear agreed price" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtitle-color hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-subtitle-color">Empty uses the list price after discount. Accepting an offer fills this in.</p>
          </div>
        </div>

        <div className="rounded-lg border border-input-border-color">
          <div className="grid grid-cols-1 md:grid-cols-[auto_150px_1fr_auto] gap-3 p-3 items-end border-b border-input-border-color">
            <Segmented label="Who offered" value={party} onChange={setParty} options={[{ value: 'client', label: 'Client' }, { value: 'you', label: 'You' }]} />
            <div className="space-y-1.5">
              <Label htmlFor="offer-amount" className="text-xs font-semibold text-subtitle-color">₹ / month</Label>
              <Input id="offer-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} className="h-10 bg-input-color border-input-border-color text-sm tabular-nums" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-note" className="text-xs font-semibold text-subtitle-color">Note</Label>
              <Input id="offer-note" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="e.g. Competitor quoted lower" className="h-10 bg-input-color border-input-border-color text-sm" />
            </div>
            <Button type="button" onClick={submit} disabled={amount === ''} className="text-white gap-1.5 h-10">
              <Plus className="w-4 h-4" /> Log offer
            </Button>
          </div>

          {lastClient && (
            <div className={cn('flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm border-b border-input-border-color', clientOfferOk ? 'bg-emerald-500/5' : 'bg-amber-500/5')}>
              <span className="text-subtitle-color">
                {clientOfferOk
                  ? <>Their latest offer of <b className="text-title">{rupees(lastClient.amount)}</b> is above your walk-away price. You can accept.</>
                  : <>Their latest offer of <b className="text-title">{rupees(lastClient.amount)}</b> is below your walk-away price of <b className="text-title">{rupees(est.floorPrice)}</b>.</>}
              </span>
              {counter !== null && !clientOfferOk && (
                <Button className="gap-1.5" type="button" size="sm" variant="outline" onClick={() => addOffer('you', counter, 'Counter-offer')}>
                  Counter with {rupees(counter)} ({pct(marginAt(counter, est.monthlyCost, inputs))} margin)
                </Button>
              )}
            </div>
          )}

          {offers.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-subtitle-color">No offers yet. Log your first quote and the client&apos;s replies here.</p>
          ) : (
            <ul className="divide-y divide-input-border-color">
              {offers.map((o, i) => {
                const margin = marginAt(o.amount, est.monthlyCost, inputs)
                const v = VERDICT_STYLES[verdictFor(margin, inputs)]
                const isAgreed = inputs.pricing.agreed_price === o.amount
                return (
                  <li key={i} className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[70px_1fr_120px_auto_auto] gap-x-3 gap-y-1 items-center px-3 py-2.5 text-sm">
                    <span className={cn('text-[11px] font-bold uppercase tracking-wide', o.party === 'client' ? 'text-sky-600' : 'text-primary')}>{o.party === 'client' ? 'Client' : 'You'}</span>
                    <span className="min-w-0">
                      <b className="tabular-nums text-title">{rupees(o.amount)}</b>
                      <span className="text-xs text-subtitle-color"> / month{o.note && ` · ${o.note}`}</span>
                      <span className="block text-[11px] text-subtitle-color">{new Date(o.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </span>
                    <span className="hidden sm:block text-xs tabular-nums">Profit <b className={profitAt(o.amount, est.monthlyCost, inputs) < 0 ? 'text-destructive' : 'text-emerald-600'}>{rupees(profitAt(o.amount, est.monthlyCost, inputs))}</b></span>
                    <span className={cn('hidden sm:inline-flex justify-self-start whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', v.pill)}>{pct(margin)} · {v.label}</span>
                    <span className="flex items-center gap-1 justify-self-end">
                      <Button type="button" size="sm" variant={isAgreed ? 'default' : 'outline'} onClick={() => accept(isAgreed ? null : o.amount)} className={cn('h-8 px-2.5 text-xs', isAgreed && 'text-white')}>
                        <Check className="w-3.5 h-3.5" /> {isAgreed ? 'Agreed' : 'Accept'}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => onOffers(offers.filter((_, j) => j !== i))} aria-label="Remove offer" className="h-8 w-8 p-0 text-subtitle-color hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Section>
  )
}

export default BargainingSection

'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuoteClient, QuoteStatus } from '@/types/priceEstimator'
import { Building2 } from 'lucide-react'
import { Section, TextField } from '../fields'

export const STATUS_OPTIONS: { value: QuoteStatus; label: string; tone: string }[] = [
  { value: 'draft', label: 'Draft', tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
  { value: 'sent', label: 'Quote sent', tone: 'bg-sky-500/10 text-sky-600' },
  { value: 'negotiating', label: 'Negotiating', tone: 'bg-amber-500/10 text-amber-600' },
  { value: 'won', label: 'Won', tone: 'bg-emerald-500/10 text-emerald-600' },
  { value: 'lost', label: 'Lost', tone: 'bg-destructive/10 text-destructive' },
]

const ClientSection = ({ client, status, onClient, onStatus }: {
  client: QuoteClient
  status: QuoteStatus
  onClient: (c: QuoteClient) => void
  onStatus: (s: QuoteStatus) => void
}) => {
  const set = (key: keyof QuoteClient) => (v: string) => onClient({ ...client, [key]: v })

  return (
    <Section step={1} icon={Building2} title="Client" description="Who you're quoting, and where the deal stands.">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <TextField label="Contact name *" value={client.name} onChange={set('name')} placeholder="e.g. Ramesh Kumar" />
        <TextField label="Company" value={client.company} onChange={set('company')} placeholder="e.g. Sri Sai Motors" />
        <TextField label="Phone" type="tel" value={client.phone} onChange={set('phone')} placeholder="+91 98xxxxxxx" />
        <TextField label="Email" type="email" value={client.email} onChange={set('email')} placeholder="name@company.in" />
        <TextField label="Industry" value={client.industry} onChange={set('industry')} placeholder="e.g. Real estate, clinic, NBFC" />
        <TextField label="City" value={client.city} onChange={set('city')} placeholder="e.g. Bengaluru" />
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-subtitle-color">Deal status</Label>
          <Select value={status} onValueChange={(v) => onStatus(v as QuoteStatus)}>
            <SelectTrigger className="h-10 w-full shadow-none bg-input-color border-input-border-color text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-input-border-color">
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Section>
  )
}

export default ClientSection

'use client'

import { DeleteConfirmationModal } from '@/components/reusable/DeleteConfirmationModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import {
  useCreatePriceQuoteMutation,
  useDeletePriceQuoteMutation,
  useGetEstimatorRatesQuery,
  useGetPriceQuotesQuery,
  useLazyGetPriceQuoteQuery,
  useUpdatePriceQuoteMutation,
} from '@/redux/api/priceEstimatorApi'
import { ApiError } from '@/types/api'
import { EstimateInputs, PriceQuoteListItem, PriceQuotePayload, QuoteClient, QuoteOffer, QuoteStatus, RequirementAnswer } from '@/types/priceEstimator'
import { Copy, CopyPlus, FilePlus2, Loader2, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ADDONS, defaultInputs, defaultRequirements, estimate, Estimate, toSummary, withDefaults } from './estimate'
import { money } from './fields'
import SavedQuotes from './SavedQuotes'
import BargainingSection from './sections/BargainingSection'
import ClientSection from './sections/ClientSection'
import CostsSection from './sections/CostsSection'
import ModulesSection from './sections/ModulesSection'
import RequirementsSection from './sections/RequirementsSection'
import SummaryPanel from './SummaryPanel'

const EMPTY_CLIENT: QuoteClient = { name: '', company: '', phone: '', email: '', industry: '', city: '' }

// The quote as the client should see it: what they get and what they pay, no costs.
const clientQuoteText = (client: QuoteClient, inputs: EstimateInputs, est: Estimate) => {
  const lines = [`Voxeno AI calling: quote for ${client.company || client.name}`, '']
  if (inputs.voice.enabled) lines.push(`• AI voice calls: ~${Math.round(est.minutes).toLocaleString('en-IN')} minutes a month`)
  if (inputs.numbers.enabled) lines.push(`• ${inputs.numbers.count} dedicated +91 number${inputs.numbers.count === 1 ? '' : 's'}`)
  if (inputs.sms.enabled) lines.push(`• ${inputs.sms.messages_per_month.toLocaleString('en-IN')} SMS a month`)
  if (inputs.whatsapp.enabled) lines.push(`• ${inputs.whatsapp.messages_per_month.toLocaleString('en-IN')} WhatsApp messages a month`)
  const modules = ADDONS.filter((a) => inputs.addons[a.key]?.enabled).map((a) => a.label)
  if (modules.length) lines.push(`• Includes: ${modules.join(', ')}`)
  lines.push('', `Monthly: ${money(est.dealPrice)} + ${inputs.pricing.gst_percent}% GST = ${money(est.invoice.monthly)}`)
  if (est.setup.fee > 0) lines.push(`One-time set-up: ${money(est.setup.fee)} + GST = ${money(est.invoice.setup)}`)
  if (est.pricePerMinute !== null) lines.push(`Works out to ${money(est.pricePerMinute)} per minute, all-in.`)
  return lines.join('\n')
}

const PriceEstimatorPage = () => {
  const { hasPermission, role } = usePermission()
  const canManage = role === 'super_admin' || hasPermission(PERMISSIONS.MANAGE_PRICE_ESTIMATOR)

  const { data, isLoading, isError } = useGetEstimatorRatesQuery(undefined, { refetchOnMountOrArgChange: true })
  const { data: quoteList } = useGetPriceQuotesQuery({})
  const [loadQuote, { isFetching: isOpening }] = useLazyGetPriceQuoteQuery()
  const [createQuote, { isLoading: isCreating }] = useCreatePriceQuoteMutation()
  const [updateQuote, { isLoading: isUpdating }] = useUpdatePriceQuoteMutation()
  const [deleteQuote, { isLoading: isDeleting }] = useDeletePriceQuoteMutation()

  const [tab, setTab] = useState<'estimate' | 'quotes'>('estimate')
  const [quoteId, setQuoteId] = useState<string | null>(null)
  const [client, setClient] = useState<QuoteClient>(EMPTY_CLIENT)
  const [status, setStatus] = useState<QuoteStatus>('draft')
  const [requirements, setRequirements] = useState<RequirementAnswer[]>(defaultRequirements)
  const [offers, setOffers] = useState<QuoteOffer[]>([])
  const [notes, setNotes] = useState('')
  const [editedInputs, setInputs] = useState<EstimateInputs | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PriceQuoteListItem | null>(null)

  const inputs = editedInputs ?? (data ? defaultInputs(data.rates) : null)
  const est = useMemo(() => (inputs && data ? estimate(inputs, data) : null), [inputs, data])

  const payload = (): PriceQuotePayload | null =>
    inputs && est ? { client, status, inputs, requirements, offers, notes, summary: toSummary(est) } : null
  const current = payload()
  const isDirty = current !== null && savedSnapshot !== null && JSON.stringify(current) !== savedSnapshot

  const reset = () => {
    setQuoteId(null)
    setClient(EMPTY_CLIENT)
    setStatus('draft')
    setRequirements(defaultRequirements())
    setOffers([])
    setNotes('')
    setInputs(null)
    setSavedSnapshot(null)
  }

  const startNew = () => {
    if ((isDirty || (!quoteId && editedInputs)) && !window.confirm('Discard the changes to this estimate?')) return
    reset()
    setTab('estimate')
  }

  const open = async (id: string) => {
    if (!data) return
    try {
      const { data: q } = await loadQuote(id).unwrap()
      const loaded: PriceQuotePayload = {
        client: { ...EMPTY_CLIENT, ...q.client },
        status: q.status,
        inputs: withDefaults(q.inputs, data.rates),
        requirements: q.requirements?.length ? q.requirements : defaultRequirements(),
        offers: q.offers || [],
        notes: q.notes || '',
        summary: q.summary,
      }
      setQuoteId(q.id)
      setClient(loaded.client)
      setStatus(loaded.status)
      setInputs(loaded.inputs)
      setRequirements(loaded.requirements)
      setOffers(loaded.offers)
      setNotes(loaded.notes)
      setSavedSnapshot(JSON.stringify({ ...loaded, summary: toSummary(estimate(loaded.inputs, data)) }))
      setTab('estimate')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error((err as ApiError)?.data?.message || 'Could not open the quote')
    }
  }

  const save = async (asNew = false) => {
    const body = payload()
    if (!body) return
    if (!body.client.name.trim()) {
      toast.error('Enter the client\'s name before saving')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    try {
      const res = quoteId && !asNew
        ? await updateQuote({ id: quoteId, body }).unwrap()
        : await createQuote(body).unwrap()
      setQuoteId(res.data.id)
      setSavedSnapshot(JSON.stringify(body))
      toast.success(res.message || 'Quote saved')
    } catch (err) {
      toast.error((err as ApiError)?.data?.message || 'Could not save the quote')
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteQuote(toDelete.id).unwrap()
      if (toDelete.id === quoteId) reset()
      toast.success('Quote deleted')
    } catch (err) {
      toast.error((err as ApiError)?.data?.message || 'Could not delete the quote')
    } finally {
      setToDelete(null)
    }
  }

  const copyForClient = async () => {
    if (!inputs || !est) return
    try {
      await navigator.clipboard.writeText(clientQuoteText(client, inputs, est))
      toast.success('Client quote copied. Paste it into WhatsApp or email.')
    } catch {
      toast.error('Could not copy to the clipboard')
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center gap-2 p-16 text-subtitle-color"><Loader2 className="w-5 h-5 animate-spin" /> Loading your provider rates…</div>
  }
  if (isError || !data || !inputs || !est) {
    return <div className="p-8 text-center text-subtitle-color">Couldn&apos;t load the estimator. You may not have permission to use it.</div>
  }

  const saving = isCreating || isUpdating

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-title">Price Estimator</h1>
          <p className="text-md text-subtitle-color mt-1">
            Capture what the client needs, price each service against your real costs, and see your profit at every offer while you bargain.
          </p>
        </div>
        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 xl:shrink-0">
          {tab === 'estimate' && (
            <span className="text-xs text-subtitle-color mr-1 whitespace-nowrap">
              {quoteId ? <>Editing <b className="text-title">{client.name || 'quote'}</b></> : 'New estimate'}
              {isDirty && <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-600">Unsaved changes</span>}
            </span>
          )}
          <Button className="gap-1.5" type="button" variant="outline" onClick={startNew}><FilePlus2 className="w-4 h-4" /> New</Button>
          <Button className="gap-1.5" type="button" variant="outline" onClick={copyForClient}><Copy className="w-4 h-4" /> Copy client quote</Button>
          {canManage && quoteId && (
            <Button className="gap-1.5" type="button" variant="outline" onClick={() => save(true)} disabled={saving}><CopyPlus className="w-4 h-4" /> Save as new</Button>
          )}
          {canManage && (
            <Button className="gap-1.5" type="button" onClick={() => save()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {quoteId ? 'Save changes' : 'Save quote'}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'estimate' | 'quotes')}>
        <TabsList>
          <TabsTrigger value="estimate">Estimate</TabsTrigger>
          <TabsTrigger value="quotes">Saved quotes{quoteList?.data?.length ? ` (${quoteList.data.length})` : ''}</TabsTrigger>
        </TabsList>

        <TabsContent value="estimate" className="mt-6">
          {isOpening ? (
            <div className="flex items-center justify-center gap-2 p-16 text-subtitle-color"><Loader2 className="w-5 h-5 animate-spin" /> Opening quote…</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
              <div className="space-y-6 min-w-0">
                <ClientSection client={client} status={status} onClient={setClient} onStatus={setStatus} />
                <RequirementsSection requirements={requirements} notes={notes} onChange={setRequirements} onNotes={setNotes} />
                <ModulesSection inputs={inputs} data={data} est={est} onChange={setInputs} />
                <CostsSection inputs={inputs} data={data} est={est} onChange={setInputs} />
                <BargainingSection inputs={inputs} est={est} offers={offers} onInputs={setInputs} onOffers={setOffers} />
              </div>
              <aside className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1">
                <SummaryPanel inputs={inputs} data={data} est={est} />
              </aside>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <SavedQuotes canManage={canManage} onOpen={open} onDelete={setToDelete} />
        </TabsContent>
      </Tabs>

      <DeleteConfirmationModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete this quote?"
        description={`The quote for ${toDelete?.client.name || 'this client'}, with its answers and offers, will be deleted.`}
      />
    </div>
  )
}

export default PriceEstimatorPage

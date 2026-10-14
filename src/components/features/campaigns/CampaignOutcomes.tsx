'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ROUTES } from '@/constants/routes'
import { useRecallCampaignMutation } from '@/redux/api/outcomeApi'
import { CampaignOutcomeCount } from '@/types/outcomes'
import { Loader2, PhoneForwarded } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const BAR: Record<string, string> = { good: 'bg-emerald-500', bad: 'bg-rose-500', neutral: 'bg-amber-500', unreached: 'bg-slate-400' }
const tone = (o: CampaignOutcomeCount) => (o.reached === false ? 'unreached' : o.result || 'neutral')
// Worth calling again by default: not reached, asked for a callback, or interested.
const RECALL_DEFAULT = (o: CampaignOutcomeCount) => o.reached === false || ['call_back', 'interested', 'needs_info', 'call_dropped'].includes(o.key)

// How the campaign's calls ended up, and a new draft campaign for the people worth calling again.
export default function CampaignOutcomes({ campaignId, outcomes }: { campaignId: string; outcomes: CampaignOutcomeCount[] }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<string[]>([])
  const [recall, { isLoading }] = useRecallCampaignMutation()
  const total = outcomes.reduce((s, o) => s + o.count, 0)
  if (!total) return null

  const people = outcomes.filter((o) => chosen.includes(o.key)).reduce((s, o) => s + o.count, 0)
  const start = () => { setChosen(outcomes.filter(RECALL_DEFAULT).map((o) => o.key)); setOpen(true) }
  const submit = async () => {
    try {
      const res = await recall({ id: campaignId, outcome_keys: chosen }).unwrap()
      toast.success(res.message || t('draft_campaign_created', 'Draft campaign created'))
      setOpen(false)
      router.push(`${ROUTES.CAMPAIGNS}/${res.data.id}/edit`)
    } catch (e) {
      toast.error((e as { data?: { message?: string } })?.data?.message || t('recall_failed', 'Could not create the campaign'))
    }
  }

  return (
    <section className="rounded-radius border border-input-border-color bg-bg-card p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold text-title">{t('how_calls_ended', 'How the calls ended')}</h4>
          <p className="text-sm text-subtitle-color">{t('n_calls_analysed', '{{n}} calls analysed', { n: total })}</p>
        </div>
        <Button onClick={start} className="gap-2 bg-primary text-white"><PhoneForwarded className="h-4 w-4" />{t('call_these_again', 'Call these again')}</Button>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-primary/5">
        {outcomes.map((o) => <div key={o.key} className={BAR[tone(o)]} style={{ width: `${(o.count / total) * 100}%` }} title={`${o.label}: ${o.count}`} />)}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {outcomes.map((o) => (
          <li key={o.key} className="flex items-center gap-1.5 text-sm text-title">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${BAR[tone(o)]}`} />
            {o.label} <b>{o.count}</b>
            <span className="text-xs text-subtitle-color">({Math.round((o.count / total) * 100)}%)</span>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]! max-w-[calc(100%-1.5rem)]! bg-bg-card border-none rounded-modal-radius">
          <DialogHeader className="text-left">
            <DialogTitle className="text-title">{t('call_these_again', 'Call these again')}</DialogTitle>
            <DialogDescription className="text-subtitle-color">{t('call_again_desc', 'Makes a new draft campaign with the same agent, number and schedule. People who asked not to be called are left out.')}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2.5 max-h-[50vh] overflow-y-auto">
            {outcomes.map((o) => (
              <li key={o.key}>
                <label className="flex items-center gap-2.5 text-sm text-title cursor-pointer">
                  <Checkbox checked={chosen.includes(o.key)} onCheckedChange={(v) => setChosen(v ? [...chosen, o.key] : chosen.filter((k) => k !== o.key))} />
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${BAR[tone(o)]}`} />
                  <span className="flex-1">{o.label}</span>
                  <span className="text-subtitle-color">{o.count}</span>
                </label>
              </li>
            ))}
          </ul>
          <DialogFooter className="gap-2 sm:space-x-0 items-center">
            <span className="text-sm text-subtitle-color mr-auto">{t('n_people', '{{n}} people', { n: people })}</span>
            <Button variant="outline" className="border-input-border-color" onClick={() => setOpen(false)}>{t('cancel', 'Cancel')}</Button>
            <Button className="bg-primary text-white" disabled={!chosen.length || isLoading} onClick={submit}>{isLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t('create_draft', 'Create draft campaign')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

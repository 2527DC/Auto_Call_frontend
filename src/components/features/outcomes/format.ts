import { TFunction } from 'i18next'

// Shared wording for outcomes, leads and follow-ups.

const IST = 'Asia/Kolkata'

// "Today 6:00 PM", "Tomorrow 11:00 AM", "Wed, 15 Oct 10:00 AM" (India time).
export function formatWhen(value?: string | Date | null, t?: TFunction): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const day = (x: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(x)
  const time = new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true }).format(d)
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 86400000)
  const yesterday = new Date(today.getTime() - 86400000)
  if (day(d) === day(today)) return `${t ? t('today', 'Today') : 'Today'} ${time}`
  if (day(d) === day(tomorrow)) return `${t ? t('tomorrow', 'Tomorrow') : 'Tomorrow'} ${time}`
  if (day(d) === day(yesterday)) return `${t ? t('yesterday', 'Yesterday') : 'Yesterday'} ${time}`
  const date = new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'short', day: 'numeric', month: 'short' }).format(d)
  return `${date} ${time}`
}

// Value for <input type="datetime-local"> in India time, and back.
export function toLocalInput(value?: string | Date | null): string {
  const d = value ? new Date(value) : new Date()
  const ist = new Date(d.getTime() + 330 * 60000)
  return ist.toISOString().slice(0, 16)
}
export function fromLocalInput(value: string): string {
  return new Date(`${value}:00+05:30`).toISOString()
}

export function followUpReason(reason: string, t: TFunction): string {
  const map: Record<string, string> = {
    callback_requested: t('fu_reason_callback', 'Asked to be called back'),
    interested: t('fu_reason_interested', 'Interested'),
    needs_info: t('fu_reason_needs_info', 'Needs more information'),
    complaint: t('fu_reason_complaint', 'Complaint'),
    couldnt_understand: t('fu_reason_couldnt_understand', "Couldn't understand"),
    call_dropped: t('fu_reason_call_dropped', 'Call dropped'),
    retry_not_reached: t('fu_reason_retry', 'Campaign retry'),
    missed_inbound: t('fu_reason_missed_inbound', 'Missed incoming call'),
    unreachable: t('fu_reason_unreachable', 'Could not be reached'),
    manual: t('fu_reason_manual', 'Added by hand'),
  }
  return map[reason] || reason
}

export function outcomeSource(source: string | null | undefined, t: TFunction): string {
  const map: Record<string, string> = {
    rule: t('outcome_source_rule', 'Set by the call status'),
    workflow: t('outcome_source_workflow', 'Set by the workflow'),
    live: t('outcome_source_live', 'Said on the call'),
    ai: t('outcome_source_ai', 'AI'),
    person: t('outcome_source_person', 'Set by a person'),
  }
  return source ? map[source] || source : ''
}

export function leadSource(source: string | null | undefined, t: TFunction): string {
  const map: Record<string, string> = {
    inbound_call: t('lead_source_inbound', 'Called in'),
    whatsapp_call: t('lead_source_whatsapp_call', 'WhatsApp call'),
    whatsapp: t('lead_source_whatsapp', 'WhatsApp'),
    campaign: t('lead_source_campaign', 'Campaign'),
    outbound_call: t('lead_source_outbound', 'Outgoing call'),
    import: t('lead_source_import', 'Imported'),
    manual: t('lead_source_manual', 'Added by hand'),
  }
  return source ? map[source] || source : t('lead_source_contact', 'Contact')
}

export const SENTIMENT_EMOJI: Record<string, string> = { positive: '🙂', neutral: '😐', negative: '🙁' }

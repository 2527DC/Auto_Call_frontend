'use client'

import Spinner from '@/components/reusable/Spinner';
import { formatWhen } from '@/components/features/outcomes/format';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFileManagement } from '@/hooks/useFileManagement';
import { cn } from '@/lib/utils';
import { useGetFormQuery, useGetFormResponsesQuery } from '@/redux/api/formApi';
import { FormResponsesModalProps, FormSubmission } from '@/types/form';
import { Download, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Who answered and what they said: one row per response, one column per question.
export function FormResponsesModal({ isOpen, onClose, formId }: FormResponsesModalProps) {
  const { t } = useTranslation()
  const { data: response, isLoading } = useGetFormResponsesQuery(formId as string, { skip: !formId || !isOpen })
  const { data: formData } = useGetFormQuery(formId as string, { skip: !formId || !isOpen })
  const { downloadFile } = useFileManagement()
  const [exporting, setExporting] = useState(false)

  const responses = response?.data || []
  // Columns: the form's questions, plus any answer keys from older versions of the form.
  const fields = formData?.data?.fields || []
  const keys = [...fields.map((f) => f.key), ...new Set(responses.flatMap((r) => Object.keys(r.responses || {})))]
    .filter((k, i, all) => all.indexOf(k) === i)
  const labelOf = (key: string) => fields.find((f) => f.key === key)?.label || key.replace(/_/g, ' ')

  const contactOf = (r: FormSubmission) => (r.contact_id && typeof r.contact_id === 'object' ? r.contact_id : null)
  const nameOf = (r: FormSubmission) => {
    const c = contactOf(r)
    return [c?.first_name, c?.last_name].filter(Boolean).join(' ') || r.call_id?.lead_name || ''
  }
  const phoneOf = (r: FormSubmission) => r.phone || contactOf(r)?.phone_number || (r.call_id ? (r.call_id.direction === 'inbound' ? r.call_id.from_number : r.call_id.to_number) : '')
  const leadId = (r: FormSubmission) => { const c = contactOf(r); return c?.id || c?._id || (typeof r.contact_id === 'string' ? r.contact_id : null) }

  const exportCsv = async () => {
    if (!formId) return
    setExporting(true)
    await downloadFile(`/forms/${formId}/responses/export`, { format: 'csv' }, 'form-responses')
    setExporting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl! w-[calc(100%-1.5rem)]! max-h-[85vh] p-0 border-none rounded-modal-radius! bg-white dark:bg-bg-card flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-input-border-color shrink-0 flex-row items-center justify-between gap-3 space-y-0">
          <DialogTitle className="text-xl font-bold text-title dark:text-white">
            {t('form_responses', 'Form Responses')}{responses.length ? ` (${responses.length})` : ''}
          </DialogTitle>
          {responses.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting} className="gap-1.5 border-input-border-color mr-8">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{t('export', 'Export')}
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-subtitle-color">
              <Spinner />
              <p>{t('loading_responses', 'Loading responses...')}</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-title dark:text-white mb-2">{t('no_responses_title', 'No Responses Yet')}</h3>
              <p className="text-md text-subtitle-color max-w-sm">{t('no_responses_calls', 'Answers collected on calls will appear here.')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-input-border-color">
              <table className="w-full text-sm">
                <thead className="bg-primary/5 text-left text-xs font-semibold uppercase tracking-wide text-subtitle-color">
                  <tr>
                    <th className="px-3 py-2.5 whitespace-nowrap">{t('when', 'When')}</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">{t('person', 'Person')}</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">{t('status', 'Status')}</th>
                    {keys.map((k) => <th key={k} className="px-3 py-2.5 whitespace-nowrap">{labelOf(k)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-input-border-color">
                  {responses.map((r, i) => {
                    const id = leadId(r)
                    return (
                      <tr key={r.id || r._id || i} className="align-top">
                        <td className="px-3 py-2.5 whitespace-nowrap text-subtitle-color">{formatWhen(r.created_at, t)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {id ? <Link href={`/leads/${id}`} className="font-semibold text-title hover:text-primary hover:underline">{nameOf(r) || phoneOf(r)}</Link>
                            : <span className="font-semibold text-title">{nameOf(r) || phoneOf(r) || '—'}</span>}
                          {nameOf(r) && phoneOf(r) && <span className="block text-xs text-subtitle-color">{phoneOf(r)}</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400')}>
                            {r.status === 'completed' ? t('completed', 'Completed') : t('partial', 'Partial')}
                          </span>
                        </td>
                        {keys.map((k) => <td key={k} className="px-3 py-2.5 text-title">{r.responses?.[k] === undefined || r.responses?.[k] === null ? <span className="text-subtitle-color">—</span> : String(r.responses[k])}</td>)}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

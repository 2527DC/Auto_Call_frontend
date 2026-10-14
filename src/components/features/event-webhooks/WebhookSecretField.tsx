'use client'

import { Loader2 } from '@/components/reusable/Loader2'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useRotateWebhookSecretMutation } from '@/redux/api/eventWebhooksApi'
import { Copy, Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const btnClass = 'h-9 gap-1.5 rounded-lg text-sm font-semibold shadow-none bg-subcard border-input-border-color text-title'

export default function WebhookSecretField({ webhookId, secret: initialSecret }: { webhookId: string; secret?: string }) {
  const { t } = useTranslation()
  const [secret, setSecret] = useState(initialSecret || '')
  const [visible, setVisible] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [rotateSecret, { isLoading }] = useRotateWebhookSecretMutation()

  useEffect(() => setSecret(initialSecret || ''), [initialSecret, webhookId])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      toast.success(t('secret_copied', 'Secret copied'))
    } catch {
      toast.error(t('copy_failed', 'Could not copy'))
    }
  }

  const handleRotate = async () => {
    try {
      const res = await rotateSecret(webhookId).unwrap()
      setSecret(res?.data?.secret || '')
      setVisible(true)
      setConfirming(false)
      toast.success(res?.message || t('new_secret_created', 'New signing secret created'))
    } catch (error: any) {
      toast.error(error?.data?.message || t('failed_to_rotate_secret', 'Could not create a new secret'))
    }
  }

  const masked = secret ? `${secret.slice(0, 4)}${'•'.repeat(12)}` : ''

  return (
    <div className="p-4 rounded-lg bg-subcard border border-input-border-color space-y-3 min-w-0">
      <div className="flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-subtitle-color" />
        <Label className="text-md font-bold text-title">{t('signing_secret', 'Signing secret')}</Label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <code className="flex-1 min-w-0 truncate px-3 h-9 flex items-center rounded-lg border border-input-border-color bg-white dark:bg-zinc-900 text-sm font-mono text-title">
          {secret ? (visible ? secret : masked) : t('no_secret_yet', 'No secret yet. Save the webhook or create a new one.')}
        </code>
        {secret && (
          <>
            <Button type="button" variant="outline" className={btnClass} onClick={() => setVisible((v) => !v)}>
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {visible ? t('hide', 'Hide') : t('show', 'Show')}
            </Button>
            <Button type="button" variant="outline" className={btnClass} onClick={handleCopy}>
              <Copy className="w-4 h-4" />
              {t('copy', 'Copy')}
            </Button>
          </>
        )}
        {!confirming && (
          <Button type="button" variant="outline" className={btnClass} onClick={() => setConfirming(true)}>
            <RefreshCw className="w-4 h-4" />
            {t('new_secret', 'New secret')}
          </Button>
        )}
      </div>

      {confirming && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {t('rotate_secret_warning', 'The old secret stops working at once')}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className={btnClass} onClick={() => setConfirming(false)} disabled={isLoading}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button type="button" className="h-9 gap-1.5 rounded-lg text-sm font-semibold bg-primary text-white" onClick={handleRotate} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('create_new_secret', 'Create new secret')}
            </Button>
          </div>
        </div>
      )}

      <p className="text-sm text-subtitle-color break-words">
        {t(
          'webhook_signature_help',
          "We sign each request: check the X-Voxeno-Signature header (t=<time>,v1=<HMAC-SHA256 of '<t>.<body>' with this secret>).",
        )}
      </p>
    </div>
  )
}

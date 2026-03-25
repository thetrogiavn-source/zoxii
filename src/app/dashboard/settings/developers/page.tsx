'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'

export default function DevelopersSettingsPage() {
  const { t } = useI18n()
  const [apiKey, setApiKey] = useState('zx_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')
  const [showApiKey, setShowApiKey] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const WEBHOOK_EVENTS = [
    { id: 'transaction.created', label: t('event_transaction_created') },
    { id: 'transaction.completed', label: t('event_transaction_completed') },
    { id: 'withdrawal.created', label: t('event_withdrawal_created') },
    { id: 'withdrawal.completed', label: t('event_withdrawal_completed') },
    { id: 'withdrawal.failed', label: t('event_withdrawal_failed') },
    { id: 'va.created', label: t('event_va_created') },
  ]

  function maskApiKey(key: string) {
    if (key.length <= 12) return key
    return key.slice(0, 12) + '•'.repeat(key.length - 16) + key.slice(-4)
  }

  function handleGenerateKey() {
    if (!confirm(t('confirm_generate_key'))) return

    // Simulate generating a new key
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let newKey = 'zx_live_sk_'
    for (let i = 0; i < 32; i++) {
      newKey += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setApiKey(newKey)
    setShowApiKey(true)
    setSuccess(t('new_key_generated'))
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  function toggleEvent(eventId: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    )
  }

  function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    // Simulate saving
    setTimeout(() => {
      setSaving(false)
      setSuccess(t('webhook_saved'))
    }, 500)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}

      {/* API Key */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('api_key')}</h2>
            <Badge variant="secondary">Live</Badge>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {t('api_key_desc')}
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={showApiKey ? apiKey : maskApiKey(apiKey)}
                readOnly
                className="h-12 font-mono text-sm bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? t('hide') : t('show')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(apiKey)}
              >
                {t('copy')}
              </Button>
            </div>

            <Button variant="outline" className="bg-[#FF5942] hover:bg-[#e64d38] text-white" onClick={handleGenerateKey}>
              {t('generate_new_key')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">{t('webhook')}</h2>

          <p className="text-sm text-gray-500 mb-4">
            {t('webhook_desc')}
          </p>

          <form onSubmit={handleSaveWebhook} className="space-y-5">
            <div className="space-y-2">
              <Label>{t('webhook_url')}</Label>
              <Input
                className="h-12"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/api/webhook"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('webhook_events')}</Label>
              <p className="text-sm text-gray-500 mb-2">
                {t('webhook_events_desc')}
              </p>
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      className="h-4 w-4 rounded border-gray-300 accent-[#FF5942]"
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="h-12 bg-[#FF5942] hover:bg-[#e64d38]" disabled={saving || !webhookUrl}>
              {saving ? t('saving_config') : t('save_config')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

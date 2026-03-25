'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'

export default function SecuritySettingsPage() {
  const { t } = useI18n()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError(t('password_mismatch'))
      return
    }

    if (newPassword.length < 6) {
      setError(t('password_min_length'))
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setLoading(false)

    if (updateError) {
      setError(updateError.message || t('password_change_failed'))
    } else {
      setSuccess(t('password_change_success'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Change Password */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">{t('change_password')}</h2>

          {error && <div className="bg-[#FDE8EA] text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>}

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="space-y-2">
              <Label>{t('current_password')}</Label>
              <Input
                className="h-12"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('current_password_placeholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('new_password')}</Label>
              <Input
                className="h-12"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('new_password_placeholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('confirm_new_password')}</Label>
              <Input
                className="h-12"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirm_password_placeholder')}
                required
              />
            </div>
            <Button type="submit" className="h-12 bg-[#FF5942] hover:bg-[#e64d38]" disabled={loading}>
              {loading ? t('processing_withdraw') : t('change_password')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('two_factor_auth')}</h2>
            <Badge variant="secondary">{t('coming_soon')}</Badge>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {t('two_factor_desc')}
          </p>
          <Button variant="outline" disabled>
            {t('enable_2fa')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'

const PLACEHOLDER_REFERRALS = [
  { id: '1', name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', status: 'active', joinedAt: '2026-02-15', earnings: 150000 },
  { id: '2', name: 'Trần Thị B', email: 'tranthib@gmail.com', status: 'active', joinedAt: '2026-02-20', earnings: 85000 },
  { id: '3', name: 'Lê Văn C', email: 'levanc@gmail.com', status: 'pending', joinedAt: '2026-03-01', earnings: 0 },
  { id: '4', name: 'Phạm Thị D', email: 'phamthid@gmail.com', status: 'active', joinedAt: '2026-03-10', earnings: 45000 },
  { id: '5', name: 'Hoàng Văn E', email: 'hoangvane@gmail.com', status: 'pending', joinedAt: '2026-03-18', earnings: 0 },
]

export default function ReferralPage() {
  const { t } = useI18n()
  const [referralCode, setReferralCode] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    loadReferralCode()
  }, [])

  async function loadReferralCode() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Generate a referral code from user ID
    const code = 'ZOXI-' + user.id.slice(0, 8).toUpperCase()
    setReferralCode(code)
  }

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${referralCode}`
    : ''

  function copyToClipboard(text: string, type: 'code' | 'link') {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  const totalReferrals = PLACEHOLDER_REFERRALS.length
  const activeReferrals = PLACEHOLDER_REFERRALS.filter((r) => r.status === 'active').length
  const totalEarnings = PLACEHOLDER_REFERRALS.reduce((sum, r) => sum + r.earnings, 0)

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">{t('referral_title')}</h1>

      {/* Referral Code & Link */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">{t('your_referral_code')}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {t('referral_desc')}
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('referral_code')}</label>
              <div className="flex gap-2">
                <Input
                  value={referralCode}
                  readOnly
                  className="h-12 font-mono text-lg font-bold bg-gray-50 max-w-full sm:max-w-xs"
                />
                <Button
                  variant="outline"
                  className="h-12 shrink-0"
                  onClick={() => copyToClipboard(referralCode, 'code')}
                >
                  {copied === 'code' ? t('copied') : t('copy')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('referral_link')}</label>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="h-12 text-sm bg-gray-50 min-w-0"
                />
                <Button
                  variant="outline"
                  className="h-12 shrink-0"
                  onClick={() => copyToClipboard(referralLink, 'link')}
                >
                  {copied === 'link' ? t('copied') : t('copy')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t('total_referrals')}</p>
            <p className="text-2xl font-bold">{totalReferrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t('active_referrals')}</p>
            <p className="text-2xl font-bold text-green-600">{activeReferrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t('total_commission')}</p>
            <p className="text-2xl font-bold text-[#FF5942]">{formatVND(totalEarnings)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Referred Users Table */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">{t('referred_users_list')}</h2>

          <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('join_date')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('commission')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLACEHOLDER_REFERRALS.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="font-medium">{referral.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{referral.email}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(referral.joinedAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={referral.status === 'active' ? 'default' : 'secondary'}
                    >
                      {referral.status === 'active' ? t('status_active') : t('status_pending_activation')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatVND(referral.earnings)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

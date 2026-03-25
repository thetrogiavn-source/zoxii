'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Crown, Building2, Clock, AlertTriangle, History, ArrowUp, ArrowDown, Zap, CreditCard, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface ProfileData {
  tier: string
  subscription_status: string
  subscription_start: string | null
  subscription_end: string | null
  subscription_amount_due: number
  trial_used: boolean
}

export default function PricingPage() {
  const { lang } = useI18n()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')
  const [history, setHistory] = useState<SubscriptionHistory[]>([])

  interface SubscriptionHistory {
    id: string
    action: string
    billing: string | null
    amount: number
    amount_due_before: number
    amount_due_after: number
    tier_before: string | null
    tier_after: string | null
    note: string | null
    created_at: string
  }

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription')
      const json = await res.json()
      if (json.data) setHistory(json.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadProfile()
    loadHistory()
  }, [loadHistory])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) setProfile({
      tier: data.tier || 'FREE',
      subscription_status: data.subscription_status || 'none',
      subscription_start: data.subscription_start || null,
      subscription_end: data.subscription_end || null,
      subscription_amount_due: data.subscription_amount_due ?? 0,
      trial_used: data.trial_used ?? false,
    })
  }

  async function handleAction(action: string) {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, billing }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || (lang === 'en' ? 'Something went wrong' : 'Có lỗi xảy ra'))
      } else {
        setSuccess(json.message)
        await loadProfile()
        await loadHistory()
      }
    } catch {
      setError(lang === 'en' ? 'Connection error' : 'Lỗi kết nối')
    }
    setLoading(false)
  }

  const currentTier = profile?.tier || 'FREE'
  const subStatus = profile?.subscription_status || 'none'
  const trialUsed = profile?.trial_used || false
  const amountDue = profile?.subscription_amount_due || 0
  const subEnd = profile?.subscription_end

  // Trial countdown
  let trialDaysLeft = 0
  if (subStatus === 'trial' && subEnd) {
    const diff = new Date(subEnd).getTime() - Date.now()
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  const proPrice = billing === 'annual' ? 49 : 75
  const proSave = billing === 'annual'
    ? (lang === 'en' ? 'Save 35% vs monthly' : 'Tiết kiệm 35% so với tháng')
    : null

  const features = {
    FREE: [
      { text: lang === 'en' ? '10 Virtual Accounts' : '10 Virtual Accounts', included: true },
      { text: lang === 'en' ? '2.5% transaction fee' : 'Phí giao dịch 2.5%', included: true },
      { text: lang === 'en' ? 'Free withdrawals' : 'Rút tiền miễn phí', included: true },
      { text: lang === 'en' ? 'Dashboard & reports' : 'Dashboard & báo cáo', included: true },
      { text: lang === 'en' ? 'Vietnamese support' : 'Hỗ trợ tiếng Việt', included: true },
      { text: lang === 'en' ? 'Etsy auto-sync' : 'Đồng bộ Etsy tự động', included: false },
      { text: lang === 'en' ? 'Invoice export' : 'Xuất hóa đơn / Invoice', included: false },
      { text: lang === 'en' ? 'Priority support' : 'Hỗ trợ ưu tiên', included: false },
    ],
    PRO: [
      { text: lang === 'en' ? '100 Virtual Accounts' : '100 Virtual Accounts', included: true },
      { text: lang === 'en' ? '1.5% transaction fee' : 'Phí giao dịch 1.5%', included: true },
      { text: lang === 'en' ? 'Free withdrawals' : 'Rút tiền miễn phí', included: true },
      { text: lang === 'en' ? 'Dashboard & reports' : 'Dashboard & báo cáo', included: true },
      { text: lang === 'en' ? 'Vietnamese support' : 'Hỗ trợ tiếng Việt', included: true },
      { text: lang === 'en' ? 'Etsy auto-sync' : 'Đồng bộ Etsy tự động', included: true },
      { text: lang === 'en' ? 'Invoice export' : 'Xuất hóa đơn / Invoice', included: true },
      { text: lang === 'en' ? 'Priority support' : 'Hỗ trợ ưu tiên', included: true },
    ],
    ENTERPRISE: [
      { text: lang === 'en' ? 'Unlimited VAs' : 'Unlimited VAs', included: true },
      { text: lang === 'en' ? 'Custom fee from 1.0%' : 'Phí tùy chỉnh từ 1.0%', included: true },
      { text: lang === 'en' ? 'Free withdrawals' : 'Rút tiền miễn phí', included: true },
      { text: lang === 'en' ? 'Dashboard & reports' : 'Dashboard & báo cáo', included: true },
      { text: lang === 'en' ? 'Dedicated Account Manager' : 'Dedicated Account Manager', included: true },
      { text: lang === 'en' ? 'Etsy auto-sync' : 'Đồng bộ Etsy tự động', included: true },
      { text: lang === 'en' ? 'Invoice export' : 'Xuất hóa đơn / Invoice', included: true },
      { text: lang === 'en' ? 'SLA & 24/7 support' : 'SLA & hỗ trợ 24/7', included: true },
    ],
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {lang === 'en' ? 'Choose your plan' : 'Chọn gói phù hợp'}
        </h1>
        <p className="text-gray-500 mb-6">
          {lang === 'en'
            ? 'Start free, upgrade when you need more power.'
            : 'Bắt đầu miễn phí, nâng cấp khi cần thêm tính năng.'}
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              billing === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {lang === 'en' ? 'Monthly' : 'Hàng tháng'}
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              billing === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {lang === 'en' ? 'Annual' : 'Hàng năm'}
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              -35%
            </span>
          </button>
        </div>
      </div>

      {/* Status banners */}
      {success && (
        <div className="mb-6 bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <Check className="size-4" /> {success}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="size-4" /> {error}
        </div>
      )}

      {/* Trial countdown */}
      {subStatus === 'trial' && trialDaysLeft > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="size-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {lang === 'en'
                ? `Pro trial: ${trialDaysLeft} days remaining`
                : `Dùng thử Pro: còn ${trialDaysLeft} ngày`}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              {lang === 'en'
                ? 'Upgrade to keep Pro features after trial ends.'
                : 'Nâng cấp để giữ tính năng Pro sau khi hết dùng thử.'}
            </p>
          </div>
        </div>
      )}

      {/* Subscription amount due */}
      {amountDue > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="size-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {lang === 'en'
                ? `Subscription fee pending: ${formatVND(amountDue)}`
                : `Phí subscription chưa thu: ${formatVND(amountDue)}`}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {lang === 'en'
                ? 'This will be automatically deducted from your next top-up (max 50% per transaction).'
                : 'Sẽ tự động trừ từ giao dịch nạp tiền tiếp theo (tối đa 50% mỗi giao dịch).'}
            </p>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* FREE */}
        <Card className={`border-2 transition-colors flex flex-col ${currentTier === 'FREE' ? 'border-gray-400 ring-2 ring-gray-100' : 'border-gray-200 hover:border-gray-300'}`}>
          <CardContent className="pt-6 px-5 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gray-100">
                <Sparkles className="size-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Free</h3>
                {currentTier === 'FREE' && (
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                    {lang === 'en' ? 'CURRENT' : 'HIỆN TẠI'}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-5">
              <div className="text-3xl font-bold text-gray-900">$0<span className="text-base font-normal text-gray-500">/th</span></div>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'en' ? 'Transaction fee: ' : 'Phí giao dịch: '}
                <span className="font-semibold text-gray-700">2.5%</span>
              </p>
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {features.FREE.map((f, i) => (
                <li key={i} className={`flex items-start gap-2 text-sm ${f.included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                  <span className={`mt-0.5 ${f.included ? 'text-gray-500' : 'text-gray-300'}`}>
                    {f.included ? '✓' : '—'}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>

            {currentTier === 'FREE' ? (
              <Button disabled className="w-full" variant="outline">
                {lang === 'en' ? 'Current plan' : 'Gói hiện tại'}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleAction('downgrade_free')}
                disabled={loading}
              >
                {loading ? '...' : (lang === 'en' ? 'Downgrade' : 'Hạ gói')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* PRO */}
        <Card className={`border-2 relative overflow-visible transition-all flex flex-col ${currentTier === 'PRO' ? 'border-[#FF5942] ring-2 ring-[#FFEFED]' : 'border-[#FF5942] hover:shadow-lg'}`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FF5942] text-white text-xs font-bold rounded-full whitespace-nowrap z-10">
            {lang === 'en' ? 'Popular' : 'Phổ biến'}
          </div>
          <CardContent className="pt-8 px-5 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF0EE]">
                <Crown className="size-5 text-[#FF5942]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Pro</h3>
                {currentTier === 'PRO' && (
                  <span className="text-[10px] font-bold text-[#FF5942] bg-[#FFF0EE] px-1.5 py-0.5 rounded">
                    {subStatus === 'trial'
                      ? (lang === 'en' ? 'TRIAL' : 'DÙNG THỬ')
                      : (lang === 'en' ? 'CURRENT' : 'HIỆN TẠI')}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">${proPrice}</span>
                <span className="text-base font-normal text-gray-500">
                  /{lang === 'en' ? 'mo' : 'th'}
                </span>
              </div>
              {billing === 'annual' && (
                <p className="text-xs text-green-600 font-medium mt-0.5">
                  {lang === 'en'
                    ? `$${49 * 12}/year — billed annually`
                    : `$${49 * 12}/năm — thanh toán theo năm`}
                </p>
              )}
              {billing === 'monthly' && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {lang === 'en'
                    ? 'Switch to annual and save 35%'
                    : 'Chuyển sang năm để tiết kiệm 35%'}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'en' ? 'Transaction fee: ' : 'Phí giao dịch: '}
                <span className="font-semibold text-gray-700">1.5%</span>
              </p>
              <p className="text-xs text-[#FF5942] font-medium mt-1">
                {lang === 'en' ? '7-day free trial available' : 'Dùng thử 7 ngày miễn phí'}
              </p>
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {features.PRO.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#FF5942] mt-0.5">✓</span>
                  {f.text}
                </li>
              ))}
            </ul>

            {currentTier === 'PRO' && subStatus === 'active' ? (
              <Button disabled className="w-full bg-[#FF5942]">
                {lang === 'en' ? 'Current plan' : 'Gói hiện tại'}
              </Button>
            ) : currentTier === 'PRO' && subStatus === 'trial' ? (
              <Button
                className="w-full bg-[#FF5942] hover:bg-[#e64d38]"
                onClick={() => handleAction('upgrade_pro')}
                disabled={loading}
              >
                {loading ? '...' : (lang === 'en' ? 'Upgrade to paid Pro' : 'Nâng cấp Pro trả phí')}
              </Button>
            ) : currentTier === 'FREE' && !trialUsed ? (
              <Button
                className="w-full bg-[#FF5942] hover:bg-[#e64d38]"
                onClick={() => handleAction('start_trial')}
                disabled={loading}
              >
                {loading ? '...' : (lang === 'en' ? 'Start 7-day free trial' : 'Dùng thử 7 ngày miễn phí')}
              </Button>
            ) : (
              <Button
                className="w-full bg-[#FF5942] hover:bg-[#e64d38]"
                onClick={() => handleAction('upgrade_pro')}
                disabled={loading}
              >
                {loading ? '...' : (lang === 'en' ? 'Upgrade to Pro' : 'Nâng cấp Pro')}
              </Button>
            )}

            {currentTier === 'FREE' && !trialUsed && (
              <p className="text-center text-xs text-gray-400 mt-2">
                {lang === 'en'
                  ? 'No credit card required for trial'
                  : 'Không cần thẻ để dùng thử'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ENTERPRISE */}
        <Card className={`border-2 transition-colors flex flex-col ${currentTier === 'ENTERPRISE' ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-200 hover:border-purple-300'}`}>
          <CardContent className="pt-6 px-5 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50">
                <Building2 className="size-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Enterprise</h3>
                {currentTier === 'ENTERPRISE' && (
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                    {lang === 'en' ? 'CURRENT' : 'HIỆN TẠI'}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-5">
              <div className="text-3xl font-bold text-gray-900">Custom</div>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'en' ? 'Fee from: ' : 'Phí từ: '}
                <span className="font-semibold text-gray-700">1.0%</span>
              </p>
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {features.ENTERPRISE.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-purple-500 mt-0.5">✓</span>
                  {f.text}
                </li>
              ))}
            </ul>

            <a href="mailto:sales@zoxi.vn">
              <Button variant="outline" className="w-full border-purple-300 text-purple-600 hover:bg-purple-50">
                {lang === 'en' ? 'Contact sales' : 'Liên hệ sales'}
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Fee comparison */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">
            {lang === 'en' ? 'Fee comparison' : 'So sánh phí'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Feature' : 'Tính năng'}
                  </th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider">
                    <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-bold">Free</span>
                  </th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider">
                    <span className="text-[#FF5942] bg-[#FFF0EE] px-2 py-0.5 rounded-full font-bold">Pro</span>
                  </th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider">
                    <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold">Enterprise</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: lang === 'en' ? 'Monthly price' : 'Phí hàng tháng',
                    free: '$0',
                    pro: billing === 'annual' ? '$49' : '$75',
                    ent: 'Custom',
                  },
                  {
                    feature: lang === 'en' ? 'Annual price' : 'Phí hàng năm',
                    free: '$0',
                    pro: billing === 'annual' ? '$588' : `$900`,
                    ent: 'Custom',
                  },
                  { feature: lang === 'en' ? 'Transaction fee' : 'Phí giao dịch', free: '2.5%', pro: '1.5%', ent: lang === 'en' ? 'From 1.0%' : 'Từ 1.0%' },
                  { feature: 'Virtual Accounts', free: '10', pro: '100', ent: 'Unlimited' },
                  { feature: lang === 'en' ? 'Etsy auto-sync' : 'Đồng bộ Etsy', free: '—', pro: '✓', ent: '✓' },
                  { feature: lang === 'en' ? 'Invoice export' : 'Xuất hóa đơn', free: '—', pro: '✓', ent: '✓' },
                  { feature: lang === 'en' ? 'Priority support' : 'Hỗ trợ ưu tiên', free: '—', pro: '✓', ent: '✓' },
                  { feature: lang === 'en' ? 'Dedicated manager' : 'Account Manager riêng', free: '—', pro: '—', ent: '✓' },
                  { feature: 'API', free: lang === 'en' ? 'Basic' : 'Cơ bản', pro: lang === 'en' ? 'Full' : 'Đầy đủ', ent: lang === 'en' ? 'Advanced' : 'Nâng cao' },
                ].map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-center">{row.free}</td>
                    <td className="py-3 px-4 text-center font-medium">{row.pro}</td>
                    <td className="py-3 px-4 text-center">{row.ent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Subscription History */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="size-5 text-gray-600" />
            <h2 className="text-lg font-semibold">
              {lang === 'en' ? 'Subscription History' : 'Lịch sử subscription'}
            </h2>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              {lang === 'en' ? 'No subscription activity yet.' : 'Chưa có hoạt động subscription nào.'}
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const actionConfig: Record<string, { icon: typeof ArrowUp; color: string; label: string; labelEn: string }> = {
                  trial_start: { icon: Zap, color: 'text-blue-600 bg-blue-50', label: 'Bắt đầu dùng thử', labelEn: 'Trial Started' },
                  upgrade: { icon: ArrowUp, color: 'text-green-600 bg-green-50', label: 'Nâng cấp', labelEn: 'Upgrade' },
                  downgrade: { icon: ArrowDown, color: 'text-orange-600 bg-orange-50', label: 'Hạ gói', labelEn: 'Downgrade' },
                  auto_charge: { icon: CreditCard, color: 'text-red-600 bg-red-50', label: 'Tự động tính phí', labelEn: 'Auto Charge' },
                  deduction: { icon: CreditCard, color: 'text-amber-600 bg-amber-50', label: 'Trừ phí', labelEn: 'Fee Deduction' },
                  renewal: { icon: RefreshCw, color: 'text-purple-600 bg-purple-50', label: 'Gia hạn', labelEn: 'Renewal' },
                }
                const config = actionConfig[item.action] || { icon: History, color: 'text-gray-600 bg-gray-50', label: item.action, labelEn: item.action }
                const Icon = config.icon

                return (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${config.color}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {lang === 'en' ? config.labelEn : config.label}
                          {item.billing && (
                            <span className="ml-1.5 text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {item.billing === 'annual' ? (lang === 'en' ? 'ANNUAL' : 'NĂM') : (lang === 'en' ? 'MONTHLY' : 'THÁNG')}
                            </span>
                          )}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(item.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {item.amount > 0 && (
                          <span className="text-xs font-medium text-gray-700">
                            {formatVND(item.amount)}
                          </span>
                        )}
                        {item.tier_before && item.tier_after && item.tier_before !== item.tier_after && (
                          <span className="text-xs text-gray-400">
                            {item.tier_before} → {item.tier_after}
                          </span>
                        )}
                        {(item.amount_due_before > 0 || item.amount_due_after > 0) && (
                          <span className="text-xs text-gray-400">
                            {lang === 'en' ? 'Due: ' : 'Nợ: '}{formatVND(item.amount_due_after)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription payment info */}
      <div className="mt-6 bg-gray-50 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-2">
          {lang === 'en' ? 'How subscription payment works' : 'Cách thanh toán subscription'}
        </h3>
        <ul className="text-sm text-gray-600 space-y-1.5">
          <li>
            {lang === 'en'
              ? `- Monthly plan: $75/month (~${new Intl.NumberFormat('vi-VN').format(75 * 25000)} VND). Annual plan: $49/month (~${new Intl.NumberFormat('vi-VN').format(49 * 25000)} VND/month, billed $588/year).`
              : `- Gói tháng: $75/tháng (~${new Intl.NumberFormat('vi-VN').format(75 * 25000)} VND). Gói năm: $49/tháng (~${new Intl.NumberFormat('vi-VN').format(49 * 25000)} VND/tháng, thanh toán $588/năm).`}
          </li>
          <li>
            {lang === 'en'
              ? '- Subscription fee is automatically deducted from your top-up transactions (max 50% per transaction).'
              : '- Phí subscription sẽ tự động trừ từ các giao dịch nạp tiền (tối đa 50% mỗi giao dịch).'}
          </li>
          <li>
            {lang === 'en'
              ? '- 7-day free trial: try Pro features without any charge.'
              : '- Dùng thử 7 ngày miễn phí: trải nghiệm tính năng Pro không mất phí.'}
          </li>
        </ul>
      </div>
    </div>
  )
}

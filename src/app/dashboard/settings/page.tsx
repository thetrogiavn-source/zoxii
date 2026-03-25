'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { Check, AlertTriangle, Send, ExternalLink } from 'lucide-react'

export default function GeneralSettingsPage() {
  const { t, lang } = useI18n()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [tier, setTier] = useState('FREE')
  const [kycStatus, setKycStatus] = useState('none')
  const [kycLevel, setKycLevel] = useState(0)
  const [createdAt, setCreatedAt] = useState('')

  // Phone OTP
  const [showPhoneOtp, setShowPhoneOtp] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // Telegram
  const [telegramUsername, setTelegramUsername] = useState('')
  const [telegramVerified, setTelegramVerified] = useState(false)
  const [telegramInput, setTelegramInput] = useState('')
  const [telegramSaving, setTelegramSaving] = useState(false)
  const [telegramSuccess, setTelegramSuccess] = useState('')
  const [telegramError, setTelegramError] = useState('')

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email || '')
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setPhoneVerified(profile.phone_verified || false)
      setTier(profile.tier || 'FREE')
      setKycStatus(profile.kyc_status || 'none')
      setKycLevel(profile.kyc_level || 0)
      setCreatedAt(profile.created_at || '')
      setTelegramUsername(profile.telegram_username || '')
      setTelegramVerified(profile.telegram_verified || false)
      setTelegramInput(profile.telegram_username || '')
    }
  }

  async function saveTelegram() {
    const username = telegramInput.trim().replace('@', '')
    if (!username) { setTelegramError(lang === 'en' ? 'Please enter Telegram username' : 'Vui lòng nhập Telegram username'); return }
    setTelegramSaving(true)
    setTelegramError('')
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const json = await res.json()
      setTelegramSaving(false)

      if (!res.ok) {
        if (json.error === 'not_found') {
          setTelegramError(lang === 'en'
            ? 'Username not found. Please open @ZOXI999BOT on Telegram, send /start, then try again.'
            : 'Không tìm thấy username. Vui lòng mở @ZOXI999BOT trên Telegram, gửi /start, rồi thử lại.')
        } else {
          setTelegramError(lang === 'en' ? 'Connection failed. Try again.' : 'Kết nối thất bại. Thử lại.')
        }
        return
      }

      setTelegramUsername(username)
      setTelegramVerified(true)
      setTelegramSuccess(lang === 'en' ? 'Telegram connected! Check your Telegram for confirmation.' : 'Kết nối Telegram thành công! Kiểm tra Telegram để xác nhận.')
      setTimeout(() => setTelegramSuccess(''), 5000)
    } catch {
      setTelegramSaving(false)
      setTelegramError(lang === 'en' ? 'Connection error' : 'Lỗi kết nối')
    }
  }

  async function disconnectTelegram() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ telegram_username: null, telegram_verified: false }).eq('id', user.id)
    setTelegramUsername('')
    setTelegramVerified(false)
    setTelegramInput('')
  }

  const TIER_STYLES: Record<string, { label: string; bg: string; text: string; desc: string }> = {
    FREE: { label: 'Free', bg: '#f3f4f6', text: '#6b7280', desc: t('tier_free_desc') },
    PRO: { label: 'Pro', bg: '#FFF0EE', text: '#FF5942', desc: t('tier_pro_desc') },
    ENTERPRISE: { label: 'Enterprise', bg: '#f3e8ff', text: '#7c3aed', desc: t('tier_enterprise_desc') },
  }
  const KYC_STYLES: Record<string, { label: string; bg: string; text: string }> = {
    approved: { label: t('kyc_verified'), bg: '#e7f5ec', text: '#60bc7f' },
    pending: { label: t('kyc_pending_review'), bg: '#fef2d4', text: '#e4a508' },
    rejected: { label: t('kyc_rejected'), bg: '#fde8ea', text: '#e91925' },
    none: { label: t('kyc_not_verified'), bg: '#f3f4f6', text: '#9ca3af' },
  }
  const tierInfo = TIER_STYLES[tier] || TIER_STYLES.FREE
  const kycInfo = KYC_STYLES[kycStatus] || KYC_STYLES.none

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Info */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-5">{t('personal_info')}</h2>
          <div className="space-y-3">
            <InfoRow label={t('full_name')} value={fullName || '—'} />
            <InfoRow label={t('email')} value={email} />
            <div className="flex justify-between py-2.5 border-b">
              <span className="text-sm text-gray-500">{t('phone')}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{phone || '—'}</span>
                {!phone ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded text-[9px] font-bold bg-red-50 text-red-500">
                    <AlertTriangle className="size-3" /> {lang === 'en' ? 'Required' : 'Bắt buộc'}
                  </span>
                ) : phoneVerified ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded text-[9px] font-bold bg-green-50 text-green-600">
                    <Check className="size-3" /> {lang === 'en' ? 'Verified' : 'Đã xác minh'}
                  </span>
                ) : (
                  <button
                    onClick={async () => {
                      if (!telegramVerified) {
                        setOtpError(lang === 'en' ? 'Please connect Telegram first to verify phone.' : 'Vui lòng kết nối Telegram trước để xác minh SĐT.')
                        setShowPhoneOtp(true)
                        return
                      }
                      setShowPhoneOtp(true)
                      setOtpError('')
                      setOtpSending(true)
                      const res = await fetch('/api/verify-phone', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'send_otp' }),
                      })
                      setOtpSending(false)
                      if (res.ok) setOtpSent(true)
                      else {
                        const json = await res.json()
                        setOtpError(json.message || (lang === 'en' ? 'Failed to send OTP' : 'Gửi mã OTP thất bại'))
                      }
                    }}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                  >
                    <AlertTriangle className="size-3" /> {lang === 'en' ? 'Verify now' : 'Xác minh ngay'}
                  </button>
                )}
              </div>
            </div>

            {/* Phone OTP verification */}
            {showPhoneOtp && !phoneVerified && (
              <div className="mt-3 p-4 bg-blue-50 rounded-xl space-y-3">
                <p className="text-sm font-medium text-blue-700">
                  {lang === 'en' ? 'Verify phone via Telegram' : 'Xác minh SĐT qua Telegram'}
                </p>
                {otpError && (
                  <p className="text-xs text-red-600">{otpError}</p>
                )}
                {otpSent && !otpError && (
                  <>
                    <p className="text-xs text-blue-600">
                      {lang === 'en' ? 'A 6-digit code has been sent to your Telegram. Enter it below:' : 'Mã 6 số đã được gửi đến Telegram của bạn. Nhập bên dưới:'}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="h-12 text-center text-lg font-mono tracking-widest max-w-[160px]"
                        maxLength={6}
                      />
                      <Button
                        onClick={async () => {
                          if (otpCode.length !== 6) return
                          setOtpVerifying(true)
                          setOtpError('')
                          const res = await fetch('/api/verify-phone', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'verify_otp', code: otpCode }),
                          })
                          setOtpVerifying(false)
                          if (res.ok) {
                            setPhoneVerified(true)
                            setShowPhoneOtp(false)
                            setOtpCode('')
                          } else {
                            const json = await res.json()
                            setOtpError(json.message || (lang === 'en' ? 'Invalid code' : 'Mã không hợp lệ'))
                          }
                        }}
                        disabled={otpVerifying || otpCode.length !== 6}
                        className="h-12 bg-blue-600 hover:bg-blue-700"
                      >
                        {otpVerifying ? '...' : (lang === 'en' ? 'Verify' : 'Xác minh')}
                      </Button>
                    </div>
                  </>
                )}
                {!otpSent && !otpError && (
                  <p className="text-xs text-blue-500">
                    {otpSending
                      ? (lang === 'en' ? 'Sending OTP to Telegram...' : 'Đang gửi mã OTP đến Telegram...')
                      : (lang === 'en' ? 'Click "Verify now" to receive OTP on Telegram' : 'Bấm "Xác minh ngay" để nhận mã OTP qua Telegram')}
                  </p>
                )}
              </div>
            )}
            <InfoRow label={t('registered_date')} value={createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '—'} />
          </div>
          {!phone && (
            <div className="mt-4 bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{lang === 'en' ? 'Phone number is required. Please contact support.' : 'Số điện thoại là bắt buộc. Vui lòng liên hệ hỗ trợ để cập nhật.'}</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">{t('personal_info_note')}</p>
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Send className="size-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Telegram</h2>
            {telegramVerified && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600">
                {lang === 'en' ? 'Connected' : 'Đã kết nối'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {lang === 'en'
              ? 'Connect Telegram to receive instant notifications about transactions, withdrawals, and account updates.'
              : 'Kết nối Telegram để nhận thông báo tức thì về giao dịch, rút tiền và cập nhật tài khoản.'}
          </p>

          {telegramSuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
              <Check className="size-4" /> {telegramSuccess}
            </div>
          )}
          {telegramError && (
            <div className="bg-[#FDE8EA] text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{telegramError}</div>
          )}

          {telegramVerified && telegramUsername ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
                    <Send className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">@{telegramUsername}</p>
                    <p className="text-xs text-blue-600">{lang === 'en' ? 'Receiving notifications' : 'Đang nhận thông báo'}</p>
                  </div>
                </div>
                <button onClick={disconnectTelegram} className="text-xs text-red-500 hover:text-red-600 font-medium">
                  {lang === 'en' ? 'Disconnect' : 'Ngắt kết nối'}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Check className="size-3.5 text-green-500" />
                {lang === 'en'
                  ? 'Notifications: Top-up, Withdrawals, KYC updates'
                  : 'Thông báo: Nạp tiền, Rút tiền, Cập nhật KYC'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">1</div>
                <div>
                  <p className="text-sm font-medium">{lang === 'en' ? 'Open ZOXI Bot on Telegram' : 'Mở ZOXI Bot trên Telegram'}</p>
                  <a href="https://t.me/ZOXI999BOT" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:underline">
                    t.me/ZOXI999BOT <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">2</div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">{lang === 'en' ? 'Enter your Telegram username' : 'Nhập Telegram username'}</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                      <Input
                        value={telegramInput}
                        onChange={(e) => setTelegramInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        placeholder="username"
                        className="h-12 pl-8"
                        maxLength={32}
                      />
                    </div>
                    <Button onClick={saveTelegram} disabled={telegramSaving || !telegramInput.trim()} className="h-12 bg-blue-600 hover:bg-blue-700 px-5">
                      {telegramSaving ? '...' : (lang === 'en' ? 'Connect' : 'Kết nối')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">{t('identity_verification')}</h2>
          <div className="flex items-center gap-3">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: kycInfo.bg, color: kycInfo.text }}>
              {kycInfo.label}
            </span>
          </div>
          {kycStatus !== 'approved' && (
            <a href="/dashboard/kyc" className="inline-block mt-3 text-sm text-[#FF5942] font-medium hover:underline">{t('kyc_verify_now')}</a>
          )}
        </CardContent>
      </Card>

      {/* Tier */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">{t('account_tier')}</h2>
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: tierInfo.bg, color: tierInfo.text }}>
              {tierInfo.label}
            </span>
            <span className="text-sm text-gray-500">{tierInfo.desc}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('tier_progression')}</p>
            <div className="flex flex-wrap items-center gap-1">
              {Object.entries(TIER_STYLES).map(([key, info], i) => (
                <div key={key} className="flex items-center gap-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${key === tier ? 'ring-2 ring-offset-1' : 'opacity-50'}`}
                    style={{ backgroundColor: info.bg, color: info.text }}>
                    {info.label}
                  </span>
                  {i < 2 && <span className="text-gray-300 text-xs">→</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">{t('tier_manage_note')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

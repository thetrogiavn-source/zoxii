'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Check, Info } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useI18n } from '@/lib/i18n'

const REFERRAL_SOURCES_VI = [
  { id: 'SOCIAL_MEDIA', label: 'Mạng xã hội (group, Facebook, quảng cáo...)' },
  { id: 'GOOGLE', label: 'Google' },
  { id: 'WEBSITE', label: 'Website' },
  { id: 'REFERRED', label: 'Bạn bè / đối tác giới thiệu' },
  { id: 'SALE', label: 'Tư vấn viên' },
  { id: 'OTHERS', label: 'Khác' },
]

const REFERRAL_SOURCES_EN = [
  { id: 'SOCIAL_MEDIA', label: 'Social media (groups, Facebook, ads...)' },
  { id: 'GOOGLE', label: 'Google' },
  { id: 'WEBSITE', label: 'Website' },
  { id: 'REFERRED', label: 'Friends / partner referral' },
  { id: 'SALE', label: 'Sales consultant' },
  { id: 'OTHERS', label: 'Other' },
]

const PASSWORD_RULES_VI = [
  { label: 'Ít nhất 8 ký tự', test: (p: string) => p.length >= 8 },
  { label: 'Có chữ hoa', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Có chữ thường', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Có số', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Có ký tự đặc biệt', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

const PASSWORD_RULES_EN = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Has uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Has lowercase', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Has number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Has special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function RegisterPage() {
  const { lang } = useI18n()
  const REFERRAL_SOURCES = lang === 'en' ? REFERRAL_SOURCES_EN : REFERRAL_SOURCES_VI
  const PASSWORD_RULES = lang === 'en' ? PASSWORD_RULES_EN : PASSWORD_RULES_VI
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [referralSource, setReferralSource] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [acceptPolicy, setAcceptPolicy] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(password)).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(lang === 'en' ? "Passwords don't match" : 'Mật khẩu không khớp')
      return
    }

    if (passwordStrength < 3) {
      setError(lang === 'en' ? 'Password is not strong enough' : 'Mật khẩu chưa đủ mạnh')
      return
    }

    if (!acceptPolicy) {
      setError(lang === 'en' ? 'Please agree to the terms of service' : 'Vui lòng đồng ý với điều khoản sử dụng')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          referral_source: referralSource,
          invite_code: inviteCode,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSignupSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left column - Form */}
      <div className="flex-1 flex flex-col py-8 px-6 lg:px-[5%] xl:px-[7.6%] overflow-y-auto">
        <div className="w-full max-w-[560px] mx-auto lg:mx-0">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="inline-block">
              <span className="text-4xl font-bold text-[#FF5942]">ZOXI</span>
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Success screen after signup */}
          {signupSuccess ? (
            <div className="py-12 text-center">
              <div className="text-6xl mb-6">📧</div>
              <h2 className="text-2xl font-bold mb-3">{lang === 'en' ? 'Check your email' : 'Kiểm tra email của bạn'}</h2>
              <p className="text-gray-600 mb-2">
                {lang === 'en' ? 'We have sent a verification email to' : 'Chúng tôi đã gửi email xác nhận đến'} <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <p className="text-gray-500 text-sm mb-8">
                {lang === 'en' ? 'Please click the link in the email to activate your ZOXI account.' : 'Vui lòng click vào link trong email để kích hoạt tài khoản ZOXI.'}
              </p>
              <Link href="/login">
                <Button className="bg-[#FF5942] hover:bg-[#e64d38] px-8">
                  {lang === 'en' ? 'Go to login' : 'Về trang đăng nhập'}
                </Button>
              </Link>
            </div>
          ) : (
          <>
          {/* Heading */}
          <h1 className="mb-8">
            <span className="block text-[24px] sm:text-[32px] lg:text-[48px] font-semibold leading-[1.2] text-black">
              {lang === 'en' ? "Let's get started!" : 'Bắt đầu nào!'}
            </span>
          </h1>

          {/* Error */}
          {error && (
            <div className="flex items-center h-12 rounded-[5px] bg-[#FDE8EA] px-3 mb-4">
              <svg className="size-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span className="text-red-600 ml-2 text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">
                  {lang === 'en' ? 'Full name' : 'Họ và tên'} <span className="text-red-500">*</span>
                </Label>
                <div className="group relative">
                  <Info className="size-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-3 py-2 w-64 z-10">
                    {lang === 'en' ? 'Please enter the name on your ID card.' : 'Vui lòng nhập đúng tên trên CCCD/CMND của bạn.'}
                  </div>
                </div>
              </div>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="NGUYEN VAN A"
                className="h-12 rounded-lg"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {lang === 'en' ? 'Phone number' : 'Số điện thoại'} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm text-gray-500 pointer-events-none">
                  <span>🇻🇳</span>
                  <span>+84</span>
                  <span className="text-gray-300">|</span>
                </div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                  placeholder="0901234567"
                  className="h-12 rounded-lg pl-[5.5rem]"
                  maxLength={12}
                  required
                />
              </div>
              <p className="text-xs text-gray-400">
                Vui lòng nhập số điện thoại thật để ZOXI có thể hỗ trợ bạn.
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
                  placeholder="seller@example.com"
                  className="h-12 rounded-lg pr-10"
                  required
                />
                {email && email.includes('@') && email.includes('.') && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="size-5 text-[#60BC7F]" />
                  </div>
                )}
              </div>
            </div>

            {/* Referral source */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Bạn biết đến ZOXI qua đâu? <span className="text-red-500">*</span>
              </Label>
              <select
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                className="w-full h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5942]/20 focus:border-[#FF5942]"
                required
              >
                <option value="">Chọn nguồn</option>
                {REFERRAL_SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Mật khẩu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Tạo mật khẩu"
                  className="h-12 rounded-lg pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {/* Password strength */}
              {(passwordFocused || password.length > 0) && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-red-400'
                              : passwordStrength <= 3
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-0.5">
                    {PASSWORD_RULES.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                        {rule.test(password) ? (
                          <Check className="size-3.5 text-green-500" />
                        ) : (
                          <div className="size-3.5 rounded-full border border-gray-300" />
                        )}
                        <span className={rule.test(password) ? 'text-green-600' : 'text-gray-400'}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="h-12 rounded-lg pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Mật khẩu không khớp</p>
              )}
            </div>

            {/* Invite code */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mã giới thiệu</Label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.replace(/\s/g, ''))}
                placeholder="Nhập mã giới thiệu (nếu có)"
                className="h-12 rounded-lg"
              />
            </div>

            {/* Policy */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptPolicy}
                onChange={(e) => setAcceptPolicy(e.target.checked)}
                className="mt-0.5 size-[18px] rounded-[5px] border border-gray-300 accent-[#FF5942]"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                Tôi đã đọc và đồng ý với{' '}
                <Link href="/terms" className="text-[#FF5942] font-medium hover:underline">
                  Điều khoản dịch vụ
                </Link>{' '}
                và{' '}
                <Link href="/privacy" className="text-[#FF5942] font-medium hover:underline">
                  Chính sách bảo mật
                </Link>{' '}
                của ZOXI.
              </span>
            </label>

            <Button
              type="submit"
              disabled={loading || !acceptPolicy}
              className="w-full h-12 rounded-lg bg-[#FF5942] hover:bg-[#FF5942]/90 text-white text-base font-bold disabled:bg-[#ccc] disabled:text-gray-500 mt-6"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </Button>
          </form>

          {/* Bottom link */}
          <p className="text-center mt-8 pb-8 text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-[#FF5942] font-bold hover:underline">
              Đăng nhập
            </Link>
          </p>
          </>
          )}
        </div>
      </div>

      {/* Right column - Visual */}
      <div className="hidden lg:flex flex-1 rounded-[10px] bg-[#f8f8f8] m-4 flex-col items-center justify-center p-[6%]">
        <div className="w-full max-w-[600px]">
          <div className="aspect-[1838/1334] bg-gradient-to-br from-[#FF5942]/10 to-[#FF5942]/5 rounded-2xl flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bắt đầu nhận thanh toán
              </h2>
              <p className="text-gray-500">
                Chỉ cần 5 phút để tạo tài khoản
              </p>
            </div>
          </div>
        </div>
        <div className="text-center mt-8 max-w-[582px]">
          <h2 className="text-xl font-bold text-black mb-2">
            Tham gia cộng đồng ZOXI Sellers
          </h2>
          <p className="text-gray-500 font-medium">
            Để cập nhật thông tin mới nhất và được hỗ trợ 24/7!
          </p>
        </div>
      </div>
    </div>
  )
}

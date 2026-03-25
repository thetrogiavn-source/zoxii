'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left column - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-[5%] xl:px-[7.6%]">
        <div className="w-full max-w-[560px] mx-auto lg:mx-0">
          {/* Logo */}
          <div className="mb-[6%]">
            <Link href="/" className="inline-block">
              <span className="text-4xl font-bold text-[#FF5942]">ZOXI</span>
            </Link>
          </div>

          {/* Back button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>

          <h1 className="text-[24px] sm:text-[32px] lg:text-[40px] font-semibold leading-[1.2] text-black mb-2">
            Đặt lại mật khẩu
          </h1>
          <p className="text-gray-500 font-medium mb-8">
            Vui lòng nhập email đã đăng ký
          </p>

          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="size-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-green-800 mb-2">Email đã được gửi!</h2>
              <p className="text-green-700 text-sm">
                Kiểm tra hộp thư <strong>{email}</strong> và nhấn vào link để đặt lại mật khẩu.
              </p>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="mt-6 h-12"
                >
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center h-12 rounded-[5px] bg-[#FDE8EA] px-3">
                  <svg className="size-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-600 ml-2 text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
                  placeholder="seller@example.com"
                  className="h-12 rounded-lg"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-[#FF5942] hover:bg-[#FF5942]/90 text-white text-base font-bold disabled:bg-[#ccc] disabled:text-gray-500"
              >
                {loading ? 'Đang gửi...' : 'Tiếp tục'}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Right column - Visual */}
      <div className="hidden lg:flex flex-1 rounded-[10px] bg-[#f8f8f8] m-4 flex-col items-center justify-center p-[6%]">
        <div className="w-full max-w-[600px]">
          <div className="aspect-[1838/1334] bg-gradient-to-br from-[#FF5942]/10 to-[#FF5942]/5 rounded-2xl flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bảo mật tài khoản
              </h2>
              <p className="text-gray-500">
                Đặt lại mật khẩu nhanh chóng và an toàn
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

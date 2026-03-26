'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message?.includes('Email not confirmed')) {
        setError('Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư của bạn.')
      } else {
        setError('Email hoặc mật khẩu không đúng')
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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

          {/* Heading */}
          <h1 className="mb-8">
            <span className="block text-[28px] sm:text-[40px] lg:text-[60px] font-semibold leading-[1.2] text-black">
              Xin chào!
            </span>
            <span className="block text-[22px] sm:text-[28px] lg:text-[45px] font-semibold leading-[1.3] text-black">
              Đăng nhập vào ZOXI
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
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seller@example.com"
                className="h-12 rounded-lg"
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mật khẩu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-lg pr-12"
                  autoComplete="off"
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
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-[18px] rounded-[5px] border border-gray-300 accent-[#FF5942]"
                />
                <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <Link href="/forgot" className="text-sm font-bold text-[#309AE7] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-[#FF5942] hover:bg-[#FF5942]/90 text-white text-base font-bold disabled:bg-[#ccc] disabled:text-gray-500"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          {/* Bottom link */}
          <p className="text-center mt-10 text-sm text-gray-600">
            Chưa có tài khoản ZOXI?{' '}
            <Link href="/register" className="text-[#FF5942] font-bold hover:underline">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>

      {/* Right column - Visual */}
      <div className="hidden lg:flex flex-1 rounded-[10px] bg-[#f8f8f8] m-4 flex-col items-center justify-center p-[6%]">
        <div className="w-full max-w-[600px]">
          <div className="aspect-[1838/1334] bg-gradient-to-br from-[#FF5942]/10 to-[#FF5942]/5 rounded-2xl flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">💳</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Nhận thanh toán xuyên biên giới
              </h2>
              <p className="text-gray-500">
                Tài khoản ảo VNĐ cho seller Việt Nam
              </p>
            </div>
          </div>
        </div>
        <div className="text-center mt-8 max-w-[582px]">
          <h2 className="text-xl font-bold text-black mb-2">
            Nhận tiền từ Etsy, nhanh chóng & hợp pháp
          </h2>
          <p className="text-gray-500 font-medium">
            Tài khoản ảo BIDV, phí cạnh tranh, rút tiền về bank VN trong ngày.
          </p>
        </div>
      </div>
    </div>
  )
}

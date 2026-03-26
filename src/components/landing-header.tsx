'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useI18n } from '@/lib/i18n'

export function LandingHeader() {
  const { lang } = useI18n()

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between" aria-label="Main navigation">
        <Link href="/" className="text-2xl font-bold text-[#FF5942]" aria-label="ZOXI - Trang chủ">
          ZOXI
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost" className="text-sm sm:text-base px-2 sm:px-4">
              {lang === 'en' ? 'Sign in' : 'Đăng nhập'}
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-[#FF5942] hover:bg-[#e64d38] text-sm sm:text-base px-3 sm:px-4">
              {lang === 'en' ? 'Sign up free' : 'Đăng ký miễn phí'}
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  )
}

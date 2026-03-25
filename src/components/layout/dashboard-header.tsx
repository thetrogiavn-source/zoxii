'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LogOut,
  Settings,
  ChevronDown,
  User,
  Menu,
} from 'lucide-react'
import { NotificationBell } from './notification-bell'
import { useI18n } from '@/lib/i18n'

const TIER_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  FREE: { label: 'Free', bg: '#f3f4f6', text: '#6b7280' },
  PRO: { label: 'Pro', bg: '#FFF0EE', text: '#FF5942' },
  ENTERPRISE: { label: 'Enterprise', bg: '#f3e8ff', text: '#7c3aed' },
}

const KYC_STYLES: Record<string, { bg: string; text: string }> = {
  approved: { bg: '#e7f5ec', text: '#60bc7f' },
  pending: { bg: '#fef2d4', text: '#e4a508' },
  rejected: { bg: '#fde8ea', text: '#e91925' },
  none: { bg: '#f3f4f6', text: '#9ca3af' },
}

interface DashboardHeaderProps {
  userName: string
  email: string
  kycStatus: string
  tier?: string
  avatarUrl?: string
  onMenuClick?: () => void
}

export function DashboardHeader({
  userName,
  email,
  kycStatus,
  tier = 'FREE',
  avatarUrl,
  onMenuClick,
}: DashboardHeaderProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { lang: i18nLang, setLang: setI18nLang, t } = useI18n()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const lang = i18nLang === 'en' ? 'EN' : 'VI'

  function switchLang(newLang: 'VI' | 'EN') {
    setI18nLang(newLang === 'EN' ? 'en' : 'vi')
    setLangOpen(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const kycStyle = KYC_STYLES[kycStatus] || KYC_STYLES.none
  const tierStyle = TIER_STYLES[tier] || TIER_STYLES.FREE

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:justify-end lg:px-6 gap-2">
      {/* Mobile hamburger menu */}
      <button
        onClick={onMenuClick}
        className="flex lg:hidden size-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex items-center gap-2">
      {/* Language switcher */}
      <div className="relative" ref={langRef}>
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <span>{lang === 'VI' ? '🇻🇳' : '🇺🇸'}</span>
          <span>{lang}</span>
          <ChevronDown className={`size-3 text-gray-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
        </button>

        {langOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden w-36">
            <button
              onClick={() => switchLang('VI')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${lang === 'VI' ? 'bg-[#FFEFED] text-[#FF5942] font-semibold' : 'text-gray-700'}`}
            >
              <span>🇻🇳</span> Tiếng Việt
            </button>
            <button
              onClick={() => switchLang('EN')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${lang === 'EN' ? 'bg-[#FFEFED] text-[#FF5942] font-semibold' : 'text-gray-700'}`}
            >
              <span>🇺🇸</span> English
            </button>
          </div>
        )}
      </div>

      {/* Notification bell */}
      <NotificationBell />

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <Avatar className="size-9">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="text-sm bg-[#FFEFED] text-[#FF5942] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-base font-semibold leading-tight">{userName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                style={{ backgroundColor: kycStyle.bg, color: kycStyle.text }}
              >
                {kycStatus === 'approved' ? t('kyc_verified') : kycStatus === 'pending' ? t('kyc_pending_review') : kycStatus === 'rejected' ? t('kyc_rejected') : t('kyc_not_verified')}
              </span>
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                style={{ backgroundColor: tierStyle.bg, color: tierStyle.text }}
              >
                {tierStyle.label}
              </span>
            </div>
          </div>
          <ChevronDown className={`size-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* User card */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback className="bg-[#FFEFED] text-[#FF5942] font-bold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{userName}</p>
                  <p className="text-xs text-gray-400 truncate">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: kycStyle.bg, color: kycStyle.text }}
                >
                  {kycStatus === 'approved' ? t('kyc_verified') : kycStatus === 'pending' ? t('kyc_pending_review') : kycStatus === 'rejected' ? t('kyc_rejected') : t('kyc_not_verified')}
                </span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: tierStyle.bg, color: tierStyle.text }}
                >
                  {tierStyle.label}
                </span>
              </div>
            </div>

            {/* Menu */}
            <div className="p-1.5">
              <Link
                href="/dashboard/kyc"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="size-4 text-gray-400" />
                {t('kyc_verify')}
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="size-4 text-gray-400" />
                {t('settings')}
              </Link>
            </div>

            {/* Logout */}
            <div className="p-1.5 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="size-4" />
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </header>
  )
}

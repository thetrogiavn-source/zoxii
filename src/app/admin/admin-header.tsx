'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LogOut,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Bell,
} from 'lucide-react'

interface AdminHeaderProps {
  userName: string
  email: string
}

export function AdminHeader({ userName, email }: AdminHeaderProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

  return (
    <header className="h-16 border-b bg-white flex items-center justify-end px-6 gap-2">
      <button className="flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
        <Bell className="size-[18px]" />
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <Avatar className="size-9">
            <AvatarFallback className="text-sm bg-red-100 text-red-700 font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-base font-semibold leading-tight">{userName}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
              Admin
            </span>
          </div>
          <ChevronDown className={`size-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b">
              <p className="font-semibold text-sm">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{email}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                Admin
              </span>
            </div>

            <div className="p-1.5">
              <Link
                href="/dashboard"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LayoutDashboard className="size-4 text-gray-400" />
                Seller Dashboard
              </Link>
              <Link
                href="/admin/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="size-4 text-gray-400" />
                Cài đặt hệ thống
              </Link>
            </div>

            <div className="p-1.5 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="size-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

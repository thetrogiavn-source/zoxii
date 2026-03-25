'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  ArrowDownUp,
  ArrowUpFromLine,
  TrendingUp,
  Bell,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
} from 'lucide-react'

interface AdminSidebarProps {
  adminName: string
  email: string
}

const navItems = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/sellers', label: 'Quản lý Seller', icon: Users },
  { href: '/admin/kyc-review', label: 'Duyệt KYC', icon: ShieldCheck },
  { href: '/admin/virtual-accounts', label: 'Virtual Accounts', icon: CreditCard },
  { href: '/admin/transactions', label: 'Giao dịch', icon: ArrowDownUp },
  { href: '/admin/withdrawals', label: 'Rút tiền', icon: ArrowUpFromLine },
  { href: '/admin/revenue', label: 'Doanh thu', icon: TrendingUp },
  { href: '/admin/notifications', label: 'Thông báo', icon: Bell },
  { href: '/admin/roles', label: 'Phân quyền', icon: Shield },
  { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
]

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-white transition-all duration-300 min-h-screen',
        collapsed ? 'w-16' : 'w-65'
      )}
    >
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-4 h-16 border-b shrink-0">
        {!collapsed && (
          <Link href="/admin" className="text-2xl font-bold text-red-600">
            ZOXI <span className="text-xs font-normal text-red-400">Admin</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('size-8 p-0', collapsed && 'mx-auto')}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}

        {/* Separator + back to seller dashboard */}
        <div className="pt-4 mt-4 border-t">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="size-5 shrink-0" />
            {!collapsed && <span>Seller Dashboard</span>}
          </Link>
        </div>
      </nav>

    </aside>
  )
}

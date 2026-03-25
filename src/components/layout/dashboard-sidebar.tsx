'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import {
  LayoutDashboard,
  CreditCard,
  ArrowDownUp,
  ArrowUpFromLine,
  Gift,
  Sparkles,
  Settings,
  Shield,
  Wallet,
  Code2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  X,
} from 'lucide-react'

interface DashboardSidebarProps {
  userName: string
  email: string
  kycStatus: string
  kycLevel?: number
  tier?: string
  isAdmin?: boolean
  avatarUrl?: string
  open?: boolean
  onClose?: () => void
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function DashboardSidebar({
  isAdmin,
  open,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'va': true,
    'st': true,
  })
  const topNavItems: NavItem[] = [
    { href: '/dashboard', label: t('dashboard'), icon: <LayoutDashboard className="size-5" /> },
  ]

  const sections: NavSection[] = [
    {
      title: t('virtual_account'),
      items: [
        { href: '/dashboard/accounts', label: t('va_list'), icon: <CreditCard className="size-5" /> },
        { href: '/dashboard/topup', label: t('va_transactions'), icon: <ArrowDownUp className="size-5" /> },
        { href: '/dashboard/withdraw', label: t('va_withdraw'), icon: <ArrowUpFromLine className="size-5" /> },
      ],
    },
    {
      title: t('settings_section'),
      items: [
        { href: '/dashboard/settings', label: t('settings_general'), icon: <Settings className="size-5" /> },
        { href: '/dashboard/settings/security', label: t('settings_security'), icon: <Shield className="size-5" /> },
        { href: '/dashboard/settings/payment', label: t('settings_payment'), icon: <Wallet className="size-5" /> },
        { href: '/dashboard/settings/developers', label: t('settings_developers'), icon: <Code2 className="size-5" /> },
      ],
    },
  ]

  const standaloneItems: NavItem[] = [
    { href: '/dashboard/referral', label: t('referral'), icon: <Gift className="size-5" /> },
    { href: '/dashboard/pricing', label: t('pricing'), icon: <Sparkles className="size-5" /> },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function toggleSection(title: string) {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  function handleNavClick() {
    // Close sidebar on mobile when a nav link is clicked
    onClose?.()
  }

  function renderNavItem(item: NavItem) {
    const active = isActive(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        title={collapsed ? item.label : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          active
            ? 'bg-[#FFEFED] text-[#FF5942]'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <span className="shrink-0">{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    )
  }

  function renderSection(section: NavSection) {
    const isExpanded = expandedSections[section.title] ?? true
    return (
      <div key={section.title}>
        {!collapsed ? (
          <button
            onClick={() => toggleSection(section.title)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
          >
            <span>{section.title}</span>
            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        ) : (
          <Separator className="my-2" />
        )}
        {(isExpanded || collapsed) && (
          <div className="space-y-0.5">
            {section.items.map((item) => renderNavItem(item))}
          </div>
        )}
      </div>
    )
  }

  const sidebarContent = (
    <aside
      className={cn(
        'flex flex-col border-r bg-white transition-all duration-300 min-h-screen',
        collapsed ? 'w-16' : 'w-65'
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-4 h-16 border-b shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="text-2xl font-bold text-[#FF5942]">
            ZOXI
          </Link>
        )}
        {/* Close button on mobile, collapse toggle on desktop */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // On mobile (when onClose exists and sidebar is open as overlay), close it
            // On desktop, toggle collapse
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              onClose?.()
            } else {
              setCollapsed(!collapsed)
            }
          }}
          className={cn('size-8 p-0 lg:flex', collapsed && 'mx-auto')}
        >
          <span className="lg:hidden"><X className="size-4" /></span>
          <span className="hidden lg:inline-flex">
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Dashboard */}
        {topNavItems.map((item) => renderNavItem(item))}

        {/* Virtual Account section */}
        {renderSection(sections[0])}

        {/* Standalone items */}
        {standaloneItems.map((item) => renderNavItem(item))}

        {/* Settings section */}
        {renderSection(sections[1])}

        {/* Admin link */}
        {isAdmin && (
          <>
            <Separator className="my-2" />
            <Link
              href="/admin"
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-red-50 text-red-700'
                  : 'text-red-600 hover:bg-red-50'
              )}
            >
              <Shield className="size-5" />
              {!collapsed && <span>Admin Panel</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Logout (collapsed only) */}
      {collapsed && (
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full p-0"
            onClick={handleLogout}
            title="Dang xuat"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      )}
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>

      {/* Mobile sidebar - overlay drawer */}
      <div className="lg:hidden">
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
        />
        {/* Drawer */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  )
}

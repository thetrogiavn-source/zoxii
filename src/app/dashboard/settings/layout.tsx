'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t } = useI18n()

  const settingsTabs = [
    { href: '/dashboard/settings', label: t('settings_general') },
    { href: '/dashboard/settings/security', label: t('settings_security') },
    { href: '/dashboard/settings/payment', label: t('settings_payment') },
    { href: '/dashboard/settings/developers', label: t('settings_developers') },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>

      <nav className="flex gap-1 border-b mb-6">
        {settingsTabs.map((tab) => {
          const isActive =
            tab.href === '/dashboard/settings'
              ? pathname === '/dashboard/settings'
              : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-[#FF5942] text-[#FF5942]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'

interface DashboardLayoutClientProps {
  userName: string
  email: string
  kycStatus: string
  kycLevel: number
  tier: string
  isAdmin: boolean
  avatarUrl?: string
  children: React.ReactNode
}

export function DashboardLayoutClient({
  userName,
  email,
  kycStatus,
  kycLevel,
  tier,
  isAdmin,
  avatarUrl,
  children,
}: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-gray-50">
      <DashboardSidebar
        userName={userName}
        email={email}
        kycStatus={kycStatus}
        kycLevel={kycLevel}
        tier={tier}
        isAdmin={isAdmin}
        avatarUrl={avatarUrl}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <DashboardHeader
          userName={userName}
          email={email}
          kycStatus={kycStatus}
          tier={tier}
          avatarUrl={avatarUrl}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

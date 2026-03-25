'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import {
  Users, ShieldCheck, CreditCard, ArrowDownUp, TrendingUp, Wallet,
} from 'lucide-react'

interface Stats {
  totalSellers: number
  kycPending: number
  activeVAs: number
  totalTransactions: number
  totalVolume: number
  totalRevenue: number
}

interface ActivityItem {
  id: string
  type: 'kyc' | 'transaction'
  description: string
  date: string
  status?: string
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalSellers: 0, kycPending: 0, activeVAs: 0,
    totalTransactions: 0, totalVolume: 0, totalRevenue: 0,
  })
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()

    const [
      { count: sellerCount },
      { count: pendingKyc },
      { count: activeVAs },
      { count: totalTxns },
      { data: txns },
      { data: recentKyc },
      { data: recentTxns },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
      supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('virtual_accounts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('amount, fee'),
      supabase.from('kyc_submissions').select('id, full_name, status, created_at, profiles(email)').order('created_at', { ascending: false }).limit(5),
      supabase.from('transactions').select('id, amount, va_account, time_paid, profiles(email)').order('time_paid', { ascending: false }).limit(5),
    ])

    const totalVolume = txns?.reduce((s, t) => s + Number(t.amount), 0) || 0
    const totalRevenue = txns?.reduce((s, t) => s + Number(t.fee), 0) || 0

    setStats({
      totalSellers: sellerCount || 0,
      kycPending: pendingKyc || 0,
      activeVAs: activeVAs || 0,
      totalTransactions: totalTxns || 0,
      totalVolume,
      totalRevenue,
    })

    // Merge activity
    const merged: ActivityItem[] = [
      ...(recentKyc || []).map((k: Record<string, unknown>) => ({
        id: k.id as string,
        type: 'kyc' as const,
        description: `KYC: ${k.full_name || (k.profiles as Record<string, string>)?.email || 'N/A'} - ${k.status}`,
        date: k.created_at as string,
        status: k.status as string,
      })),
      ...(recentTxns || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        type: 'transaction' as const,
        description: `Giao dịch: ${(t.profiles as Record<string, string>)?.email || 'N/A'} - ${formatVND(Number(t.amount))}`,
        date: t.time_paid as string,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    setActivity(merged)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block size-8 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
        <p className="text-gray-400 mt-3 text-sm">Đang tải...</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Tổng Seller',
      value: stats.totalSellers,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'KYC chờ duyệt',
      value: stats.kycPending,
      icon: ShieldCheck,
      color: 'bg-orange-50 text-orange-600',
      iconBg: 'bg-orange-100',
      href: '/admin/kyc-review',
    },
    {
      label: 'VA hoạt động',
      value: stats.activeVAs,
      icon: CreditCard,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      label: 'Tổng giao dịch',
      value: stats.totalTransactions,
      icon: ArrowDownUp,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
    },
    {
      label: 'Tổng Volume',
      value: formatVND(stats.totalVolume),
      icon: Wallet,
      color: 'bg-emerald-50 text-emerald-600',
      iconBg: 'bg-emerald-100',
      isFormatted: true,
    },
    {
      label: 'Doanh thu ZOXI',
      value: formatVND(stats.totalRevenue),
      icon: TrendingUp,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
      isFormatted: true,
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Tổng quan Admin</h1>
      <p className="text-gray-500 mb-6 text-sm">Theo dõi hoạt động của hệ thống ZOXI.</p>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          const content = (
            <Card key={card.label} className={card.href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}>
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.color.split(' ')[1]}`}>
                      {card.isFormatted ? card.value : card.value}
                    </p>
                  </div>
                  <div className={`flex size-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                    <Icon className={`size-5 ${card.color.split(' ')[1]}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )

          if (card.href) {
            return <Link key={card.label} href={card.href}>{content}</Link>
          }
          return <div key={card.label}>{content}</div>
        })}
      </div>

      {/* Revenue chart placeholder */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Biểu đồ doanh thu</h2>
          <div className="h-48 rounded-xl bg-linear-to-br from-red-50 to-orange-50 flex items-center justify-center border border-dashed border-red-200">
            <p className="text-gray-400 text-sm">Biểu đồ doanh thu — coming soon</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Hoạt động gần đây</h2>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-8 items-center justify-center rounded-full ${
                      item.type === 'kyc' ? 'bg-orange-50' : 'bg-green-50'
                    }`}>
                      {item.type === 'kyc'
                        ? <ShieldCheck className="size-4 text-orange-600" />
                        : <ArrowDownUp className="size-4 text-green-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-gray-400">{new Date(item.date).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  {item.status && (
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                        : item.status === 'approved' ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status === 'pending' ? 'Chờ duyệt' : item.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm">Chưa có hoạt động nào.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

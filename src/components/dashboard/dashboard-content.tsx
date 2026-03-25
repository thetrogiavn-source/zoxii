'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { GrowthChart } from '@/components/dashboard/growth-chart'
import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Txn {
  id: string; amount: number; fee: number; net_amount: number
  time_paid: string; status: string; va_account: string
}
interface Wd {
  id: string; amount: number; status: string; created_at: string
  bank_name: string; bank_account_number: string
}


const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  completed: { label: 'Success', bg: '#e7f5ec', text: '#60bc7f' },
  success: { label: 'Success', bg: '#e7f5ec', text: '#60bc7f' },
  processing: { label: 'Process', bg: '#ebf5fd', text: '#309ae7' },
  pending: { label: 'Pending', bg: '#fef2d4', text: '#e4a508' },
  failed: { label: 'Failed', bg: '#fde8ea', text: '#e91925' },
}

function getGreetingKey(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'good_morning'
  if (hour < 18) return 'good_afternoon'
  return 'good_evening'
}

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export function DashboardContent({
  displayName, transactions, withdrawals,
}: {
  displayName: string
  transactions: Txn[]
  withdrawals: Wd[]
}) {
  const filteredTxns = transactions
  const filteredWds = withdrawals

  const topupSuccess = filteredTxns.filter(t => t.status === 'completed').reduce((s, t) => s + Number(t.net_amount), 0)
  const withdrawnSuccess = filteredWds.filter(w => w.status === 'success').reduce((s, w) => s + Number(w.amount), 0)
  const withdrawnProcessing = filteredWds.filter(w => w.status === 'processing').reduce((s, w) => s + Number(w.amount), 0)
  const balanceAmount = topupSuccess - withdrawnSuccess - withdrawnProcessing

  // Chart — always show 6 months regardless of filter
  const chartData = useMemo(() => {
    const result: { month: string; amount: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = d.toISOString()
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const total = transactions
        .filter(t => t.time_paid >= mStart && t.time_paid <= mEnd)
        .reduce((s, t) => s + Number(t.amount), 0)
      result.push({
        month: d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
        amount: total,
      })
    }
    return result
  }, [transactions])

  // Recent activity
  type ActivityItem = { id: string; type: 'topup' | 'withdrawal'; amount: number; info: string; date: string; status: string }

  const recentActivity: ActivityItem[] = useMemo(() => [
    ...filteredTxns.slice(-50).map(t => ({
      id: t.id, type: 'topup' as const, amount: Number(t.amount),
      info: `VA: ${t.va_account}`, date: t.time_paid, status: t.status,
    })),
    ...filteredWds.slice(0, 50).map(w => ({
      id: w.id, type: 'withdrawal' as const, amount: Number(w.amount),
      info: `${w.bank_name} · ${w.bank_account_number}`, date: w.created_at, status: w.status,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8), [filteredTxns, filteredWds])

  const { t } = useI18n()
  const greeting = t(getGreetingKey())

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">{greeting}, {displayName}!</h1>
      <p className="text-gray-500 mb-5">{t('dashboard_subtitle')}</p>

      {/* Balance hero */}
      <div className="bg-white border rounded-2xl p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{t('available_balance')}</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              {new Intl.NumberFormat('vi-VN').format(balanceAmount > 0 ? balanceAmount : 0)}
              <span className="text-base sm:text-lg font-medium text-gray-400 ml-1.5">VND</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
              <span className="text-xs sm:text-sm text-green-600">
                {t('total_deposited')}: <span className="font-semibold">{new Intl.NumberFormat('vi-VN').format(topupSuccess)}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs sm:text-sm text-orange-600">
                {t('total_withdrawn')}: <span className="font-semibold">{new Intl.NumberFormat('vi-VN').format(withdrawnSuccess)}</span>
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/withdraw?action=new"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#FF5942] text-white text-base font-bold hover:bg-[#e64d38] transition-colors shrink-0 w-full sm:w-auto"
          >
            <ArrowUpRight className="size-5" />
            {t('withdraw')}
          </Link>
        </div>
      </div>

      {/* Chart */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">{t('growth_title')}</h2>
          <GrowthChart data={chartData} />
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('recent_transactions')}</h2>
            <Link href="/dashboard/topup" className="inline-flex items-center gap-1 text-sm text-[#FF5942] hover:underline">
              {t('view_all')} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-1">
              {recentActivity.map(item => {
                const isTopup = item.type === 'topup'
                const st = STATUS_STYLES[item.status] || STATUS_STYLES.completed
                return (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-8 items-center justify-center rounded-full ${isTopup ? 'bg-green-50' : 'bg-orange-50'}`}>
                        {isTopup ? <ArrowDownLeft className="size-4 text-green-600" /> : <ArrowUpRight className="size-4 text-orange-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{isTopup ? t('topup') : t('withdraw')}</p>
                        <p className="text-xs text-gray-400">{item.info} · {new Date(item.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isTopup ? 'text-green-600' : 'text-orange-600'}`}>
                        {isTopup ? '+' : '-'}{formatVND(item.amount)}
                      </p>
                      <span className="inline-block px-2 py-px rounded-full text-[9px] font-bold" style={{ backgroundColor: st.bg, color: st.text }}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no_transactions_period')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

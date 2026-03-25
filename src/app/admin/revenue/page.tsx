'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Download, TrendingUp, ChevronLeft, ChevronRight, FileText, FileSpreadsheet, Calendar } from 'lucide-react'

interface RevenueItem {
  id: string
  amount: number
  fee: number        // ZOXI fee charged to seller
  hpay_fee: number   // Hpay fee charged to ZOXI (mc_fee)
  va_account: string
  time_paid: string
  sellerName: string
  sellerEmail: string
}

type TimeRange = 'all' | 'today' | 'yesterday' | 'this_month' | 'last_month' | 'custom'

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  all: 'Tất cả',
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  this_month: 'Tháng này',
  last_month: 'Tháng trước',
  custom: 'Tùy chọn',
}

const PAGE_SIZE = 20
const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

function getDateRange(range: TimeRange): { start: Date | null; end: Date | null } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (range) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) }
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 86400000)
      return { start: yesterday, end: new Date(today.getTime() - 1) }
    }
    case 'this_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      }
    case 'last_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      }
    default:
      return { start: null, end: null }
  }
}

export default function RevenuePage() {
  const [items, setItems] = useState<RevenueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showExport, setShowExport] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('transactions')
      .select('id, amount, fee, hpay_fee, va_account, time_paid, profiles(email, full_name)')
      .gt('fee', 0)
      .order('time_paid', { ascending: false })

    if (data) {
      setItems(data.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        amount: Number(t.amount),
        fee: Number(t.fee),
        hpay_fee: Number((t as Record<string, unknown>).hpay_fee || 0),
        va_account: t.va_account as string,
        time_paid: t.time_paid as string,
        sellerName: (t.profiles as Record<string, string>)?.full_name || 'N/A',
        sellerEmail: (t.profiles as Record<string, string>)?.email || 'N/A',
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    if (timeRange === 'all') return items
    if (timeRange === 'custom') {
      return items.filter(i => {
        const d = new Date(i.time_paid)
        if (customStart && d < new Date(customStart)) return false
        if (customEnd && d > new Date(customEnd + 'T23:59:59')) return false
        return true
      })
    }
    const { start, end } = getDateRange(timeRange)
    return items.filter(i => {
      const d = new Date(i.time_paid)
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })
  }, [items, timeRange, customStart, customEnd])

  const filteredRevenue = useMemo(() => filtered.reduce((s, i) => s + i.fee, 0), [filtered])
  const filteredHpayFee = useMemo(() => filtered.reduce((s, i) => s + i.hpay_fee, 0), [filtered])
  const filteredProfit = filteredRevenue - filteredHpayFee
  const filteredVolume = useMemo(() => filtered.reduce((s, i) => s + i.amount, 0), [filtered])
  const filteredCount = filtered.length
  const avgFee = filteredCount > 0 ? filteredRevenue / filteredCount : 0
  const profitMargin = filteredRevenue > 0 ? (filteredProfit / filteredRevenue * 100) : 0

  // Period comparisons for summary
  const allTimeRevenue = useMemo(() => items.reduce((s, i) => s + i.fee, 0), [items])
  const allTimeHpayFee = useMemo(() => items.reduce((s, i) => s + i.hpay_fee, 0), [items])
  const allTimeProfit = allTimeRevenue - allTimeHpayFee
  const thisMonthRevenue = useMemo(() => {
    const { start, end } = getDateRange('this_month')
    return items.filter(i => { const d = new Date(i.time_paid); return (!start || d >= start) && (!end || d <= end) }).reduce((s, i) => s + i.fee, 0)
  }, [items])
  const lastMonthRevenue = useMemo(() => {
    const { start, end } = getDateRange('last_month')
    return items.filter(i => { const d = new Date(i.time_paid); return (!start || d >= start) && (!end || d <= end) }).reduce((s, i) => s + i.fee, 0)
  }, [items])
  const todayRevenue = useMemo(() => {
    const { start, end } = getDateRange('today')
    return items.filter(i => { const d = new Date(i.time_paid); return (!start || d >= start) && (!end || d <= end) }).reduce((s, i) => s + i.fee, 0)
  }, [items])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function selectRange(range: TimeRange) {
    setTimeRange(range)
    setPage(1)
    if (range !== 'custom') { setCustomStart(''); setCustomEnd('') }
  }

  function exportData(format: 'csv' | 'xlsx') {
    const headers = ['Ngày', 'Seller', 'Email', 'VA', 'Số tiền GD', 'Phí ZOXI']
    const rows = filtered.map(item => [
      new Date(item.time_paid).toLocaleString('vi-VN'),
      item.sellerName, item.sellerEmail, item.va_account, item.amount, item.fee,
    ])
    const sep = format === 'csv' ? ',' : '\t'
    const ext = format === 'csv' ? 'csv' : 'xls'
    const mime = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel'
    const content = [headers.join(sep), ...rows.map(r => r.join(sep))].join('\n')
    const blob = new Blob(['\ufeff' + content], { type: `${mime};charset=utf-8;` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zoxi-revenue-${timeRange}-${new Date().toISOString().slice(0, 10)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">Doanh thu</h1>
          <p className="text-gray-500 text-sm">Theo dõi doanh thu từ phí giao dịch của ZOXI.</p>
        </div>
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setShowExport(!showExport)} disabled={filtered.length === 0} className="gap-2">
            <Download className="size-4" /> Xuất file
          </Button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 z-20 w-48">
              <button onClick={() => exportData('csv')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm hover:bg-gray-50">
                <FileText className="size-4 text-green-600" /> CSV
              </button>
              <button onClick={() => exportData('xlsx')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm hover:bg-gray-50">
                <FileSpreadsheet className="size-4 text-blue-600" /> Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-[10px] text-red-600 font-medium mb-1">Doanh thu ZOXI</p>
          <p className="text-lg font-bold text-red-700">{formatVND(allTimeRevenue)}</p>
          <p className="text-[10px] text-red-400">{items.length} GD</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-[10px] text-orange-600 font-medium mb-1">Phí Hpay (đối tác)</p>
          <p className="text-lg font-bold text-orange-700">{formatVND(allTimeHpayFee)}</p>
          <p className="text-[10px] text-orange-400">Chi phí vận hành</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-[10px] text-emerald-600 font-medium mb-1">Lợi nhuận ròng</p>
          <p className="text-lg font-bold text-emerald-700">{formatVND(allTimeProfit)}</p>
          <p className="text-[10px] text-emerald-400">Doanh thu - Phí Hpay</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-[10px] text-green-600 font-medium mb-1">Hôm nay</p>
          <p className="text-lg font-bold text-green-700">{formatVND(todayRevenue)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-[10px] text-blue-600 font-medium mb-1">Tháng này</p>
          <p className="text-lg font-bold text-blue-700">{formatVND(thisMonthRevenue)}</p>
        </div>
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 font-medium mb-1">Tháng trước</p>
          <p className="text-lg font-bold text-gray-700">{formatVND(lastMonthRevenue)}</p>
        </div>
      </div>

      {/* Time range selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Calendar className="size-4 text-gray-400" />
        {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => selectRange(range)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-red-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {TIME_RANGE_LABELS[range]}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {timeRange === 'custom' && (
        <div className="flex items-center gap-2 mb-4">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => { setCustomStart(e.target.value); setPage(1) }}
            className="h-10 w-[155px] text-sm"
          />
          <span className="text-gray-300">—</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => { setCustomEnd(e.target.value); setPage(1) }}
            className="h-10 w-[155px] text-sm"
          />
        </div>
      )}

      {/* Filtered stats bar */}
      {timeRange !== 'all' && (
        <div className="flex flex-wrap items-center gap-5 mb-4 p-3 bg-red-50/50 rounded-lg border border-red-100">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Doanh thu</p>
            <p className="text-base font-bold text-red-700">{formatVND(filteredRevenue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Phí Hpay</p>
            <p className="text-base font-bold text-orange-600">{formatVND(filteredHpayFee)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Lợi nhuận</p>
            <p className={`text-base font-bold ${filteredProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatVND(filteredProfit)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Biên LN</p>
            <p className={`text-base font-bold ${profitMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{profitMargin.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">GD</p>
            <p className="text-base font-bold text-gray-700">{filteredCount}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mb-2">{filtered.length} giao dịch</p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block size-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              <p className="text-gray-400 mt-3 text-sm">Đang tải...</p>
            </div>
          ) : paged.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80">
                      <TableHead className="w-[100px]">Ngày</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>VA</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Phí ZOXI</TableHead>
                      <TableHead className="text-right">Phí Hpay</TableHead>
                      <TableHead className="text-right">Lợi nhuận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((item) => {
                      const profit = item.fee - item.hpay_fee
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50/50">
                          <TableCell>
                            <div className="text-xs">
                              <span className="text-gray-700">{new Date(item.time_paid).toLocaleDateString('vi-VN')}</span><br />
                              <span className="text-gray-400">{new Date(item.time_paid).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{item.sellerName}</p>
                              <p className="text-xs text-gray-400">{item.sellerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-600">{item.va_account}</TableCell>
                          <TableCell className="text-right text-sm">{formatVND(item.amount)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-red-600">+{formatVND(item.fee)}</TableCell>
                          <TableCell className="text-right text-sm text-orange-600">{item.hpay_fee > 0 ? `-${formatVND(item.hpay_fee)}` : '—'}</TableCell>
                          <TableCell className="text-right text-sm font-semibold">
                            <span className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {profit >= 0 ? '+' : ''}{formatVND(profit)}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
                  <span className="text-xs text-gray-400">Trang {page}/{totalPages} · {filtered.length} giao dịch</span>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="size-8 p-0">
                      <ChevronLeft className="size-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let p: number
                      if (totalPages <= 7) p = i + 1
                      else if (page <= 4) p = i + 1
                      else if (page >= totalPages - 3) p = totalPages - 6 + i
                      else p = page - 3 + i
                      return (
                        <Button key={p} variant={page === p ? 'default' : 'ghost'} size="sm" onClick={() => setPage(p)}
                          className={`size-8 p-0 text-xs ${page === p ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                          {p}
                        </Button>
                      )
                    })}
                    <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="size-8 p-0">
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <TrendingUp className="size-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Chưa có doanh thu nào trong khoảng thời gian này.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowDownLeft, Search, Download, ChevronLeft, ChevronRight,
  Copy, Check, X, CircleOff, Calendar,
} from 'lucide-react'
import type { Transaction } from '@/types'
import { useI18n } from '@/lib/i18n'

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  completed: { label: 'Success', bg: '#e7f5ec', text: '#60bc7f' },
  pending: { label: 'Pending', bg: '#fef2d4', text: '#e4a508' },
  processing: { label: 'Process', bg: '#ebf5fd', text: '#309ae7' },
  failed: { label: 'Failed', bg: '#fde8ea', text: '#e91925' },
}

type TimeRange = 'all' | 'today' | 'this_week' | 'this_month' | 'custom'

function getTimeRange(range: TimeRange): { start: Date; end: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (range) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) }
    case 'this_week': {
      const day = today.getDay()
      const monday = new Date(today.getTime() - (day === 0 ? 6 : day - 1) * 86400000)
      return { start: monday, end: new Date(monday.getTime() + 7 * 86400000 - 1) }
    }
    case 'this_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      }
    default:
      return { start: new Date(0), end: new Date(9999, 11, 31) }
  }
}

const PAGE_SIZE = 20

export default function TransactionsPage() {
  const { t } = useI18n()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const vaFromUrl = searchParams.get('va') || ''
  const [search, setSearch] = useState(vaFromUrl)
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [page, setPage] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const PLATFORMS = useMemo(() => [
    { id: '', name: t('all_sources_filter') },
    { id: 'etsy', name: 'Etsy' },
    { id: 'paypal', name: 'PayPal' },
    { id: 'payoneer', name: 'Payoneer' },
    { id: 'pingpong', name: 'Pingpong' },
    { id: 'wise', name: 'Wise' },
    { id: 'airwallex', name: 'Airwallex' },
    { id: 'worldfirst', name: 'WorldFirst' },
    { id: 'lianlian', name: 'LianLian' },
  ], [t])

  const TIME_RANGES: { key: TimeRange; label: string }[] = useMemo(() => [
    { key: 'all', label: t('all') },
    { key: 'today', label: t('today') },
    { key: 'this_week', label: t('this_week') },
    { key: 'this_month', label: t('this_month') },
    { key: 'custom', label: t('custom') },
  ], [t])

  const STATUS_FILTERS = useMemo(() => [
    { value: '', label: t('all_status') },
    { value: 'completed', label: t('success_status') },
    { value: 'pending', label: t('pending_status') },
    { value: 'processing', label: t('processing_status') },
    { value: 'failed', label: t('failed_status') },
  ], [t])

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: txns } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('time_paid', { ascending: false })

    setTransactions(txns || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // Time range
      if (timeRange === 'custom') {
        if (customStart && new Date(t.time_paid) < new Date(customStart)) return false
        if (customEnd && new Date(t.time_paid) > new Date(customEnd + 'T23:59:59')) return false
      } else if (timeRange !== 'all') {
        const { start, end } = getTimeRange(timeRange)
        const d = new Date(t.time_paid)
        if (d < start || d > end) return false
      }

      // Status filter
      if (statusFilter && t.status !== statusFilter) return false

      // Platform filter (match by transfer_content keyword)
      if (platformFilter) {
        const content = (t.transfer_content || '').toLowerCase()
        const va = t.va_account.toLowerCase()
        if (!content.includes(platformFilter) && !va.includes(platformFilter)) return false
      }

      // Search
      if (search) {
        const q = search.toLowerCase()
        if (!t.va_account.toLowerCase().includes(q) &&
            !t.hpay_transaction_id.toLowerCase().includes(q) &&
            !(t.transfer_content || '').toLowerCase().includes(q)) return false
      }

      return true
    })
  }, [transactions, timeRange, customStart, customEnd, platformFilter, statusFilter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Stats — all use net_amount (seller thực nhận)
  const successItems = filtered.filter(t => t.status === 'completed')
  const pendingItems = filtered.filter(t => t.status === 'pending' || t.status === 'processing')
  const failedItems = filtered.filter(t => t.status === 'failed')
  const successNet = successItems.reduce((s, t) => s + Number(t.net_amount), 0)
  const pendingNet = pendingItems.reduce((s, t) => s + Number(t.net_amount), 0)
  const failedNet = failedItems.reduce((s, t) => s + Number(t.net_amount), 0)
  const totalNet = filtered.reduce((s, t) => s + Number(t.net_amount), 0)

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

  function formatDate(d: string) {
    const date = new Date(d)
    return {
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    }
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleExport() {
    const headers = [t('export_tx_id'), 'VA', t('export_amount'), t('export_fee'), t('export_net'), t('export_content'), t('export_status'), t('export_time')]
    const rows = filtered.map(t => [
      t.hpay_transaction_id, t.va_account, t.amount, t.fee, t.net_amount,
      t.transfer_content || '', STATUS_STYLES[t.status]?.label || t.status,
      new Date(t.time_paid).toLocaleString('vi-VN'),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zoxi-va-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasFilters = search || platformFilter || statusFilter || timeRange === 'custom'

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">{t('va_transactions_title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('va_transactions_subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0} className="gap-2 shrink-0 self-start sm:self-auto">
          <Download className="size-4" /> {t('download_report')}
        </Button>
      </div>

      {/* Summary — 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-5">
          <p className="text-xs text-green-600 font-medium mb-1.5">{t('deposit_success')} ({successItems.length})</p>
          <p className="text-xl font-bold text-green-700">{formatVND(successNet)} <span className="text-xs font-normal">VND</span></p>
        </div>
        <div className="bg-amber-50 rounded-xl p-5">
          <p className="text-xs text-amber-600 font-medium mb-1.5">{t('processing')} ({pendingItems.length})</p>
          <p className="text-xl font-bold text-amber-700">{formatVND(pendingNet)} <span className="text-xs font-normal">VND</span></p>
        </div>
        <div className="bg-red-50 rounded-xl p-5">
          <p className="text-xs text-red-600 font-medium mb-1.5">{t('deposit_failed')} ({failedItems.length})</p>
          <p className="text-xl font-bold text-red-700">{formatVND(failedNet)} <span className="text-xs font-normal">VND</span></p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-xs text-gray-500 font-medium mb-1.5">{t('total_deposit')} ({filtered.length})</p>
          <p className="text-xl font-bold text-gray-700">{formatVND(totalNet)} <span className="text-xs font-normal">VND</span></p>
        </div>
      </div>

      {/* Time range */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Calendar className="size-4 text-gray-400" />
        {TIME_RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => { setTimeRange(r.key); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeRange === r.key
                ? 'bg-[#FF5942] text-white'
                : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Custom date + platform + search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {timeRange === 'custom' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setPage(1) }} className="h-10 w-[145px] text-sm" />
            <span className="text-gray-300">—</span>
            <Input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setPage(1) }} className="h-10 w-[145px] text-sm" />
          </div>
        )}

        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={(e) => { setPlatformFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[140px]"
        >
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[140px]"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder={t('search_transactions')}
            className="pl-10 h-10"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPlatformFilter(''); setStatusFilter(''); setCustomStart(''); setCustomEnd(''); setPage(1) }} className="text-gray-400 gap-1">
            <X className="size-3.5" /> {t('clear_filters')}
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} {t('transactions_count')}</p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block size-6 border-2 border-gray-300 border-t-[#FF5942] rounded-full animate-spin" />
              <p className="text-gray-400 mt-3 text-sm">{t('loading')}</p>
            </div>
          ) : paged.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>{t('transaction_id')}</TableHead>
                      <TableHead className="text-center">VA</TableHead>
                      <TableHead className="text-right">{t('amount_received')}</TableHead>
                      <TableHead className="text-right">{t('fee')}</TableHead>
                      <TableHead className="text-right">{t('net_received')}</TableHead>
                      <TableHead>{t('content')}</TableHead>
                      <TableHead>{t('time')}</TableHead>
                      <TableHead className="text-center w-[90px]">{t('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((t) => {
                      const dt = formatDate(t.time_paid)
                      const st = STATUS_STYLES[t.status] || STATUS_STYLES.completed
                      return (
                        <TableRow key={t.id} className="group hover:bg-gray-50">
                          <TableCell>
                            <div className="flex size-7 items-center justify-center rounded-full bg-green-50">
                              <ArrowDownLeft className="size-3.5 text-green-600" />
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-gray-600 max-w-[110px] truncate" title={t.hpay_transaction_id}>
                                {t.hpay_transaction_id}
                              </span>
                              <button onClick={() => copyText(t.hpay_transaction_id, t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {copiedId === t.id ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-gray-300" />}
                              </button>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <span className="font-mono text-xs">{t.va_account}</span>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className="text-sm font-bold text-gray-900">{formatVND(Number(t.amount))} VND</span>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className="text-xs text-orange-600">
                              {formatVND(Number(t.fee))}
                              <span className="text-gray-400 ml-1">({Number(t.amount) > 0 ? ((Number(t.fee) / Number(t.amount)) * 100).toFixed(1) : '0'}%)</span>
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className="text-sm font-bold text-green-600">+{formatVND(Number(t.net_amount))} VND</span>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs text-gray-500 max-w-[120px] truncate block" title={t.transfer_content || ''}>
                              {t.transfer_content || '—'}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="text-xs">
                              <span className="text-gray-700">{dt.date}</span><br />
                              <span className="text-gray-400">{dt.time}</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <span
                              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold w-[80px] text-center"
                              style={{ backgroundColor: st.bg, color: st.text }}
                            >
                              {st.label}
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
                  <span className="text-xs text-gray-400">{t('page_info').replace('{page}', String(page)).replace('{total}', String(totalPages)).replace('{count}', String(filtered.length))}</span>
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
                          className={`size-8 p-0 text-xs ${page === p ? 'bg-[#FF5942] hover:bg-[#e64d38] text-white' : ''}`}>
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
              <CircleOff className="size-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">{t('no_transactions_found')}</p>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPlatformFilter(''); setStatusFilter(''); setCustomStart(''); setCustomEnd(''); setPage(1) }} className="mt-2 text-[#FF5942]">
                  {t('clear_filters')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

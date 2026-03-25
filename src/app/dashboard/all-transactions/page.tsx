'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { VIETNAMESE_BANKS } from '@/lib/constants'
import {
  ArrowDownLeft, ArrowUpRight, Search, Download, X, Copy, Check,
  ChevronLeft, ChevronRight, CircleOff, FileSpreadsheet, FileText,
} from 'lucide-react'

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  completed: { label: 'Success', bg: '#e7f5ec', text: '#60bc7f' },
  pending: { label: 'Pending', bg: '#fef2d4', text: '#e4a508' },
  processing: { label: 'Process', bg: '#ebf5fd', text: '#309ae7' },
  failed: { label: 'Failed', bg: '#fde8ea', text: '#e91925' },
  success: { label: 'Success', bg: '#e7f5ec', text: '#60bc7f' },
  cancelled: { label: 'Cancelled', bg: '#fde8ea', text: '#e91925' },
}

type FilterTab = 'all' | 'top_up' | 'withdrawal'

interface MergedItem {
  id: string
  type: 'top_up' | 'withdrawal'
  amount: number
  fee: number
  netAmount: number
  vaAccount: string
  status: string
  date: string
  transactionId: string
  bankInfo?: string
  remark?: string
}

const PAGE_SIZE = 20

export default function AllTransactionsPage() {
  const [items, setItems] = useState<MergedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: txns } = await supabase
      .from('transactions').select('*').eq('user_id', user.id).order('time_paid', { ascending: false })
    const { data: wds } = await supabase
      .from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    const merged: MergedItem[] = [
      ...(txns || []).map((t): MergedItem => ({
        id: t.id, type: 'top_up', amount: Number(t.amount), fee: Number(t.fee),
        netAmount: Number(t.net_amount), vaAccount: t.va_account, status: t.status,
        date: t.time_paid, transactionId: t.hpay_transaction_id,
        remark: t.transfer_content || undefined,
      })),
      ...(wds || []).map((w): MergedItem => ({
        id: w.id, type: 'withdrawal', amount: Number(w.amount), fee: 0,
        netAmount: Number(w.amount), vaAccount: '',
        status: w.status, date: w.created_at,
        transactionId: (w.hpay_request_id || w.id),
        bankInfo: `${VIETNAMESE_BANKS.find(b => b.code === w.bank_name)?.name || w.bank_name} · ${w.bank_account_number}`,
        remark: w.note || undefined,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setItems(merged)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (activeTab !== 'all' && item.type !== activeTab) return false
      if (statusFilter && item.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!item.vaAccount.toLowerCase().includes(q) &&
            !item.transactionId.toLowerCase().includes(q) &&
            !(item.bankInfo || '').toLowerCase().includes(q) &&
            !(item.remark || '').toLowerCase().includes(q)) return false
      }
      if (startDate && new Date(item.date) < new Date(startDate)) return false
      if (endDate && new Date(item.date) > new Date(endDate + 'T23:59:59')) return false
      return true
    })
  }, [items, activeTab, statusFilter, search, startDate, endDate])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Stats
  const totalTopUp = filtered.filter(i => i.type === 'top_up').reduce((s, i) => s + i.amount, 0)
  const totalWithdraw = filtered.filter(i => i.type === 'withdrawal' && (i.status === 'success' || i.status === 'completed')).reduce((s, i) => s + i.amount, 0)
  const totalFee = filtered.reduce((s, i) => s + i.fee, 0)

  const formatAmount = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

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

  function exportData(format: 'csv' | 'xlsx') {
    const headers = ['ID', 'Loại', 'VA/Bank', 'Số tiền', 'Phí', 'Thực nhận', 'Trạng thái', 'Ghi chú', 'Thời gian']
    const rows = filtered.map(item => [
      item.transactionId,
      item.type === 'top_up' ? 'Top-up' : 'Withdraw',
      item.type === 'top_up' ? item.vaAccount : (item.bankInfo || ''),
      item.amount,
      item.fee,
      item.netAmount,
      STATUS_STYLES[item.status]?.label || item.status,
      item.remark || '',
      new Date(item.date).toLocaleString('vi-VN'),
    ])

    const sep = format === 'csv' ? ',' : '\t'
    const ext = format === 'csv' ? 'csv' : 'xls'
    const mime = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel'
    const content = [headers.join(sep), ...rows.map(r => r.join(sep))].join('\n')
    const blob = new Blob(['\ufeff' + content], { type: `${mime};charset=utf-8;` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zoxi-transactions-${new Date().toISOString().slice(0, 10)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  const hasFilters = search || startDate || endDate || statusFilter || activeTab !== 'all'

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: items.length },
    { key: 'top_up', label: 'Top-up', count: items.filter(i => i.type === 'top_up').length },
    { key: 'withdrawal', label: 'Withdraw', count: items.filter(i => i.type === 'withdrawal').length },
  ]

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'completed', label: 'Success' },
    { value: 'processing', label: 'Process' },
    { value: 'pending', label: 'Pending' },
    { value: 'success', label: 'Success (Withdraw)' },
    { value: 'failed', label: 'Failed' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Giao dịch</h1>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExport(!showExport)}
            disabled={filtered.length === 0}
            className="gap-2"
          >
            <Download className="size-4" />
            Tải báo cáo
          </Button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 z-20 w-48">
              <button
                onClick={() => exportData('csv')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm hover:bg-gray-50"
              >
                <FileText className="size-4 text-green-600" /> CSV
              </button>
              <button
                onClick={() => exportData('xlsx')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm hover:bg-gray-50"
              >
                <FileSpreadsheet className="size-4 text-blue-600" /> Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Tổng Top-up</p>
          <p className="text-lg font-bold text-green-700">{formatAmount(totalTopUp)} <span className="text-xs font-normal">VND</span></p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-xs text-orange-600 font-medium mb-1">Tổng Withdraw</p>
          <p className="text-lg font-bold text-orange-700">{formatAmount(totalWithdraw)} <span className="text-xs font-normal">VND</span></p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Tổng phí</p>
          <p className="text-lg font-bold text-gray-700">{formatAmount(totalFee)} <span className="text-xs font-normal">VND</span></p>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex items-center gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[#FF5942] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-white/70' : 'text-gray-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm theo VA, mã GD, bank, ghi chú..."
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
            className="h-10 w-[145px] text-sm"
          />
          <span className="text-gray-300">—</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
            className="h-10 w-[145px] text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[160px]"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch(''); setStartDate(''); setEndDate('')
              setStatusFilter(''); setActiveTab('all'); setPage(1)
            }}
            className="text-gray-400 gap-1 hover:text-gray-600"
          >
            <X className="size-3.5" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-2">{filtered.length} kết quả</p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block size-6 border-2 border-gray-300 border-t-[#FF5942] rounded-full animate-spin" />
              <p className="text-gray-400 mt-3 text-sm">Đang tải...</p>
            </div>
          ) : paged.length > 0 ? (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-[170px]">Loại</TableHead>
                    <TableHead>Mã giao dịch</TableHead>
                    <TableHead className="text-center">VA / Bank</TableHead>
                    <TableHead className="text-right">Số tiền nhận</TableHead>
                    <TableHead className="text-right">Thực nhận</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Cập nhật</TableHead>
                    <TableHead className="text-center w-[96px]">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((item) => {
                    const dt = formatDate(item.date)
                    const st = STATUS_STYLES[item.status] || STATUS_STYLES.completed
                    const isTopUp = item.type === 'top_up'
                    return (
                      <TableRow key={item.id} className="group hover:bg-gray-50/50">
                        {/* Type */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className={`flex size-8 items-center justify-center rounded-full ${
                              isTopUp ? 'bg-green-50' : 'bg-orange-50'
                            }`}>
                              {isTopUp
                                ? <ArrowDownLeft className="size-4 text-green-600" />
                                : <ArrowUpRight className="size-4 text-orange-600" />
                              }
                            </div>
                            <div>
                              <span className="text-sm font-medium">
                                {isTopUp ? 'Top-up' : 'Withdraw'}
                              </span>
                              {!isTopUp && item.bankInfo && (
                                <p className="text-[11px] text-gray-400 max-w-[110px] truncate">{item.bankInfo}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Transaction ID */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-gray-500 max-w-[100px] truncate">
                              {item.transactionId}
                            </span>
                            <button
                              onClick={() => copyText(item.transactionId, item.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedId === item.id
                                ? <Check className="size-3.5 text-green-500" />
                                : <Copy className="size-3.5 text-gray-300 hover:text-gray-500" />
                              }
                            </button>
                          </div>
                        </TableCell>

                        {/* VA / Bank */}
                        <TableCell className="text-center">
                          {item.vaAccount ? (
                            <span className="font-mono text-xs text-gray-600">{item.vaAccount}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </TableCell>

                        {/* Received amount */}
                        <TableCell className="text-right">
                          <span className={`text-sm font-semibold ${isTopUp ? 'text-green-600' : 'text-orange-600'}`}>
                            {isTopUp ? '+' : '-'}{formatAmount(item.amount)} VND
                          </span>
                        </TableCell>

                        {/* Net amount */}
                        <TableCell className="text-right">
                          <span className="text-sm font-medium">{formatAmount(item.netAmount)} VND</span>
                          {item.fee > 0 && (
                            <p className="text-[11px] text-gray-400">Phí: {formatAmount(item.fee)}</p>
                          )}
                        </TableCell>

                        {/* Remark */}
                        <TableCell>
                          <span className="text-xs text-gray-500 max-w-[100px] truncate block" title={item.remark}>
                            {item.remark || '—'}
                          </span>
                        </TableCell>

                        {/* Created date */}
                        <TableCell>
                          <div className="text-xs">
                            <span className="text-gray-700">{dt.date}</span>
                            <br />
                            <span className="text-gray-400">{dt.time}</span>
                          </div>
                        </TableCell>

                        {/* Updated date */}
                        <TableCell>
                          <div className="text-xs">
                            <span className="text-gray-700">{dt.date}</span>
                            <br />
                            <span className="text-gray-400">{dt.time}</span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center">
                          <span
                            className="inline-block px-3 py-1 rounded-full text-[11px] font-bold w-[96px] text-center"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
                  <span className="text-xs text-gray-400">
                    Trang {page}/{totalPages} · {filtered.length} giao dịch
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="size-8 p-0">
                      <ChevronLeft className="size-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let p: number
                      if (totalPages <= 7) { p = i + 1 }
                      else if (page <= 4) { p = i + 1 }
                      else if (page >= totalPages - 3) { p = totalPages - 6 + i }
                      else { p = page - 3 + i }
                      return (
                        <Button
                          key={p}
                          variant={page === p ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setPage(p)}
                          className={`size-8 p-0 text-xs ${page === p ? 'bg-[#FF5942] hover:bg-[#e64d38] text-white' : ''}`}
                        >
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
              <p className="text-gray-400 font-medium">Không có giao dịch nào</p>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch(''); setStartDate(''); setEndDate('')
                    setStatusFilter(''); setActiveTab('all'); setPage(1)
                  }}
                  className="mt-2 text-[#FF5942]"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

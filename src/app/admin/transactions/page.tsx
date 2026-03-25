'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Search, X, Download, ChevronLeft, ChevronRight, CircleOff,
  FileText, FileSpreadsheet, ArrowDownLeft, ArrowUpRight, Eye, Copy, Check,
} from 'lucide-react'
import { VIETNAMESE_BANKS } from '@/lib/constants'

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  completed: { label: 'Success', bg: '#e7f5ec', text: '#60bc7f' },
  pending: { label: 'Pending', bg: '#fef2d4', text: '#e4a508' },
  processing: { label: 'Process', bg: '#ebf5fd', text: '#309ae7' },
  failed: { label: 'Failed', bg: '#fde8ea', text: '#e91925' },
  success: { label: 'Success', bg: '#e7f5ec', text: '#60bc7f' },
}

type FilterTab = 'all' | 'top_up' | 'withdrawal'

interface MergedItem {
  id: string
  type: 'top_up' | 'withdrawal'
  sellerName: string
  sellerEmail: string
  amount: number
  fee: number
  netAmount: number
  vaAccount: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  status: string
  date: string
  transactionId: string
  hpayCashinId: string
  hpayOrderId: string
  transferContent: string
  note: string
}

const PAGE_SIZE = 20
const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

export default function AdminTransactionsPage() {
  const [items, setItems] = useState<MergedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [showExport, setShowExport] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MergedItem | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [{ data: txns }, { data: wds }] = await Promise.all([
      supabase.from('transactions').select('*, profiles(email, full_name)').order('time_paid', { ascending: false }),
      supabase.from('withdrawals').select('*, profiles(email, full_name)').order('created_at', { ascending: false }),
    ])

    const merged: MergedItem[] = [
      ...(txns || []).map((t: Record<string, unknown>): MergedItem => ({
        id: t.id as string,
        type: 'top_up',
        sellerName: (t.profiles as Record<string, string>)?.full_name || 'N/A',
        sellerEmail: (t.profiles as Record<string, string>)?.email || 'N/A',
        amount: Number(t.amount),
        fee: Number(t.fee),
        netAmount: Number(t.net_amount),
        vaAccount: t.va_account as string,
        bankName: '', bankAccountNumber: '', bankAccountName: '',
        status: t.status as string,
        date: t.time_paid as string,
        transactionId: (t.hpay_transaction_id || t.id) as string,
        hpayCashinId: (t.hpay_cashin_id || '') as string,
        hpayOrderId: (t.hpay_order_id || '') as string,
        transferContent: (t.transfer_content || '') as string,
        note: '',
      })),
      ...(wds || []).map((w: Record<string, unknown>): MergedItem => ({
        id: w.id as string,
        type: 'withdrawal',
        sellerName: (w.profiles as Record<string, string>)?.full_name || 'N/A',
        sellerEmail: (w.profiles as Record<string, string>)?.email || 'N/A',
        amount: Number(w.amount),
        fee: 0,
        netAmount: Number(w.amount),
        vaAccount: '',
        bankName: w.bank_name as string,
        bankAccountNumber: w.bank_account_number as string,
        bankAccountName: w.bank_account_name as string,
        status: w.status as string,
        date: w.created_at as string,
        transactionId: (w.hpay_request_id || w.id) as string,
        hpayCashinId: (w.hpay_cashout_id || '') as string,
        hpayOrderId: (w.hpay_transaction_id || '') as string,
        transferContent: '',
        note: (w.note || '') as string,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setItems(merged)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (activeTab !== 'all' && item.type !== activeTab) return false
      if (statusFilter && item.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!item.sellerEmail.toLowerCase().includes(q) &&
            !item.sellerName.toLowerCase().includes(q) &&
            !item.vaAccount.toLowerCase().includes(q) &&
            !item.transactionId.toLowerCase().includes(q) &&
            !item.bankAccountNumber.includes(q) &&
            !item.bankName.toLowerCase().includes(q)) return false
      }
      if (startDate && new Date(item.date) < new Date(startDate)) return false
      if (endDate && new Date(item.date) > new Date(endDate + 'T23:59:59')) return false
      return true
    })
  }, [items, activeTab, statusFilter, search, startDate, endDate])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalVolume = filtered.filter(i => i.type === 'top_up').reduce((s, i) => s + i.amount, 0)
  const totalFees = filtered.reduce((s, i) => s + i.fee, 0)
  const totalWithdrawals = filtered.filter(i => i.type === 'withdrawal' && (i.status === 'success' || i.status === 'completed')).reduce((s, i) => s + i.amount, 0)

  const hasFilters = search || startDate || endDate || statusFilter || activeTab !== 'all'

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: items.length },
    { key: 'top_up', label: 'Top-up', count: items.filter(i => i.type === 'top_up').length },
    { key: 'withdrawal', label: 'Rút tiền', count: items.filter(i => i.type === 'withdrawal').length },
  ]

  function exportData(format: 'csv' | 'xlsx') {
    const headers = ['Ngày', 'Seller', 'Loại', 'Mã GD', 'VA/Bank', 'Số tiền', 'Phí', 'Thực nhận', 'Trạng thái', 'Ghi chú']
    const rows = filtered.map(item => [
      new Date(item.date).toLocaleString('vi-VN'),
      item.sellerEmail,
      item.type === 'top_up' ? 'Top-up' : 'Rút tiền',
      item.transactionId,
      item.type === 'top_up' ? item.vaAccount : `${item.bankName} - ${item.bankAccountNumber}`,
      item.amount, item.fee, item.netAmount,
      STATUS_STYLES[item.status]?.label || item.status,
      item.transferContent || item.note || '',
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

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">Tất cả giao dịch</h1>
          <p className="text-gray-500 text-sm">Theo dõi toàn bộ giao dịch trên hệ thống.</p>
        </div>
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setShowExport(!showExport)} disabled={filtered.length === 0} className="gap-2">
            <Download className="size-4" /> Tải báo cáo
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Tổng Volume</p>
          <p className="text-lg font-bold text-green-700">{formatVND(totalVolume)} <span className="text-xs font-normal">VND</span></p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-red-600 font-medium mb-1">Doanh thu ZOXI (Phí)</p>
          <p className="text-lg font-bold text-red-700">{formatVND(totalFees)} <span className="text-xs font-normal">VND</span></p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-xs text-orange-600 font-medium mb-1">Tổng Rút tiền</p>
          <p className="text-lg font-bold text-orange-700">{formatVND(totalWithdrawals)} <span className="text-xs font-normal">VND</span></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {tab.label}
            <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-white/70' : 'text-gray-400'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm theo email, tên seller, mã GD, VA, STK..." className="pl-10 h-12" />
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} className="h-12 w-[145px] text-sm" />
          <span className="text-gray-300">—</span>
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} className="h-12 w-[145px] text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[160px]">
          <option value="">Tất cả trạng thái</option>
          <option value="completed">Success</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="success">Success (Withdraw)</option>
          <option value="failed">Failed</option>
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm"
            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setStatusFilter(''); setActiveTab('all'); setPage(1) }}
            className="text-gray-400 gap-1 hover:text-gray-600">
            <X className="size-3.5" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} kết quả</p>

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
                      <TableHead>Loại</TableHead>
                      <TableHead>Mã giao dịch</TableHead>
                      <TableHead>VA / Ngân hàng</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead className="text-right">Phí</TableHead>
                      <TableHead className="text-center w-[86px]">Trạng thái</TableHead>
                      <TableHead className="text-center w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((item) => {
                      const st = STATUS_STYLES[item.status] || STATUS_STYLES.completed
                      const isTopUp = item.type === 'top_up'
                      const bankLabel = VIETNAMESE_BANKS.find(b => b.code === item.bankName)?.name || item.bankName
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelectedItem(item)}>
                          <TableCell>
                            <div className="text-xs">
                              <span className="text-gray-700">{new Date(item.date).toLocaleDateString('vi-VN')}</span><br />
                              <span className="text-gray-400">{new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{item.sellerName}</p>
                              <p className="text-xs text-gray-400">{item.sellerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`flex size-7 items-center justify-center rounded-full ${isTopUp ? 'bg-green-50' : 'bg-orange-50'}`}>
                                {isTopUp ? <ArrowDownLeft className="size-3.5 text-green-600" /> : <ArrowUpRight className="size-3.5 text-orange-600" />}
                              </div>
                              <span className="text-sm font-medium">{isTopUp ? 'Top-up' : 'Rút tiền'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-gray-500 max-w-[120px] truncate block" title={item.transactionId}>
                              {item.transactionId}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isTopUp ? (
                              <div>
                                <p className="font-mono text-xs">{item.vaAccount}</p>
                                <p className="text-[10px] text-gray-400">VA · BIDV</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs font-medium">{bankLabel}</p>
                                <p className="font-mono text-[10px] text-gray-400">{item.bankAccountNumber}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-sm font-semibold ${isTopUp ? 'text-green-600' : 'text-orange-600'}`}>
                              {isTopUp ? '+' : '-'}{formatVND(item.amount)} VND
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.fee > 0 ? (
                              <span className="text-sm text-red-600">{formatVND(item.fee)}</span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold w-[80px] text-center"
                              style={{ backgroundColor: st.bg, color: st.text }}>
                              {st.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={(e) => { e.stopPropagation(); setSelectedItem(item) }}>
                              <Eye className="size-3.5 text-gray-400" />
                            </Button>
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
              <CircleOff className="size-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Không có giao dịch nào.</p>
              {hasFilters && (
                <Button variant="ghost" size="sm"
                  onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setStatusFilter(''); setActiveTab('all'); setPage(1) }}
                  className="mt-2 text-red-600">
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Slideover */}
      {selectedItem && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedItem(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-[580px] bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-semibold">Chi tiết giao dịch</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex size-6 items-center justify-center rounded-full ${
                    selectedItem.type === 'top_up' ? 'bg-green-50' : 'bg-orange-50'
                  }`}>
                    {selectedItem.type === 'top_up'
                      ? <ArrowDownLeft className="size-3 text-green-600" />
                      : <ArrowUpRight className="size-3 text-orange-600" />
                    }
                  </div>
                  <span className="text-sm font-medium">{selectedItem.type === 'top_up' ? 'Top-up' : 'Rút tiền'}</span>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: (STATUS_STYLES[selectedItem.status] || STATUS_STYLES.completed).bg,
                      color: (STATUS_STYLES[selectedItem.status] || STATUS_STYLES.completed).text,
                    }}
                  >
                    {(STATUS_STYLES[selectedItem.status] || STATUS_STYLES.completed).label}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                <X className="size-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Amount highlight */}
              <div className="text-center py-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Số tiền</p>
                <p className={`text-3xl font-bold ${selectedItem.type === 'top_up' ? 'text-green-600' : 'text-orange-600'}`}>
                  {selectedItem.type === 'top_up' ? '+' : '-'}{formatVND(selectedItem.amount)} VND
                </p>
                {selectedItem.fee > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Phí: <span className="text-red-600 font-medium">{formatVND(selectedItem.fee)} VND</span>
                    {' · '}Thực nhận: <span className="font-medium">{formatVND(selectedItem.netAmount)} VND</span>
                  </p>
                )}
              </div>

              <Separator />

              {/* Transaction IDs */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Mã giao dịch</h3>
                <div className="space-y-3">
                  <DetailCopyRow label="Mã GD (Hpay)" value={selectedItem.transactionId} field="txn-id" copiedField={copiedField} onCopy={copyText} />
                  {selectedItem.hpayCashinId && (
                    <DetailCopyRow
                      label={selectedItem.type === 'top_up' ? 'Cashin ID' : 'Cashout ID'}
                      value={selectedItem.hpayCashinId}
                      field="cashin-id"
                      copiedField={copiedField}
                      onCopy={copyText}
                    />
                  )}
                  {selectedItem.hpayOrderId && (
                    <DetailCopyRow
                      label={selectedItem.type === 'top_up' ? 'Order ID' : 'Hpay TX ID'}
                      value={selectedItem.hpayOrderId}
                      field="order-id"
                      copiedField={copiedField}
                      onCopy={copyText}
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Seller info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông tin Seller</h3>
                <div className="space-y-2">
                  <DetailRow label="Họ tên" value={selectedItem.sellerName} />
                  <DetailRow label="Email" value={selectedItem.sellerEmail} />
                </div>
              </div>

              <Separator />

              {/* Source / Destination */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {selectedItem.type === 'top_up' ? 'Nguồn nhận' : 'Nguồn rút'}
                </h3>
                <div className="space-y-2">
                  {selectedItem.type === 'top_up' ? (
                    <>
                      <DetailCopyRow label="Tài khoản VA" value={selectedItem.vaAccount} field="va-acc" copiedField={copiedField} onCopy={copyText} />
                      <DetailRow label="Ngân hàng" value="BIDV" />
                    </>
                  ) : (
                    <>
                      <DetailRow label="Ngân hàng" value={VIETNAMESE_BANKS.find(b => b.code === selectedItem.bankName)?.name || selectedItem.bankName} />
                      <DetailCopyRow label="Số tài khoản" value={selectedItem.bankAccountNumber} field="bank-acc" copiedField={copiedField} onCopy={copyText} />
                      <DetailRow label="Chủ tài khoản" value={selectedItem.bankAccountName} />
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chi tiết</h3>
                <div className="space-y-2">
                  <DetailRow label="Thời gian" value={new Date(selectedItem.date).toLocaleString('vi-VN')} />
                  <DetailRow label="Số tiền" value={`${formatVND(selectedItem.amount)} VND`} />
                  {selectedItem.fee > 0 && <DetailRow label="Phí ZOXI" value={`${formatVND(selectedItem.fee)} VND`} highlight="text-red-600" />}
                  {selectedItem.fee > 0 && <DetailRow label="Seller nhận" value={`${formatVND(selectedItem.netAmount)} VND`} highlight="text-green-600 font-semibold" />}
                  {selectedItem.transferContent && <DetailRow label="Nội dung CK" value={selectedItem.transferContent} />}
                  {selectedItem.note && <DetailRow label="Ghi chú" value={selectedItem.note} />}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-right ${highlight || 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

function DetailCopyRow({ label, value, field, copiedField, onCopy }: {
  label: string; value: string; field: string; copiedField: string | null; onCopy: (text: string, field: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-mono text-gray-900 max-w-[200px] truncate" title={value}>{value}</span>
        <button onClick={() => onCopy(value, field)} className="shrink-0">
          {copiedField === field
            ? <Check className="size-3.5 text-green-500" />
            : <Copy className="size-3.5 text-gray-300 hover:text-gray-500" />
          }
        </button>
      </div>
    </div>
  )
}

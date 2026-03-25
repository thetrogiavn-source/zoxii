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
  Search, X, ArrowUpFromLine, ChevronLeft, ChevronRight, Eye, Copy, Check,
  Download, FileText, FileSpreadsheet, Clock, CheckCircle, XCircle,
} from 'lucide-react'
import { VIETNAMESE_BANKS } from '@/lib/constants'

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; Icon: typeof Clock }> = {
  processing: { label: 'Đang xử lý', bg: '#ebf5fd', text: '#309ae7', Icon: Clock },
  success: { label: 'Thành công', bg: '#e7f5ec', text: '#60bc7f', Icon: CheckCircle },
  failed: { label: 'Thất bại', bg: '#fde8ea', text: '#e91925', Icon: XCircle },
}

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  status: string
  hpay_request_id: string | null
  hpay_transaction_id: string | null
  hpay_cashout_id: string | null
  note: string | null
  created_at: string
  updated_at: string
  profiles: { email: string; full_name: string | null } | null
}

type StatusTab = 'all' | 'processing' | 'success' | 'failed'
const PAGE_SIZE = 20
const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

export default function WithdrawalsPage() {
  const [items, setItems] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [actionProcessing, setActionProcessing] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Withdrawal | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('withdrawals')
      .select('*, profiles(email, full_name)')
      .order('created_at', { ascending: false })
    if (data) setItems(data as unknown as Withdrawal[])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function markStatus(id: string, newStatus: 'success' | 'failed') {
    setActionProcessing(id)
    try {
      const res = await fetch('/api/admin/withdrawal-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        alert(json.error || 'Lỗi cập nhật trạng thái')
      }
    } catch {
      alert('Lỗi kết nối')
    }
    setActionProcessing(null)
    loadData()
    if (selectedItem?.id === id) {
      setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const counts = useMemo(() => ({
    all: items.length,
    processing: items.filter(i => i.status === 'processing').length,
    success: items.filter(i => i.status === 'success').length,
    failed: items.filter(i => i.status === 'failed').length,
  }), [items])

  const totalAmount = useMemo(() => ({
    processing: items.filter(i => i.status === 'processing').reduce((s, i) => s + Number(i.amount), 0),
    success: items.filter(i => i.status === 'success').reduce((s, i) => s + Number(i.amount), 0),
    failed: items.filter(i => i.status === 'failed').reduce((s, i) => s + Number(i.amount), 0),
  }), [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (activeTab !== 'all' && item.status !== activeTab) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(item.profiles?.email || '').toLowerCase().includes(q) &&
            !(item.profiles?.full_name || '').toLowerCase().includes(q) &&
            !item.bank_account_number.includes(q) &&
            !(item.hpay_request_id || '').toLowerCase().includes(q) &&
            !item.bank_account_name.toLowerCase().includes(q)) return false
      }
      if (startDate && new Date(item.created_at) < new Date(startDate)) return false
      if (endDate && new Date(item.created_at) > new Date(endDate + 'T23:59:59')) return false
      return true
    })
  }, [items, activeTab, search, startDate, endDate])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || startDate || endDate || activeTab !== 'all'

  const tabs: { key: StatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: counts.all },
    { key: 'processing', label: 'Đang xử lý', count: counts.processing },
    { key: 'success', label: 'Thành công', count: counts.success },
    { key: 'failed', label: 'Thất bại', count: counts.failed },
  ]

  function exportData(format: 'csv' | 'xlsx') {
    const headers = ['Ngày', 'Seller', 'Email', 'Số tiền', 'Ngân hàng', 'STK', 'Chủ TK', 'Trạng thái', 'Mã GD', 'Ghi chú']
    const rows = filtered.map(item => [
      new Date(item.created_at).toLocaleString('vi-VN'),
      item.profiles?.full_name || '', item.profiles?.email || '',
      item.amount,
      VIETNAMESE_BANKS.find(b => b.code === item.bank_name)?.name || item.bank_name,
      item.bank_account_number, item.bank_account_name,
      STATUS_STYLES[item.status]?.label || item.status,
      item.hpay_request_id || '', item.note || '',
    ])
    const sep = format === 'csv' ? ',' : '\t'
    const ext = format === 'csv' ? 'csv' : 'xls'
    const mime = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel'
    const content = [headers.join(sep), ...rows.map(r => r.join(sep))].join('\n')
    const blob = new Blob(['\ufeff' + content], { type: `${mime};charset=utf-8;` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zoxi-withdrawals-${new Date().toISOString().slice(0, 10)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">Quản lý rút tiền</h1>
          <p className="text-gray-500 text-sm">Theo dõi và xử lý yêu cầu rút tiền của seller.</p>
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
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Đang xử lý ({counts.processing})</p>
          <p className="text-lg font-bold text-blue-700">{formatVND(totalAmount.processing)} <span className="text-xs font-normal">VND</span></p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Thành công ({counts.success})</p>
          <p className="text-lg font-bold text-green-700">{formatVND(totalAmount.success)} <span className="text-xs font-normal">VND</span></p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-red-600 font-medium mb-1">Thất bại ({counts.failed})</p>
          <p className="text-lg font-bold text-red-700">{formatVND(totalAmount.failed)} <span className="text-xs font-normal">VND</span></p>
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
            placeholder="Tìm theo email, tên, STK, mã GD, chủ TK..." className="pl-10 h-12" />
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} className="h-12 w-[145px] text-sm" />
          <span className="text-gray-300">—</span>
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} className="h-12 w-[145px] text-sm" />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm"
            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setActiveTab('all'); setPage(1) }}
            className="text-gray-400 gap-1 hover:text-gray-600">
            <X className="size-3.5" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} yêu cầu</p>

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
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead>Ngân hàng</TableHead>
                      <TableHead>Mã GD</TableHead>
                      <TableHead className="text-center w-[96px]">Trạng thái</TableHead>
                      <TableHead className="text-center w-[200px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((item) => {
                      const st = STATUS_STYLES[item.status] || STATUS_STYLES.processing
                      const bankLabel = VIETNAMESE_BANKS.find(b => b.code === item.bank_name)?.name || item.bank_name
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelectedItem(item)}>
                          <TableCell>
                            <div className="text-xs">
                              <span className="text-gray-700">{new Date(item.created_at).toLocaleDateString('vi-VN')}</span><br />
                              <span className="text-gray-400">{new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{item.profiles?.full_name || 'N/A'}</p>
                              <p className="text-xs text-gray-400">{item.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold text-orange-600">{formatVND(Number(item.amount))} VND</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{bankLabel}</p>
                              <p className="font-mono text-[10px] text-gray-400">{item.bank_account_number}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-gray-500 max-w-[100px] truncate block" title={item.hpay_request_id || ''}>
                              {item.hpay_request_id || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold w-[90px] text-center"
                              style={{ backgroundColor: st.bg, color: st.text }}>
                              {st.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-1 justify-center">
                              {item.status === 'processing' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); markStatus(item.id, 'success') }}
                                    disabled={actionProcessing === item.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
                                  >
                                    <CheckCircle className="size-3" /> Duyệt
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); markStatus(item.id, 'failed') }}
                                    disabled={actionProcessing === item.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                                  >
                                    <XCircle className="size-3" /> Từ chối
                                  </button>
                                </>
                              )}
                              <Button variant="ghost" size="sm" className="size-7 p-0" onClick={(e) => { e.stopPropagation(); setSelectedItem(item) }}>
                                <Eye className="size-3.5 text-gray-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
                  <span className="text-xs text-gray-400">Trang {page}/{totalPages} · {filtered.length} yêu cầu</span>
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
              <ArrowUpFromLine className="size-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Không có yêu cầu rút tiền nào.</p>
              {hasFilters && (
                <Button variant="ghost" size="sm"
                  onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setActiveTab('all'); setPage(1) }}
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
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-semibold">Chi tiết rút tiền</h2>
                <span
                  className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: (STATUS_STYLES[selectedItem.status] || STATUS_STYLES.processing).bg,
                    color: (STATUS_STYLES[selectedItem.status] || STATUS_STYLES.processing).text,
                  }}
                >
                  {(STATUS_STYLES[selectedItem.status] || STATUS_STYLES.processing).label}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                <X className="size-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Amount */}
              <div className="text-center py-4 bg-orange-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Số tiền rút</p>
                <p className="text-3xl font-bold text-orange-600">{formatVND(Number(selectedItem.amount))} VND</p>
              </div>

              {/* Action buttons for processing */}
              {selectedItem.status === 'processing' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => markStatus(selectedItem.id, 'success')}
                    disabled={actionProcessing === selectedItem.id}
                    className="flex-1 h-12 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="size-4" />
                    {actionProcessing === selectedItem.id ? 'Đang xử lý...' : 'Duyệt thành công'}
                  </button>
                  <button
                    onClick={() => markStatus(selectedItem.id, 'failed')}
                    disabled={actionProcessing === selectedItem.id}
                    className="flex-1 h-12 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="size-4" />
                    {actionProcessing === selectedItem.id ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                </div>
              )}

              <Separator />

              {/* Mã giao dịch */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Mã giao dịch</h3>
                <div className="space-y-3">
                  {selectedItem.hpay_request_id && (
                    <CopyRow label="Mã yêu cầu" value={selectedItem.hpay_request_id} field="req-id" copiedField={copiedField} onCopy={copyText} />
                  )}
                  {selectedItem.hpay_transaction_id && (
                    <CopyRow label="Hpay TX ID" value={selectedItem.hpay_transaction_id} field="tx-id" copiedField={copiedField} onCopy={copyText} />
                  )}
                  {selectedItem.hpay_cashout_id && (
                    <CopyRow label="Cashout ID" value={selectedItem.hpay_cashout_id} field="co-id" copiedField={copiedField} onCopy={copyText} />
                  )}
                  {!selectedItem.hpay_request_id && !selectedItem.hpay_transaction_id && (
                    <p className="text-sm text-gray-400">Chưa có mã giao dịch từ Hpay</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Seller */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông tin Seller</h3>
                <div className="space-y-2">
                  <InfoRow label="Họ tên" value={selectedItem.profiles?.full_name || 'N/A'} />
                  <InfoRow label="Email" value={selectedItem.profiles?.email || 'N/A'} />
                </div>
              </div>

              <Separator />

              {/* Bank */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông tin ngân hàng</h3>
                <div className="space-y-2">
                  <InfoRow label="Ngân hàng" value={VIETNAMESE_BANKS.find(b => b.code === selectedItem.bank_name)?.name || selectedItem.bank_name} />
                  <CopyRow label="Số tài khoản" value={selectedItem.bank_account_number} field="bank-acc" copiedField={copiedField} onCopy={copyText} />
                  <InfoRow label="Chủ tài khoản" value={selectedItem.bank_account_name} />
                </div>
              </div>

              <Separator />

              {/* Timestamps */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thời gian</h3>
                <div className="space-y-2">
                  <InfoRow label="Ngày tạo" value={new Date(selectedItem.created_at).toLocaleString('vi-VN')} />
                  <InfoRow label="Cập nhật" value={new Date(selectedItem.updated_at).toLocaleString('vi-VN')} />
                </div>
              </div>

              {/* Note */}
              {selectedItem.note && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ghi chú</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedItem.note}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  )
}

function CopyRow({ label, value, field, copiedField, onCopy }: {
  label: string; value: string; field: string; copiedField: string | null; onCopy: (t: string, f: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-mono text-gray-900 max-w-[200px] truncate" title={value}>{value}</span>
        <button onClick={() => onCopy(value, field)} className="shrink-0">
          {copiedField === field ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-gray-300 hover:text-gray-500" />}
        </button>
      </div>
    </div>
  )
}

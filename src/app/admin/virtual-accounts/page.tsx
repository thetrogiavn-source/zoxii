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
import { Search, X, CreditCard, Eye, ChevronLeft, ChevronRight, Power, PowerOff, Copy, Check } from 'lucide-react'

interface VAItem {
  id: string
  va_account: string
  va_name: string
  va_bank: string | null
  va_status: number // 1=active, 0=inactive
  va_type: string
  qr_code: string | null
  quick_link: string | null
  hpay_request_id: string
  created_at: string
  updated_at: string
  user_id: string
  profiles: { email: string; full_name: string | null } | null
}

const STATUS_MAP: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: 'Active', bg: '#e7f5ec', text: '#60bc7f' },
  2: { label: 'Active', bg: '#e7f5ec', text: '#60bc7f' },
  0: { label: 'Inactive', bg: '#fef2d4', text: '#e4a508' },
  3: { label: 'Expired', bg: '#f3f4f6', text: '#6b7280' },
  4: { label: 'Expired', bg: '#f3f4f6', text: '#6b7280' },
}

type StatusTab = 'all' | 'active' | 'inactive'
const PAGE_SIZE = 20

export default function VirtualAccountsPage() {
  const [items, setItems] = useState<VAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [bankFilter, setBankFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedVA, setSelectedVA] = useState<VAItem | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('virtual_accounts')
      .select('*, profiles(email, full_name)')
      .order('created_at', { ascending: false })
    if (data) setItems(data as unknown as VAItem[])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function toggleVAStatus(va: VAItem) {
    setProcessing(va.id)
    const newStatus = (va.va_status === 1 || va.va_status === 2) ? 0 : 1
    try {
      const res = await fetch('/api/admin/va-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: va.id, va_status: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        alert(json.error || 'Lỗi cập nhật trạng thái')
      }
    } catch {
      alert('Lỗi kết nối')
    }
    setProcessing(null)
    loadData()
    // Update selected VA if open
    if (selectedVA?.id === va.id) {
      setSelectedVA({ ...va, va_status: (va.va_status === 1 || va.va_status === 2) ? 0 : 1 })
    }
  }

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  function isActive(va: VAItem) {
    return va.va_status === 1 || va.va_status === 2
  }

  const banks = useMemo(() => {
    const set = new Set(items.map(i => i.va_bank).filter(Boolean))
    return Array.from(set).sort()
  }, [items])

  const counts = useMemo(() => ({
    all: items.length,
    active: items.filter(i => isActive(i)).length,
    inactive: items.filter(i => !isActive(i)).length,
  }), [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (activeTab === 'active' && !isActive(item)) return false
      if (activeTab === 'inactive' && isActive(item)) return false
      if (bankFilter && item.va_bank !== bankFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!item.va_account.toLowerCase().includes(q) &&
            !item.va_name.toLowerCase().includes(q) &&
            !(item.profiles?.email || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [items, search, activeTab, bankFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || activeTab !== 'all' || bankFilter

  const tabs: { key: StatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'inactive', label: 'Inactive', count: counts.inactive },
  ]

  return (
    <div className="relative">
      <h1 className="text-2xl font-bold mb-1">Virtual Accounts</h1>
      <p className="text-gray-500 mb-6 text-sm">Quản lý tất cả tài khoản ảo trên hệ thống.</p>

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
            placeholder="Tìm theo số VA, tên VA, email seller..." className="pl-10 h-12" />
        </div>
        <select value={bankFilter} onChange={(e) => { setBankFilter(e.target.value); setPage(1) }}
          className="h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[140px]">
          <option value="">Tất cả ngân hàng</option>
          {banks.map(b => <option key={b} value={b!}>{b}</option>)}
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm"
            onClick={() => { setSearch(''); setActiveTab('all'); setBankFilter(''); setPage(1) }}
            className="text-gray-400 gap-1 hover:text-gray-600">
            <X className="size-3.5" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} VA</p>

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
                      <TableHead>Số VA</TableHead>
                      <TableHead>Tên VA</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Ngân hàng</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-center w-[180px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((item) => {
                      const st = STATUS_MAP[item.va_status] || STATUS_MAP[0]
                      const active = isActive(item)
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-mono text-sm">{item.va_account}</TableCell>
                          <TableCell className="text-sm font-medium">{item.va_name}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{item.profiles?.full_name || 'N/A'}</p>
                              <p className="text-xs text-gray-400">{item.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{item.va_bank || 'BIDV'}</TableCell>
                          <TableCell className="text-center">
                            <span
                              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: st.bg, color: st.text }}
                            >
                              {st.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleVAStatus(item) }}
                                disabled={processing === item.id}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-50 ${
                                  active
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                                title={active ? 'Vô hiệu hóa VA' : 'Kích hoạt VA'}
                              >
                                {active ? <PowerOff className="size-3" /> : <Power className="size-3" />}
                                {processing === item.id ? '...' : active ? 'Inactive' : 'Active'}
                              </button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 p-0"
                                onClick={(e) => { e.stopPropagation(); setSelectedVA(item) }}
                              >
                                <Eye className="size-4" />
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
                  <span className="text-xs text-gray-400">Trang {page}/{totalPages} · {filtered.length} VA</span>
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
              <CreditCard className="size-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Không có VA nào.</p>
              {hasFilters && (
                <Button variant="ghost" size="sm"
                  onClick={() => { setSearch(''); setActiveTab('all'); setBankFilter(''); setPage(1) }}
                  className="mt-2 text-red-600">
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail slideover */}
      {selectedVA && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedVA(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-[580px] bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-semibold">Chi tiết Virtual Account</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedVA.va_account}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVA(null)}>
                <X className="size-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Status + action */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: (STATUS_MAP[selectedVA.va_status] || STATUS_MAP[0]).bg,
                      color: (STATUS_MAP[selectedVA.va_status] || STATUS_MAP[0]).text,
                    }}
                  >
                    {(STATUS_MAP[selectedVA.va_status] || STATUS_MAP[0]).label}
                  </span>
                </div>
                <button
                  onClick={() => toggleVAStatus(selectedVA)}
                  disabled={processing === selectedVA.id}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    isActive(selectedVA)
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isActive(selectedVA) ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                  {processing === selectedVA.id
                    ? 'Đang xử lý...'
                    : isActive(selectedVA)
                      ? 'Vô hiệu hóa'
                      : 'Kích hoạt'
                  }
                </button>
              </div>

              <Separator />

              {/* Info grid */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Số tài khoản</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-medium">{selectedVA.va_account}</p>
                    <button onClick={() => copyText(selectedVA.va_account, 'va-number')}>
                      {copiedField === 'va-number' ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-gray-400 hover:text-gray-600" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Tên VA</p>
                  <p className="text-sm font-medium">{selectedVA.va_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ngân hàng</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{selectedVA.va_bank || 'BIDV'}</p>
                      <button onClick={() => copyText(selectedVA.va_bank || 'BIDV', 'va-bank')}>
                        {copiedField === 'va-bank' ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-gray-400 hover:text-gray-600" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Loại VA</p>
                    <p className="text-sm">{selectedVA.va_type === '2' ? 'Nhiều lần' : 'Một lần'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-gray-500 mb-1">Seller</p>
                  <p className="text-sm font-medium">{selectedVA.profiles?.full_name || 'N/A'}</p>
                  <p className="text-xs text-gray-400">{selectedVA.profiles?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ngày tạo</p>
                    <p className="text-sm">{new Date(selectedVA.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cập nhật lần cuối</p>
                    <p className="text-sm">{new Date(selectedVA.updated_at).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Hpay Request ID</p>
                  <p className="text-sm font-mono text-gray-600">{selectedVA.hpay_request_id}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

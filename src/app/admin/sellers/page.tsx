'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, X, Users, Download, Eye, ChevronLeft, ChevronRight, FileText, FileSpreadsheet } from 'lucide-react'
import { KYC_STATUS_LABELS } from '@/lib/constants'

const KYC_STYLES: Record<string, { bg: string; text: string }> = {
  none: { bg: '#f3f4f6', text: '#6b7280' },
  pending: { bg: '#fef2d4', text: '#e4a508' },
  approved: { bg: '#e7f5ec', text: '#60bc7f' },
  rejected: { bg: '#fde8ea', text: '#e91925' },
}

const TIER_STYLES: Record<string, { bg: string; text: string }> = {
  FREE: { bg: '#f3f4f6', text: '#6b7280' },
  PRO: { bg: '#FFF0EE', text: '#FF5942' },
  ENTERPRISE: { bg: '#f3e8ff', text: '#7c3aed' },
}

interface Seller {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  kyc_status: string
  tier: string
  created_at: string
  va_count?: number
  total_volume?: number
}

interface VA {
  id: string
  va_account: string
  va_name: string
  bank_name: string
  status: string
}

interface Transaction {
  id: string
  amount: number
  fee: number
  va_account: string
  time_paid: string
  status: string
}

const PAGE_SIZE = 20

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [sellerVAs, setSellerVAs] = useState<VA[]>([])
  const [sellerTxns, setSellerTxns] = useState<Transaction[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [editTier, setEditTier] = useState('')
  const [editKyc, setEditKyc] = useState('')
  const [saving, setSaving] = useState(false)

  const loadSellers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'seller')
      .order('created_at', { ascending: false })

    if (profiles) {
      // Get VA counts and volumes
      const enriched = await Promise.all(profiles.map(async (p) => {
        const [{ count: vaCount }, { data: txns }] = await Promise.all([
          supabase.from('virtual_accounts').select('*', { count: 'exact', head: true }).eq('user_id', p.id),
          supabase.from('transactions').select('amount').eq('user_id', p.id),
        ])
        const totalVolume = txns?.reduce((s, t) => s + Number(t.amount), 0) || 0
        return { ...p, va_count: vaCount || 0, total_volume: totalVolume } as Seller
      }))
      setSellers(enriched)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadSellers() }, [loadSellers])

  async function openDetail(seller: Seller) {
    setSelectedSeller(seller)
    setEditTier(seller.tier || 'FREE')
    setEditKyc(seller.kyc_status || 'none')
    setDetailLoading(true)
    const supabase = createClient()

    const [{ data: vas }, { data: txns }] = await Promise.all([
      supabase.from('virtual_accounts').select('*').eq('user_id', seller.id).order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', seller.id).order('time_paid', { ascending: false }).limit(10),
    ])

    setSellerVAs((vas || []) as VA[])
    setSellerTxns((txns || []) as Transaction[])
    setDetailLoading(false)
  }

  async function saveSeller() {
    if (!selectedSeller) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      tier: editTier,
      kyc_status: editKyc,
    }).eq('id', selectedSeller.id)
    setSaving(false)
    setSelectedSeller(null)
    loadSellers()
  }

  const filtered = useMemo(() => {
    return sellers.filter(s => {
      if (kycFilter && s.kyc_status !== kycFilter) return false
      if (tierFilter && s.tier !== tierFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !(s.full_name || '').toLowerCase().includes(q) &&
          !s.email.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [sellers, search, kycFilter, tierFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || kycFilter || tierFilter

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

  function exportData(format: 'csv' | 'xlsx') {
    const headers = ['Họ tên', 'Email', 'Phone', 'KYC', 'Tier', 'VA Count', 'Total Volume', 'Ngày đăng ký']
    const rows = filtered.map(s => [
      s.full_name || '', s.email, s.phone || '', s.kyc_status, s.tier || 'FREE',
      s.va_count || 0, s.total_volume || 0, new Date(s.created_at).toLocaleDateString('vi-VN'),
    ])
    const sep: string = format === 'csv' ? ',' : '\t'
    const ext: string = format === 'csv' ? 'csv' : 'xls'
    const mime: string = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel'
    const content = [headers.join(sep), ...rows.map(r => r.join(sep))].join('\n')
    const blob = new Blob(['\ufeff' + content], { type: `${mime};charset=utf-8;` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zoxi-sellers-${new Date().toISOString().slice(0, 10)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">Quản lý Seller</h1>
          <p className="text-gray-500 text-sm">Quản lý tài khoản seller trên hệ thống.</p>
        </div>
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setShowExport(!showExport)} className="gap-2">
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm theo tên, email..."
            className="pl-10 h-12"
          />
        </div>
        <select
          value={kycFilter}
          onChange={(e) => { setKycFilter(e.target.value); setPage(1) }}
          className="h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[160px]"
        >
          <option value="">Tất cả KYC</option>
          <option value="none">Chưa xác minh</option>
          <option value="pending">Đang chờ</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
        <select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(1) }}
          className="h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[140px]"
        >
          <option value="">Tất cả Tier</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        {hasFilters && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setSearch(''); setKycFilter(''); setTierFilter(''); setPage(1) }}
            className="text-gray-400 gap-1 hover:text-gray-600"
          >
            <X className="size-3.5" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} seller</p>

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
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>SĐT</TableHead>
                      <TableHead className="text-center">KYC</TableHead>
                      <TableHead className="text-center">Tier</TableHead>
                      <TableHead className="text-right">VA</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead>Ngày ĐK</TableHead>
                      <TableHead className="text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((s) => {
                      const kyc = KYC_STYLES[s.kyc_status] || KYC_STYLES.none
                      const tier = TIER_STYLES[s.tier] || TIER_STYLES.FREE
                      return (
                        <TableRow key={s.id} className="cursor-pointer hover:bg-gray-50/50" onClick={() => openDetail(s)}>
                          <TableCell className="font-medium">{s.full_name || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{s.email}</TableCell>
                          <TableCell className="text-sm">{s.phone || '-'}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: kyc.bg, color: kyc.text }}>
                              {KYC_STATUS_LABELS[s.kyc_status] || s.kyc_status}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: tier.bg, color: tier.text }}>
                              {s.tier || 'FREE'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm">{s.va_count || 0}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatVND(s.total_volume || 0)}</TableCell>
                          <TableCell className="text-sm">{new Date(s.created_at).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(s) }}>
                              <Eye className="size-4" />
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
                  <span className="text-xs text-gray-400">Trang {page}/{totalPages} · {filtered.length} seller</span>
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
              <Users className="size-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Không có seller nào.</p>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setKycFilter(''); setTierFilter(''); setPage(1) }} className="mt-2 text-red-600">
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail slideover */}
      {selectedSeller && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedSeller(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-145 bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-semibold">{selectedSeller.full_name || 'N/A'}</h2>
                <p className="text-sm text-gray-500">{selectedSeller.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSeller(null)}>
                <X className="size-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {detailLoading ? (
                <div className="py-20 text-center">
                  <div className="inline-block size-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Profile info */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Thông tin tài khoản</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Họ tên</p>
                        <p className="text-sm font-medium">{selectedSeller.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{selectedSeller.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Số điện thoại</p>
                        <p className="text-sm">{selectedSeller.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Ngày đăng ký</p>
                        <p className="text-sm">{new Date(selectedSeller.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tổng Volume</p>
                        <p className="text-sm font-medium">{formatVND(selectedSeller.total_volume || 0)} VND</p>
                      </div>
                    </div>
                  </div>

                  {/* Edit tier & KYC */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Cập nhật</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Tier</label>
                        <select
                          value={editTier}
                          onChange={(e) => setEditTier(e.target.value)}
                          className="h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                        >
                          <option value="FREE">Free</option>
                          <option value="PRO">Pro</option>
                          <option value="ENTERPRISE">Enterprise</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">KYC Status</label>
                        <select
                          value={editKyc}
                          onChange={(e) => setEditKyc(e.target.value)}
                          className="h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                        >
                          <option value="none">Chưa xác minh</option>
                          <option value="pending">Đang chờ</option>
                          <option value="approved">Đã duyệt</option>
                          <option value="rejected">Từ chối</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={saveSeller}
                      disabled={saving}
                      className="mt-3 h-10 px-6 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>

                  {/* VA list */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Virtual Accounts ({sellerVAs.length})</h3>
                    {sellerVAs.length > 0 ? (
                      <div className="space-y-2">
                        {sellerVAs.map(va => (
                          <div key={va.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-mono">{va.va_account}</p>
                              <p className="text-xs text-gray-500">{va.va_name} · {va.bank_name}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              va.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {va.status === 'active' ? 'Active' : va.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Chưa có VA nào.</p>
                    )}
                  </div>

                  {/* Recent transactions */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Giao dịch gần đây</h3>
                    {sellerTxns.length > 0 ? (
                      <div className="space-y-2">
                        {sellerTxns.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{formatVND(Number(t.amount))} VND</p>
                              <p className="text-xs text-gray-500">VA: {t.va_account} · {new Date(t.time_paid).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                              Success
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Chưa có giao dịch nào.</p>
                    )}
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

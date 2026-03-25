'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, X, ShieldCheck, Eye } from 'lucide-react'

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Chờ duyệt', bg: '#fef2d4', text: '#e4a508' },
  approved: { label: 'Đã duyệt', bg: '#e7f5ec', text: '#60bc7f' },
  rejected: { label: 'Từ chối', bg: '#fde8ea', text: '#e91925' },
}

interface KycItem {
  id: string
  user_id: string
  full_name: string | null
  cccd_number: string | null
  cccd_front_url: string
  cccd_back_url: string
  selfie_url: string
  status: string
  rejection_reason: string | null
  created_at: string
  reviewed_at: string | null
  date_of_birth: string | null
  profiles: { email: string; full_name: string | null } | null
}

type TabKey = 'pending' | 'approved' | 'rejected'

export default function KycReviewPage() {
  const [submissions, setSubmissions] = useState<KycItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<KycItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      // Try API first
      const res = await fetch('/api/admin/kyc')
      if (res.ok) {
        const json = await res.json()
        if (json.data) { setSubmissions(json.data as KycItem[]); setLoading(false); return }
      }
      // Fallback: direct query (works if admin RLS is correct)
      const supabase = createClient()
      const { data } = await supabase
        .from('kyc_submissions')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false })
      if (data) setSubmissions(data as unknown as KycItem[])
    } catch (err) {
      console.error('Failed to load KYC:', err)
      // Last fallback
      const supabase = createClient()
      const { data } = await supabase
        .from('kyc_submissions')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false })
      if (data) setSubmissions(data as unknown as KycItem[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

  async function handleAction(item: KycItem, action: 'approved' | 'rejected') {
    if (action === 'rejected' && !rejectionReason.trim()) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/kyc-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kycId: item.id,
          userId: item.user_id,
          action,
          rejectionReason: action === 'rejected' ? rejectionReason : null,
        }),
      })
      if (!res.ok) {
        // Fallback: direct update
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('kyc_submissions').update({
          status: action,
          rejection_reason: action === 'rejected' ? rejectionReason : null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        }).eq('id', item.id)
        await supabase.from('profiles').update({ kyc_status: action }).eq('id', item.user_id)
      }
    } catch {
      // Fallback
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('kyc_submissions').update({
        status: action,
        rejection_reason: action === 'rejected' ? rejectionReason : null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', item.id)
      await supabase.from('profiles').update({ kyc_status: action }).eq('id', item.user_id)
    }
    setProcessing(false)
    setRejectionReason('')
    setSelectedItem(null)
    loadSubmissions()
  }

  const counts = useMemo(() => ({
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }), [submissions])

  const filtered = useMemo(() => {
    return submissions.filter(s => {
      if (s.status !== activeTab) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !(s.full_name || '').toLowerCase().includes(q) &&
          !(s.profiles?.email || '').toLowerCase().includes(q) &&
          !(s.cccd_number || '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [submissions, activeTab, search])

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending', label: 'Chờ duyệt', count: counts.pending },
    { key: 'approved', label: 'Đã duyệt', count: counts.approved },
    { key: 'rejected', label: 'Từ chối', count: counts.rejected },
  ]

  return (
    <div className="relative">
      <h1 className="text-2xl font-bold mb-1">Duyệt KYC</h1>
      <p className="text-gray-500 mb-6 text-sm">Xem xét và duyệt hồ sơ xác minh danh tính của seller.</p>

      {/* Debug info */}
      {!loading && submissions.length === 0 && (
        <div className="mb-4 bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm">
          Không tải được KYC submissions. Kiểm tra: (1) Service role key đúng trong .env.local, (2) RLS policies đã tạo, (3) Restart server sau khi đổi env.
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-red-600 text-white'
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

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, email, CCCD..."
          className="pl-10 h-12"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block size-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              <p className="text-gray-400 mt-3 text-sm">Đang tải...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số giấy tờ</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead className="text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const st = STATUS_STYLES[item.status] || STATUS_STYLES.pending
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-gray-50/50"
                        onClick={() => { setSelectedItem(item); setRejectionReason('') }}
                      >
                        <TableCell className="font-medium">{item.full_name || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{item.profiles?.email || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-xs">{item.cccd_number || 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className="inline-block px-3 py-1 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: st.bg, color: st.text }}
                          >
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(item.created_at).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setRejectionReason('') }}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <ShieldCheck className="size-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Không có hồ sơ KYC nào.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slideover detail panel */}
      {selectedItem && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedItem(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-[580px] bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-semibold">Chi tiết KYC</h2>
                <p className="text-sm text-gray-500">{selectedItem.profiles?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                <X className="size-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Status */}
              <div>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: STATUS_STYLES[selectedItem.status]?.bg,
                    color: STATUS_STYLES[selectedItem.status]?.text,
                  }}
                >
                  {STATUS_STYLES[selectedItem.status]?.label}
                </span>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Họ tên</p>
                  <p className="text-sm font-medium">{selectedItem.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium">{selectedItem.profiles?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Số giấy tờ</p>
                  <p className="text-sm font-mono">{selectedItem.cccd_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ngày sinh</p>
                  <p className="text-sm">{selectedItem.date_of_birth ? new Date(selectedItem.date_of_birth).toLocaleDateString('vi-VN') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ngày gửi</p>
                  <p className="text-sm">{new Date(selectedItem.created_at).toLocaleString('vi-VN')}</p>
                </div>
                {selectedItem.reviewed_at && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ngày duyệt</p>
                    <p className="text-sm">{new Date(selectedItem.reviewed_at).toLocaleString('vi-VN')}</p>
                  </div>
                )}
                {selectedItem.rejection_reason && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Lý do từ chối</p>
                    <p className="text-sm text-red-600">{selectedItem.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Images */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Hình ảnh xác minh</h3>
                <div className="grid grid-cols-1 gap-3">
                  <ImageBox label="Mặt trước" url={selectedItem.cccd_front_url} />
                  <ImageBox label="Mặt sau" url={selectedItem.cccd_back_url} />
                  <ImageBox label="Selfie" url={selectedItem.selfie_url} />
                </div>
              </div>

              {/* Action buttons for pending */}
              {selectedItem.status === 'pending' && (
                <div className="border-t pt-5">
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Lý do từ chối (bắt buộc nếu từ chối)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(selectedItem, 'rejected')}
                      disabled={processing || !rejectionReason.trim()}
                      className="flex-1 h-12 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processing ? 'Đang xử lý...' : 'Từ chối'}
                    </button>
                    <button
                      onClick={() => handleAction(selectedItem, 'approved')}
                      disabled={processing}
                      className="flex-1 h-12 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {processing ? 'Đang xử lý...' : 'Duyệt KYC'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ImageBox({ label, url }: { label: string; url: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loadingImg, setLoadingImg] = useState(false)
  const [imgError, setImgError] = useState(false)

  if (!url) return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="bg-gray-100 rounded-lg p-4 text-center text-xs text-gray-400">Chưa có</div>
    </div>
  )

  async function loadImage() {
    if (signedUrl || loadingImg) return
    setLoadingImg(true)
    try {
      const res = await fetch(`/api/admin/kyc-image?path=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (json.url) setSignedUrl(json.url)
      else setImgError(true)
    } catch {
      setImgError(true)
    }
    setLoadingImg(false)
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="border rounded-lg overflow-hidden bg-gray-50">
        {signedUrl ? (
          <>
            <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={signedUrl}
                alt={label}
                className="w-full h-52 object-contain bg-white hover:opacity-90 transition-opacity cursor-pointer"
              />
            </a>
            <div className="px-3 py-2 bg-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 truncate max-w-[70%]">{url}</span>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#FF5942] font-medium hover:underline shrink-0">
                Mở ảnh gốc ↗
              </a>
            </div>
          </>
        ) : imgError ? (
          <div className="p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Không thể tải ảnh</p>
            <p className="text-[10px] text-gray-300 break-all">{url}</p>
          </div>
        ) : (
          <button
            onClick={loadImage}
            disabled={loadingImg}
            className="w-full p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {loadingImg ? (
              <div className="inline-block size-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <>
                <div className="text-2xl mb-1">🖼️</div>
                <p className="text-xs text-[#FF5942] font-medium">Nhấn để xem ảnh</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[250px] mx-auto">{url}</p>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Bell, Plus, Send, X, Search, Trash2, Users, User,
  Info, CheckCircle, AlertTriangle, XCircle, ChevronLeft, ChevronRight, Globe,
} from 'lucide-react'

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Info; bg: string; text: string }> = {
  info: { label: 'Thông tin', icon: Info, bg: '#ebf5fd', text: '#309ae7' },
  success: { label: 'Thành công', icon: CheckCircle, bg: '#e7f5ec', text: '#60bc7f' },
  warning: { label: 'Cảnh báo', icon: AlertTriangle, bg: '#fef2d4', text: '#e4a508' },
  error: { label: 'Quan trọng', icon: XCircle, bg: '#fde8ea', text: '#e91925' },
}

interface Notification {
  id: string
  user_id: string | null
  title: string
  message: string
  type: string
  is_global: boolean
  is_read: boolean
  created_at: string
  profiles: { email: string; full_name: string | null } | null
}

interface Seller {
  id: string
  email: string
  full_name: string | null
}

const PAGE_SIZE = 15

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState<'all' | 'global' | 'individual'>('all')

  // Create form
  const [title, setTitle] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [message, setMessage] = useState('')
  const [messageEn, setMessageEn] = useState('')
  const [notifType, setNotifType] = useState('info')
  const [target, setTarget] = useState<'global' | 'individual'>('global')
  const [selectedSellers, setSelectedSellers] = useState<string[]>([])
  const [sellerSearch, setSellerSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [{ data: notifs }, { data: sellerList }] = await Promise.all([
      supabase.from('notifications').select('*, profiles!notifications_user_id_fkey(email, full_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, email, full_name').eq('role', 'seller').order('full_name'),
    ])

    if (notifs) setNotifications(notifs as unknown as Notification[])
    if (sellerList) setSellers(sellerList as Seller[])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleSend() {
    if (!title.trim() || !message.trim()) { setError('Vui lòng nhập tiêu đề và nội dung'); return }
    if (target === 'individual' && selectedSellers.length === 0) { setError('Vui lòng chọn ít nhất 1 seller'); return }

    setSending(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (target === 'global') {
      await supabase.from('notifications').insert({
        title: title.trim(),
        title_en: titleEn.trim() || null,
        message: message.trim(),
        message_en: messageEn.trim() || null,
        type: notifType,
        is_global: true,
        user_id: null,
        created_by: user?.id,
      })
    } else {
      const rows = selectedSellers.map(sellerId => ({
        title: title.trim(),
        title_en: titleEn.trim() || null,
        message: message.trim(),
        message_en: messageEn.trim() || null,
        type: notifType,
        is_global: false,
        user_id: sellerId,
        created_by: user?.id,
      }))
      await supabase.from('notifications').insert(rows)
    }

    setSending(false)
    setSuccess(`Đã gửi thông báo ${target === 'global' ? 'đến tất cả seller' : `đến ${selectedSellers.length} seller`}`)
    setTitle('')
    setTitleEn('')
    setMessage('')
    setMessageEn('')
    setSelectedSellers([])
    setShowCreate(false)
    loadData()
    setTimeout(() => setSuccess(''), 3000)
  }

  async function deleteNotif(id: string) {
    if (!confirm('Xóa thông báo này?')) return
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)
    loadData()
  }

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (typeFilter && n.type !== typeFilter) return false
      if (targetFilter === 'global' && !n.is_global) return false
      if (targetFilter === 'individual' && n.is_global) return false
      return true
    })
  }, [notifications, typeFilter, targetFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Stats
  const globalCount = notifications.filter(n => n.is_global).length
  const individualCount = notifications.filter(n => !n.is_global).length

  const filteredSellers = sellers.filter(s => {
    if (!sellerSearch) return true
    const q = sellerSearch.toLowerCase()
    return (s.full_name || '').toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        <Button onClick={() => { setShowCreate(true); setError('') }} className="h-10 bg-red-600 hover:bg-red-700 gap-1.5">
          <Plus className="size-4" />
          Tạo thông báo
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-5">Gửi thông báo đến seller trên hệ thống.</p>

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
          <CheckCircle className="size-4" /> {success}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-[10px] text-blue-600 font-medium mb-1">Tổng thông báo</p>
          <p className="text-xl font-bold text-blue-700">{notifications.length}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-[10px] text-purple-600 font-medium mb-1">Toàn hệ thống</p>
          <p className="text-xl font-bold text-purple-700">{globalCount}</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-4">
          <p className="text-[10px] text-cyan-600 font-medium mb-1">Cá nhân</p>
          <p className="text-xl font-bold text-cyan-700">{individualCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'global', 'individual'] as const).map(t => (
          <button key={t} onClick={() => { setTargetFilter(t); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              targetFilter === t ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}>
            {t === 'all' ? 'Tất cả' : t === 'global' ? 'Toàn hệ thống' : 'Cá nhân'}
          </button>
        ))}
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm">
          <option value="">Tất cả loại</option>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} thông báo</p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block size-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              <p className="text-gray-400 mt-3 text-sm">Đang tải...</p>
            </div>
          ) : paged.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Đối tượng</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(n => {
                      const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
                      const Icon = cfg.icon
                      return (
                        <TableRow key={n.id} className="hover:bg-gray-50/50">
                          <TableCell>
                            <div className="flex size-7 items-center justify-center rounded-full" style={{ backgroundColor: cfg.bg }}>
                              <Icon className="size-3.5" style={{ color: cfg.text }} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-gray-400 max-w-[300px] truncate">{n.message}</p>
                          </TableCell>
                          <TableCell>
                            {n.is_global ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600">
                                <Globe className="size-3" /> Tất cả seller
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">
                                {n.profiles?.full_name || n.profiles?.email || 'N/A'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                              {cfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(n.created_at).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>
                            <button onClick={() => deleteNotif(n.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="size-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
                  <span className="text-xs text-gray-400">Trang {page}/{totalPages}</span>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="size-8 p-0"><ChevronLeft className="size-4" /></Button>
                    <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="size-8 p-0"><ChevronRight className="size-4" /></Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <Bell className="size-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Chưa có thông báo nào.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Slideover */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-[520px] bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Tạo thông báo mới</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {error && (
                <div className="bg-[#FDE8EA] text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="size-4" /> {error}
                </div>
              )}

              {/* Target */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gửi đến</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setTarget('global')}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      target === 'global' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <Users className="size-4 text-purple-600" />
                    <div className="text-left">
                      <p className="font-semibold">Tất cả seller</p>
                      <p className="text-[10px] text-gray-400">Thông báo toàn hệ thống</p>
                    </div>
                  </button>
                  <button onClick={() => setTarget('individual')}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      target === 'individual' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <User className="size-4 text-cyan-600" />
                    <div className="text-left">
                      <p className="font-semibold">Seller cụ thể</p>
                      <p className="text-[10px] text-gray-400">Chọn từng người nhận</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Seller picker */}
              {target === 'individual' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Chọn seller ({selectedSellers.length} đã chọn)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                    <Input value={sellerSearch} onChange={e => setSellerSearch(e.target.value)} placeholder="Tìm seller..." className="pl-9 h-9 text-sm" />
                  </div>
                  <div className="max-h-[160px] overflow-y-auto space-y-1 border rounded-lg p-2">
                    {filteredSellers.map(s => {
                      const checked = selectedSellers.includes(s.id)
                      return (
                        <label key={s.id} className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={checked}
                            onChange={() => setSelectedSellers(prev => checked ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                            className="size-4 rounded accent-red-600" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.full_name || s.email}</p>
                            <p className="text-[10px] text-gray-400">{s.email}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Loại thông báo</Label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button key={key} onClick={() => setNotifType(key)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-colors ${
                          notifType === key ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <Icon className="size-4" style={{ color: cfg.text }} />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Title & Message - Vietnamese */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tiêu đề <span className="text-red-500">*</span></Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Cập nhật biểu phí mới" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nội dung <span className="text-red-500">*</span></Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Nhập nội dung thông báo chi tiết..."
                  rows={3} />
              </div>

              {/* Auto translate button */}
              <button
                type="button"
                disabled={translating || (!title.trim() && !message.trim())}
                onClick={async () => {
                  setTranslating(true)
                  try {
                    const [titleRes, msgRes] = await Promise.all([
                      title.trim() ? fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: title }) }).then(r => r.json()) : { translated: '' },
                      message.trim() ? fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: message }) }).then(r => r.json()) : { translated: '' },
                    ])
                    if (titleRes.translated) setTitleEn(titleRes.translated)
                    if (msgRes.translated) setMessageEn(msgRes.translated)
                  } catch { /* ignore */ }
                  setTranslating(false)
                }}
                className="w-full py-2.5 rounded-lg border-2 border-dashed border-blue-300 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {translating ? (
                  <><div className="inline-block size-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> Đang dịch...</>
                ) : (
                  <>🌐 Tự động dịch sang English</>
                )}
              </button>

              {/* English fields */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-600">Title (English)</Label>
                <Input value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Auto-translated or enter manually" className="h-12 border-blue-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-600">Content (English)</Label>
                <Textarea value={messageEn} onChange={e => setMessageEn(e.target.value)}
                  placeholder="Auto-translated or enter manually..."
                  rows={3} className="border-blue-200" />
              </div>

              {/* Preview */}
              {title && (
                <div className="border rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Xem trước</p>
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: TYPE_CONFIG[notifType]?.bg }}>
                      {(() => { const I = TYPE_CONFIG[notifType]?.icon || Info; return <I className="size-4" style={{ color: TYPE_CONFIG[notifType]?.text }} /> })()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{message || '...'}</p>
                      <p className="text-[10px] text-gray-300 mt-1">Vừa xong</p>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-base font-bold gap-2">
                <Send className="size-4" />
                {sending ? 'Đang gửi...' : `Gửi thông báo ${target === 'global' ? 'toàn hệ thống' : `(${selectedSellers.length} seller)`}`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

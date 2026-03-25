'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  UserPlus, Shield, Eye, Wallet, ShieldCheck, HeadphonesIcon,
  Crown, X, Check, Trash2, AlertTriangle,
} from 'lucide-react'

/* ─── Role definitions ─── */

const ROLES = [
  {
    id: 'owner',
    label: 'Owner',
    icon: Crown,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    badgeBg: '#ede9fe',
    badgeText: '#7c3aed',
    description: 'Toàn quyền quản trị hệ thống',
    permissions: [
      'Quản lý tất cả seller, VA, giao dịch',
      'Duyệt KYC & rút tiền',
      'Cài đặt phí, tier, hệ thống',
      'Quản lý team & phân quyền',
      'Xem doanh thu & báo cáo',
    ],
  },
  {
    id: 'finance',
    label: 'Kế toán',
    icon: Wallet,
    color: 'text-green-600',
    bg: 'bg-green-50',
    badgeBg: '#e7f5ec',
    badgeText: '#60bc7f',
    description: 'Quản lý tài chính, duyệt rút tiền',
    permissions: [
      'Xem tất cả giao dịch & rút tiền',
      'Duyệt/từ chối yêu cầu rút tiền',
      'Xem doanh thu & báo cáo',
      'Xuất báo cáo CSV/Excel',
      'Không được cài đặt hệ thống',
    ],
  },
  {
    id: 'kyc_officer',
    label: 'KYC Officer',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badgeBg: '#ebf5fd',
    badgeText: '#309ae7',
    description: 'Xem xét & duyệt hồ sơ KYC',
    permissions: [
      'Xem & duyệt hồ sơ KYC',
      'Xem thông tin seller (chỉ đọc)',
      'Không truy cập giao dịch/rút tiền',
      'Không xem doanh thu',
      'Không cài đặt hệ thống',
    ],
  },
  {
    id: 'support',
    label: 'Hỗ trợ',
    icon: HeadphonesIcon,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    badgeBg: '#fef2d4',
    badgeText: '#e4a508',
    description: 'Hỗ trợ seller, xem thông tin',
    permissions: [
      'Xem thông tin seller (chỉ đọc)',
      'Xem danh sách VA (chỉ đọc)',
      'Xem giao dịch (chỉ đọc)',
      'Không duyệt KYC/rút tiền',
      'Không xem doanh thu & cài đặt',
    ],
  },
  {
    id: 'viewer',
    label: 'Xem',
    icon: Eye,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    badgeBg: '#f3f4f6',
    badgeText: '#6b7280',
    description: 'Chỉ xem, không thao tác',
    permissions: [
      'Xem tất cả trang admin (chỉ đọc)',
      'Không duyệt, sửa, xóa bất kỳ gì',
      'Phù hợp cho đối tác, nhà đầu tư',
    ],
  },
] as const

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.id, r]))

/* ─── Permission matrix ─── */
const PERMISSIONS_MATRIX = {
  owner: { dashboard: true, sellers: true, kyc: true, va: true, transactions: true, withdrawals: true, revenue: true, settings: true, roles: true },
  finance: { dashboard: true, sellers: false, kyc: false, va: false, transactions: true, withdrawals: true, revenue: true, settings: false, roles: false },
  kyc_officer: { dashboard: true, sellers: true, kyc: true, va: false, transactions: false, withdrawals: false, revenue: false, settings: false, roles: false },
  support: { dashboard: true, sellers: true, kyc: false, va: true, transactions: true, withdrawals: false, revenue: false, settings: false, roles: false },
  viewer: { dashboard: true, sellers: true, kyc: true, va: true, transactions: true, withdrawals: true, revenue: true, settings: false, roles: false },
} as const

const PERM_LABELS: Record<string, string> = {
  dashboard: 'Tổng quan',
  sellers: 'Quản lý Seller',
  kyc: 'Duyệt KYC',
  va: 'Virtual Accounts',
  transactions: 'Giao dịch',
  withdrawals: 'Rút tiền',
  revenue: 'Doanh thu',
  settings: 'Cài đặt',
  roles: 'Phân quyền',
}

interface TeamMember {
  id: string
  email: string
  admin_role: string
  status: string
  created_at: string
  user_id: string | null
  profiles: { full_name: string | null } | null
}

export default function RolesPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('support')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadMembers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('admin_team')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: true })
    if (data) setMembers(data as unknown as TeamMember[])
    setLoading(false)
  }, [])

  useEffect(() => { loadMembers() }, [loadMembers])

  async function handleInvite() {
    if (!inviteEmail.trim()) { setError('Vui lòng nhập email'); return }
    setInviting(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertErr } = await supabase.from('admin_team').insert({
      email: inviteEmail.trim(),
      admin_role: inviteRole,
      invited_by: user?.id,
      status: 'invited',
    })

    setInviting(false)
    if (insertErr) {
      setError(insertErr.message.includes('duplicate') ? 'Email này đã được mời' : insertErr.message)
      return
    }

    setSuccess(`Đã mời ${inviteEmail} với vai trò ${ROLE_MAP[inviteRole]?.label || inviteRole}`)
    setInviteEmail('')
    setShowInvite(false)
    loadMembers()
    setTimeout(() => setSuccess(''), 3000)
  }

  async function removeMemember(id: string) {
    if (!confirm('Xác nhận xóa thành viên này?')) return
    const supabase = createClient()
    await supabase.from('admin_team').delete().eq('id', id)
    loadMembers()
  }

  async function changeRole(id: string, newRole: string) {
    const supabase = createClient()
    await supabase.from('admin_team').update({ admin_role: newRole, updated_at: new Date().toISOString() }).eq('id', id)
    loadMembers()
  }

  const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: 'Hoạt động', bg: '#e7f5ec', text: '#60bc7f' },
    invited: { label: 'Đã mời', bg: '#fef2d4', text: '#e4a508' },
    disabled: { label: 'Vô hiệu', bg: '#f3f4f6', text: '#6b7280' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Phân quyền & Team</h1>
        <Button onClick={() => setShowInvite(true)} className="h-10 bg-red-600 hover:bg-red-700 gap-1.5">
          <UserPlus className="size-4" />
          Mời thành viên
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Quản lý đội ngũ và phân quyền truy cập trang quản trị.</p>

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
          <Check className="size-4" /> {success}
        </div>
      )}

      {/* Role cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {ROLES.map(role => {
          const Icon = role.icon
          const count = members.filter(m => m.admin_role === role.id).length
          return (
            <Card key={role.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`flex size-10 items-center justify-center rounded-xl ${role.bg}`}>
                    <Icon className={`size-5 ${role.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{role.label}</h3>
                      {count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-gray-100 text-gray-500">
                          {count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {role.permissions.map((p, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className={`mt-0.5 ${p.startsWith('Không') ? 'text-red-400' : 'text-green-500'}`}>
                        {p.startsWith('Không') ? '✕' : '✓'}
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Permission matrix */}
      <Card className="mb-8">
        <CardContent className="pt-5">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Shield className="size-4 text-red-600" />
            Ma trận phân quyền
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2.5 px-3 text-xs text-gray-500 w-[140px]">Trang</th>
                  {ROLES.map(r => (
                    <th key={r.id} className="text-center py-2.5 px-2 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: r.badgeBg, color: r.badgeText }}>
                        {r.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERM_LABELS).map(([key, label]) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="py-2.5 px-3 text-sm text-gray-700">{label}</td>
                    {ROLES.map(r => {
                      const has = PERMISSIONS_MATRIX[r.id as keyof typeof PERMISSIONS_MATRIX]?.[key as keyof (typeof PERMISSIONS_MATRIX)['owner']]
                      return (
                        <td key={r.id} className="py-2.5 px-2 text-center">
                          {has ? (
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-green-100">
                              <Check className="size-3 text-green-600" />
                            </span>
                          ) : (
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-gray-100">
                              <X className="size-3 text-gray-400" />
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Team members table */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Thành viên đội ngũ</h2>
        <span className="text-xs text-gray-400">{members.length} thành viên</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block size-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              <p className="text-gray-400 mt-3 text-sm">Đang tải...</p>
            </div>
          ) : members.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Thành viên</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead>Ngày thêm</TableHead>
                    <TableHead className="text-center w-[120px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const role = ROLE_MAP[m.admin_role]
                    const st = STATUS_STYLES[m.status] || STATUS_STYLES.invited
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{m.profiles?.full_name || m.email}</p>
                            <p className="text-xs text-gray-400">{m.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            value={m.admin_role}
                            onChange={(e) => changeRole(m.id, e.target.value)}
                            className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium"
                            disabled={m.admin_role === 'owner'}
                          >
                            {ROLES.map(r => (
                              <option key={r.id} value={r.id}>{r.label}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: st.bg, color: st.text }}>
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(m.created_at).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-center">
                          {m.admin_role !== 'owner' && (
                            <button
                              onClick={() => removeMemember(m.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="size-3" /> Xóa
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <UserPlus className="size-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Chưa có thành viên nào. Mời thành viên đầu tiên.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite slideover */}
      {showInvite && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowInvite(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Mời thành viên mới</h2>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {error && (
                <div className="bg-[#FDE8EA] text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="size-4" /> {error}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Vai trò</Label>
                <div className="space-y-2">
                  {ROLES.filter(r => r.id !== 'owner').map(role => {
                    const Icon = role.icon
                    const selected = inviteRole === role.id
                    return (
                      <button
                        key={role.id}
                        onClick={() => setInviteRole(role.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                          selected ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`flex size-9 items-center justify-center rounded-lg ${role.bg} shrink-0 mt-0.5`}>
                          <Icon className={`size-4 ${role.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{role.label}</span>
                            {selected && <Check className="size-4 text-red-500" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {role.permissions.slice(0, 3).map((p, i) => (
                              <span key={i} className={`text-[9px] px-1.5 py-px rounded ${p.startsWith('Không') ? 'bg-red-50 text-red-400' : 'bg-green-50 text-green-600'}`}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-base font-bold"
              >
                {inviting ? 'Đang mời...' : `Mời với vai trò ${ROLE_MAP[inviteRole]?.label || inviteRole}`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

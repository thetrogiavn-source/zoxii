'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Copy,
  Check,
  Plus,
  CreditCard,
  X,
  ChevronRight,
  Search,
  AlertTriangle,
} from 'lucide-react'
import type { VirtualAccount } from '@/types'
import { useI18n } from '@/lib/i18n'

const PLATFORM_LIST = [
  { id: 'etsy', name: 'Etsy' },
  { id: 'paypal', name: 'PayPal' },
  { id: 'payoneer', name: 'Payoneer' },
  { id: 'pingpong', name: 'Pingpong' },
  { id: 'wise', name: 'Wise' },
  { id: 'airwallex', name: 'Airwallex' },
  { id: 'worldfirst', name: 'WorldFirst' },
  { id: 'lianlian', name: 'LianLian' },
]

const TIER_FEE: Record<string, number> = {
  FREE: 2.5,
  PRO: 1.5,
  ENTERPRISE: 1.0,
}

const VA_STATUS_MAP: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: 'Active', bg: '#e7f5ec', text: '#60bc7f' },
  2: { label: 'Active', bg: '#e7f5ec', text: '#60bc7f' },
  0: { label: 'Inactive', bg: '#fef2d4', text: '#e4a508' },
  3: { label: 'Expired', bg: '#f3f4f6', text: '#6b7280' },
  4: { label: 'Expired', bg: '#f3f4f6', text: '#6b7280' },
}

const TIER_LIMITS: Record<string, number | null> = {
  FREE: 10,
  PRO: 100,
  ENTERPRISE: null, // unlimited
}

export default function AccountsPage() {
  const { t } = useI18n()
  const [vas, setVas] = useState<VirtualAccount[]>([])
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [bankFilter, setBankFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [kycStatus, setKycStatus] = useState<string>('none')
  const [tier, setTier] = useState<string>('FREE')

  // Create VA state
  const [showCreate, setShowCreate] = useState(false)
  const [createStep, setCreateStep] = useState<'form' | 'confirm'>('form')
  const [vaName, setVaName] = useState('')
  const [platform, setPlatform] = useState('')
  const [agreePolicy, setAgreePolicy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Detail view
  const [selectedVA, setSelectedVA] = useState<VirtualAccount | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const loadVAs = useCallback(async () => {
    const res = await fetch('/api/hpay/va')
    const json = await res.json()
    if (json.data) setVas(json.data)
  }, [])

  useEffect(() => {
    loadVAs()
    loadProfile()
  }, [loadVAs])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('kyc_status, tier').eq('id', user.id).single()
    if (data) {
      setKycStatus(data.kyc_status)
      setTier(data.tier || 'FREE')
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  function handleOpenCreate() {
    if (kycStatus !== 'approved') {
      setError(t('kyc_required_for_va'))
      return
    }
    const limit = TIER_LIMITS[tier]
    if (limit !== null && vas.length >= limit) {
      setError(t('va_limit_reached').replace('{limit}', String(limit)).replace('{tier}', tier))
      return
    }
    setError('')
    setShowCreate(true)
    setCreateStep('form')
    setVaName('')
    setPlatform('')
    setAgreePolicy(false)
  }

  async function handleCreateVA() {
    if (!vaName.trim() || !platform) {
      setError(t('fill_all_info'))
      return
    }
    if (!agreePolicy) {
      setError(t('agree_terms_usage'))
      return
    }
    setError('')
    setLoading(true)

    const res = await fetch('/api/hpay/va', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vaName: vaName.trim(), platform }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error || t('cannot_create_va'))
      setLoading(false)
      return
    }

    setLoading(false)
    setShowCreate(false)
    loadVAs()
  }

  const limit = TIER_LIMITS[tier]
  const limitDisplay = limit === null ? 'Unlimited' : String(limit)
  const tierFee = TIER_FEE[tier] ?? 2.5
  const PLATFORMS = PLATFORM_LIST.map(p => ({ ...p, fee: tierFee }))
  const isActive = (va: VirtualAccount) => va.va_status === 1 || va.va_status === 2

  const filteredVAs = vas.filter(va => {
    if (search) {
      const q = search.toLowerCase()
      if (!va.va_name.toLowerCase().includes(q) && !va.va_account.includes(q)) return false
    }
    if (bankFilter && (va.va_bank || 'BIDV') !== bankFilter) return false
    if (statusFilter === 'active' && !isActive(va)) return false
    if (statusFilter === 'inactive' && isActive(va)) return false
    return true
  })

  const activeCount = vas.filter(v => isActive(v)).length
  const inactiveCount = vas.filter(v => !isActive(v)).length

  const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('va_list_title')}</h1>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span className="text-sm text-gray-500">
              {t('va_created_count')}: <span className="font-bold text-gray-800 text-base">{vas.length}/{limitDisplay}</span> VA
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">
              Tier:{' '}
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-bold ml-0.5"
                style={{
                  backgroundColor: tier === 'ENTERPRISE' ? '#f3e8ff' : tier === 'PRO' ? '#FFF0EE' : '#f3f4f6',
                  color: tier === 'ENTERPRISE' ? '#7c3aed' : tier === 'PRO' ? '#FF5942' : '#6b7280',
                }}
              >
                {tier}
              </span>
            </span>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                statusFilter === 'active' ? 'ring-2 ring-green-400 ring-offset-1' : 'hover:ring-1 hover:ring-green-300'
              }`}
              style={{ backgroundColor: '#e7f5ec', color: '#60bc7f' }}
            >
              Active: {activeCount}
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                statusFilter === 'inactive' ? 'ring-2 ring-amber-400 ring-offset-1' : 'hover:ring-1 hover:ring-amber-300'
              }`}
              style={{ backgroundColor: '#fef2d4', color: '#e4a508' }}
            >
              Inactive: {inactiveCount}
            </button>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#FF5942] hover:bg-[#e64d38] gap-2 h-10">
          <Plus className="size-4" />
          {t('create_va')}
        </Button>
      </div>

      {/* Error banner */}
      {error && !showCreate && (
        <div className="flex items-center gap-2 bg-[#FDE8EA] text-red-700 px-4 py-3 rounded-lg mb-4">
          <AlertTriangle className="size-5 shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X className="size-4" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_va')}
            className="pl-10 h-10"
          />
        </div>

        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[130px]"
        >
          <option value="">{t('all_sources')}</option>
          {PLATFORMS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Bank filter */}
        <select
          value={bankFilter}
          onChange={(e) => setBankFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[130px]"
        >
          <option value="">{t('all_banks')}</option>
          <option value="BIDV">BIDV</option>
          <option value="MB">MB Bank</option>
        </select>

        {(search || platformFilter || bankFilter) && (
          <button
            onClick={() => { setSearch(''); setPlatformFilter(''); setBankFilter('') }}
            className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <X className="size-3.5" /> {t('clear')}
          </button>
        )}
      </div>

      {/* VA Table */}
      <Card>
        <CardContent className="p-0">
          {filteredVAs.length > 0 ? (
            <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('va_account_name')}</TableHead>
                  <TableHead className="text-center">{t('va_account_number')}</TableHead>
                  <TableHead className="text-center">{t('va_source')}</TableHead>
                  <TableHead className="text-center">{t('va_bank')}</TableHead>
                  <TableHead className="text-center">{t('va_status')}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVAs.map((va) => {
                  const status = VA_STATUS_MAP[va.va_status] || VA_STATUS_MAP[0]
                  return (
                    <TableRow
                      key={va.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedVA(va)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-full bg-[#FFEFED]">
                            <CreditCard className="size-4 text-[#FF5942]" />
                          </div>
                          <span className="font-medium text-sm">{va.va_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono text-sm">{va.va_account}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(va.va_account, va.id) }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copiedField === va.id ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">{PLATFORM_LIST.find(p => p.id === va.platform)?.name || va.platform || 'Etsy'}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{va.va_bank || 'BIDV'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: status.bg, color: status.text }}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="size-4 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <CreditCard className="size-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                {search ? t('no_va_found') : t('no_va')}
              </p>
              {!search && (
                <Button onClick={handleOpenCreate} className="bg-[#FF5942] hover:bg-[#e64d38]">
                  {t('create_first_va')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create VA Slideover */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative w-full sm:max-w-[580px] bg-white h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold">
                {createStep === 'form' ? t('create_new_va') : t('confirm_create_va')}
              </h2>
              <button onClick={() => setShowCreate(false)}><X className="size-5 text-gray-500" /></button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {error && (
                <div className="bg-[#FDE8EA] text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              {createStep === 'form' && (
                <>
                  {/* Platform */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {t('va_source_label')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPlatform(p.id)}
                          className={`h-14 rounded-lg border-2 text-sm font-medium transition-colors ${
                            platform === p.id
                              ? 'border-[#FF5942] bg-[#FFEFED] text-[#FF5942]'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {p.name}
                          <span className="block text-xs text-gray-400 font-normal">{t('fee_label')}: {p.fee}%</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-orange-600 bg-orange-50 p-2.5 rounded-md mt-2">
                      {t('va_source_warning')}
                    </p>
                  </div>

                  {/* Bank */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {t('va_bank_label')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="h-12 rounded-lg border border-gray-200 bg-gray-50 px-4 flex items-center text-sm font-medium text-gray-700">
                      BIDV - Ngân hàng Đầu tư và Phát triển Việt Nam
                    </div>
                    <p className="text-xs text-gray-400">{t('va_bank_only_bidv')}</p>
                  </div>

                  {/* Account name */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {t('va_name_label')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={vaName}
                      onChange={(e) => setVaName(e.target.value)}
                      placeholder={t('va_name_placeholder')}
                      className="h-12"
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-400">
                      {t('va_name_hint')}
                    </p>
                  </div>

                  {/* Policy */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreePolicy}
                      onChange={(e) => setAgreePolicy(e.target.checked)}
                      className="mt-0.5 size-[18px] rounded accent-[#FF5942]"
                    />
                    <span className="text-sm text-gray-600">
                      {t('va_agree_terms')}{' '}
                      <span className="text-[#FF5942] font-medium cursor-pointer">
                        {t('va_terms_link')}
                      </span>
                    </span>
                  </label>

                  <Separator />

                  <Button
                    onClick={() => {
                      if (!vaName.trim() || !platform) {
                        setError(t('fill_all_info'))
                        return
                      }
                      if (!agreePolicy) {
                        setError(t('agree_terms_required'))
                        return
                      }
                      setError('')
                      setCreateStep('confirm')
                    }}
                    className="w-full h-12 bg-[#FF5942] hover:bg-[#e64d38] text-base font-semibold"
                  >
                    {t('continue')}
                  </Button>
                </>
              )}

              {createStep === 'confirm' && (
                <>
                  <div className="bg-gray-50 rounded-lg p-5 space-y-3">
                    <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">{t('va_info')}</h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('va_source_label')}</span>
                        <span className="font-medium">{PLATFORMS.find(p => p.id === platform)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('va_bank_label')}</span>
                        <span className="font-medium">BIDV</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('va_name_label')}</span>
                        <span className="font-medium">{vaName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('fee_label')}</span>
                        <span className="font-medium">{PLATFORMS.find(p => p.id === platform)?.fee}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCreateStep('form')}
                      className="flex-1 h-12"
                    >
                      {t('go_back')}
                    </Button>
                    <Button
                      onClick={handleCreateVA}
                      disabled={loading}
                      className="flex-1 h-12 bg-[#FF5942] hover:bg-[#e64d38] text-base font-semibold"
                    >
                      {loading ? t('creating') : t('confirm_create')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VA Detail Slideover */}
      {selectedVA && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedVA(null)} />
          <div className="relative w-full sm:max-w-[580px] bg-white h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold">{t('va_detail')}</h2>
              <button onClick={() => setSelectedVA(null)}><X className="size-5 text-gray-500" /></button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{t('va_status')}</span>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: (VA_STATUS_MAP[selectedVA.va_status] || VA_STATUS_MAP[0]).bg,
                    color: (VA_STATUS_MAP[selectedVA.va_status] || VA_STATUS_MAP[0]).text,
                  }}
                >
                  {(VA_STATUS_MAP[selectedVA.va_status] || VA_STATUS_MAP[0]).label}
                </span>
              </div>

              <Separator />

              {/* Detail fields */}
              <div className="space-y-4">
                <CopyableRow label={t('va_account_name')} value={selectedVA.va_name} field="d-name" copiedField={copiedField} onCopy={copyToClipboard} />
                <CopyableRow label={t('va_account_number')} value={selectedVA.va_account} field="d-account" copiedField={copiedField} onCopy={copyToClipboard} mono />
              </div>

              <Separator />

              {/* Bank info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('bank_info')}</h3>
                <div className="space-y-3">
                  <CopyableRow label={t('va_bank_label')} value="Joint Stock Commercial Bank for Investment and Development of Vietnam" field="d-bank-name" copiedField={copiedField} onCopy={copyToClipboard} />
                  <CopyableRow label={t('bank_short_name')} value={selectedVA.va_bank || 'BIDV'} field="d-bank-short" copiedField={copiedField} onCopy={copyToClipboard} />
                  <CopyableRow label="SWIFT Code" value="BIDVVNVX" field="d-swift" copiedField={copiedField} onCopy={copyToClipboard} mono />
                  <DetailRow label={t('currency_type')} value="VND" />
                </div>
              </div>

              <Separator />

              {/* Platform & Fee */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('source_and_fee')}</h3>
                <div className="space-y-3">
                  <DetailRow label={t('va_source_label')} value={PLATFORM_LIST.find(p => p.id === selectedVA.platform)?.name || selectedVA.platform || 'Etsy'} />
                  <DetailRow label={t('fee_percent')} value={`${tierFee}%`} />
                  <DetailRow label={t('created_date')} value={new Date(selectedVA.created_at).toLocaleString('vi-VN')} />
                </div>
              </div>

              <Separator />

              <a
                href={`/dashboard/topup?va=${selectedVA.va_account}`}
                className="flex items-center justify-between py-3 text-sm text-[#FF5942] font-medium hover:underline"
              >
                {t('view_transaction_history')}
                <ChevronRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-sm text-right">{value}</span>
    </div>
  )
}

function CopyableRow({ label, value, field, copiedField, onCopy, mono }: {
  label: string; value: string; field: string; copiedField: string | null
  onCopy: (text: string, field: string) => void; mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-medium text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
        <button
          onClick={() => onCopy(value, field)}
          className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
        >
          {copiedField === field ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { VIETNAMESE_BANKS } from '@/lib/constants'
import type { Withdrawal, BankAccount } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import {
  ArrowDown,
  Building2,
  Check,
  Clock,
  Copy,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  CircleOff,
  Plus,
} from 'lucide-react'

/* ─── Constants ─── */

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; icon: typeof CheckCircle }> = {
  processing: { label: 'Process', bg: '#ebf5fd', text: '#309ae7', icon: Clock },
  success: { label: 'Success', bg: '#e7f5ec', text: '#60bc7f', icon: CheckCircle },
  failed: { label: 'Failed', bg: '#fde8ea', text: '#e91925', icon: XCircle },
}

/* ─── Helpers ─── */

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' VND'

function getTimeRange(range: string): { start: Date; end: Date } | null {
  if (range === 'all') return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (range) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) }
    case 'this_week': {
      const day = today.getDay()
      const mon = new Date(today.getTime() - (day === 0 ? 6 : day - 1) * 86400000)
      return { start: mon, end: new Date(mon.getTime() + 7 * 86400000 - 1) }
    }
    case 'this_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      }
    default:
      return null
  }
}

/* ===================================================================
   Main Page
   =================================================================== */

export default function WithdrawPage() {
  const { t } = useI18n()
  /* ── Slideover step: 'idle' = closed, 'form' / 'confirm' / 'result' = open ── */
  const searchParams = useSearchParams()
  const autoOpen = searchParams.get('action') === 'new'
  const [step, setStep] = useState<'idle' | 'form' | 'confirm' | 'result'>(autoOpen ? 'form' : 'idle')

  /* ── Form state ── */
  const [amount, setAmount] = useState('')
  const [remark, setRemark] = useState('')
  const [agreePolicy, setAgreePolicy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultData, setResultData] = useState<Withdrawal | null>(null)

  /* ── Bank selection ── */
  const [savedBanks, setSavedBanks] = useState<BankAccount[]>([])
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [bankSearch, setBankSearch] = useState('')

  /* ── Manual bank entry ── */
  const [manualMode, setManualMode] = useState(false)
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [verifying, setVerifying] = useState(false)

  /* ── Balance & history ── */
  const [balance, setBalance] = useState(0)
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  /* ── Derived values ── */
  const amountNum = parseFloat(amount) || 0
  const fee = 0
  const receiveAmount = amountNum - fee

  const activeBankName = manualMode ? bankName : selectedBank?.bank_name
  const activeBankAccountNumber = manualMode ? bankAccountNumber : selectedBank?.bank_account_number
  const activeBankAccountName = manualMode ? bankAccountName : selectedBank?.bank_account_name
  const bankLabel = VIETNAMESE_BANKS.find(b => b.code === activeBankName)?.name || activeBankName

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load saved banks
    const { data: banks } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
    if (banks) {
      setSavedBanks(banks)
      const defaultBank = banks.find(b => b.is_default) || banks[0]
      if (defaultBank && !selectedBank) setSelectedBank(defaultBank)
    }

    // Calculate balance -- use net_amount (after fee) for actual available balance
    const { data: txns } = await supabase
      .from('transactions')
      .select('amount, net_amount, status')
      .eq('user_id', user.id)
    const { data: wds } = await supabase
      .from('withdrawals')
      .select('amount, status')
      .eq('user_id', user.id)
      .in('status', ['success', 'processing'])

    const completedTxns = txns?.filter(t => t.status === 'completed') || []
    const totalInNet = completedTxns.reduce((s, t) => s + Number(t.net_amount), 0)
    const totalOut = wds?.reduce((s, w) => s + Number(w.amount), 0) || 0
    setBalance(totalInNet - totalOut)

    // All withdrawal history
    const { data: history } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (history) setAllWithdrawals(history)
  }, [selectedBank])

  useEffect(() => { loadData() }, [loadData])

  /* ── Actions ── */
  const [verifyFailed, setVerifyFailed] = useState(false)

  async function verifyBankAccount() {
    if (!bankName || !bankAccountNumber) return
    setVerifying(true)
    setBankAccountName('')
    setVerifyFailed(false)
    try {
      const res = await fetch('/api/hpay/verify-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName, bankAccountNumber }),
      })
      const json = await res.json()
      if (json.data?.bankAccountName) {
        setBankAccountName(json.data.bankAccountName)
      } else {
        setVerifyFailed(true)
      }
    } catch {
      setVerifyFailed(true)
    }
    setVerifying(false)
  }

  function handleProceed() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError(t('enter_valid_amount')); return }
    if (amt > balance) { setError(t('insufficient_balance')); return }
    if (amt < 10000) { setError(t('minimum_amount')); return }
    if (manualMode) {
      if (!bankName || !bankAccountNumber || !bankAccountName) {
        setError(t('verify_bank_first')); return
      }
    } else if (!selectedBank) {
      setError(t('select_bank_account')); return
    }
    if (!agreePolicy) { setError(t('agree_terms_first')); return }
    setError('')
    setStep('confirm')
  }

  async function handleWithdraw() {
    setLoading(true)
    setError('')
    const bank = manualMode
      ? { bankName, bankAccountNumber, bankAccountName }
      : { bankName: selectedBank!.bank_name, bankAccountNumber: selectedBank!.bank_account_number, bankAccountName: selectedBank!.bank_account_name }
    const res = await fetch('/api/hpay/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, ...bank, note: remark || undefined }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error || t('withdraw_failed_msg')); return }
    setResultData(json.data)
    setStep('result')
    loadData()
  }

  function resetForm() {
    setAmount('')
    setRemark('')
    setAgreePolicy(false)
    setError('')
    setResultData(null)
    setManualMode(false)
    setShowBankSelector(false)
    setBankSearch('')
    setBankName('')
    setBankAccountNumber('')
    setBankAccountName('')
    setVerifyFailed(false)
  }

  function closeSlideover() {
    resetForm()
    setStep('idle')
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  /* ── Summary card data ── */
  const wdSuccess = allWithdrawals.filter(w => w.status === 'success')
  const wdProcessing = allWithdrawals.filter(w => w.status === 'processing')
  const wdFailed = allWithdrawals.filter(w => w.status === 'failed')
  const wdSuccessAmt = wdSuccess.reduce((s, w) => s + Number(w.amount), 0)
  const wdProcessingAmt = wdProcessing.reduce((s, w) => s + Number(w.amount), 0)
  const wdFailedAmt = wdFailed.reduce((s, w) => s + Number(w.amount), 0)
  const wdTotalAmt = allWithdrawals.reduce((s, w) => s + Number(w.amount), 0)

  /* ===================================================================
     Render
     =================================================================== */
  return (
    <div>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold">{t('withdraw_title')}</h1>
        <Button
          onClick={() => { resetForm(); setStep('form') }}
          className="h-10 bg-[#FF5942] hover:bg-[#e64d38] text-sm font-bold gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          {t('create_withdrawal')}
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-5">{t('withdraw_subtitle')}</p>

      {/* ── 4 Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-green-50 rounded-xl p-5">
          <p className="text-xs text-green-600 font-medium mb-1.5">{t('withdraw_success')} ({wdSuccess.length})</p>
          <p className="text-xl font-bold text-green-700">{formatVND(wdSuccessAmt)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-5">
          <p className="text-xs text-amber-600 font-medium mb-1.5">{t('processing')} ({wdProcessing.length})</p>
          <p className="text-xl font-bold text-amber-700">{formatVND(wdProcessingAmt)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-5">
          <p className="text-xs text-red-600 font-medium mb-1.5">{t('withdraw_failed')} ({wdFailed.length})</p>
          <p className="text-xl font-bold text-red-700">{formatVND(wdFailedAmt)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-xs text-gray-500 font-medium mb-1.5">{t('total_withdraw')} ({allWithdrawals.length})</p>
          <p className="text-xl font-bold text-gray-700">{formatVND(wdTotalAmt)}</p>
        </div>
      </div>

      {/* ── History always visible (full width) ── */}
      <HistoryPanel
        withdrawals={allWithdrawals}
        savedBanks={savedBanks}
        copyText={copyText}
        copiedId={copiedId}
        onWithdraw={() => { resetForm(); setStep('form') }}
      />

      {/* ── Withdraw Slideover Popup ── */}
      {step !== 'idle' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeSlideover}
          />

          {/* Slideover panel */}
          <div className="fixed inset-y-0 right-0 w-full sm:max-w-[520px] bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">
                {step === 'form' && t('create_withdraw_order')}
                {step === 'confirm' && t('confirm_withdraw')}
                {step === 'result' && t('result')}
              </h2>
              <button onClick={closeSlideover} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* ── Step 1: Form ── */}
              {step === 'form' && (
                <div className="space-y-4">
                  {/* Balance display */}
                  <div className="bg-[#FFEFED] rounded-xl p-4 text-center">
                    <p className="text-xs text-[#FF5942] font-medium mb-1">{t('available_balance')}</p>
                    <p className="text-2xl font-bold text-[#FF5942]">{formatVND(balance)}</p>
                  </div>

                  {/* Bank selector */}
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('receiving_account')}</Label>
                        <button
                          onClick={() => { setShowBankSelector(!showBankSelector); setManualMode(false) }}
                          className="text-xs text-[#FF5942] font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="size-3" />
                          {t('change')}
                        </button>
                      </div>

                      {/* Selected bank display */}
                      {!showBankSelector && selectedBank && !manualMode && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex size-9 items-center justify-center rounded-full bg-[#FFEFED]">
                            <Building2 className="size-4 text-[#FF5942]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">{selectedBank.bank_account_name}</p>
                            <p className="text-xs text-gray-500">
                              {VIETNAMESE_BANKS.find(b => b.code === selectedBank.bank_name)?.name || selectedBank.bank_name}
                            </p>
                            <p className="text-xs text-gray-500">{selectedBank.bank_account_number}</p>
                          </div>
                          {selectedBank.is_default && (
                            <Badge variant="outline" className="ml-auto text-[10px] shrink-0">{t('default_badge')}</Badge>
                          )}
                        </div>
                      )}

                      {/* Bank selector dropdown */}
                      {showBankSelector && (
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                            <Input
                              value={bankSearch}
                              onChange={(e) => setBankSearch(e.target.value)}
                              placeholder={t('search_bank')}
                              className="pl-9 h-9 text-sm"
                            />
                          </div>
                          <div className="max-h-[180px] overflow-y-auto space-y-1.5">
                            {savedBanks
                              .filter(b => {
                                if (!bankSearch) return true
                                const q = bankSearch.toLowerCase()
                                return b.bank_account_name.toLowerCase().includes(q) ||
                                  b.bank_name.toLowerCase().includes(q) ||
                                  b.bank_account_number.includes(q)
                              })
                              .map((bank) => (
                                <button
                                  key={bank.id}
                                  onClick={() => { setSelectedBank(bank); setShowBankSelector(false); setManualMode(false) }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                                    selectedBank?.id === bank.id ? 'border-[#FF5942] bg-[#FFEFED]' : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <Building2 className="size-4 text-gray-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{bank.bank_account_name}</p>
                                    <p className="text-xs text-gray-500">
                                      {VIETNAMESE_BANKS.find(b => b.code === bank.bank_name)?.name} - {bank.bank_account_number}
                                    </p>
                                  </div>
                                  {selectedBank?.id === bank.id && <Check className="size-4 text-[#FF5942]" />}
                                </button>
                              ))}
                          </div>
                          <button
                            onClick={() => { setManualMode(true); setShowBankSelector(false) }}
                            className="w-full text-sm text-[#FF5942] font-medium py-2 border border-dashed border-[#FF5942] rounded-lg hover:bg-[#FFEFED] transition-colors"
                          >
                            {t('enter_new_account')}
                          </button>
                        </div>
                      )}

                      {/* Manual bank entry */}
                      {manualMode && (
                        <div className="space-y-2.5 mt-2">
                          <div className="space-y-1">
                            <Label className="text-xs">{t('bank')}</Label>
                            <select
                              value={bankName}
                              onChange={(e) => { setBankName(e.target.value); setBankAccountName('') }}
                              className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                            >
                              <option value="">{t('select_bank')}</option>
                              {VIETNAMESE_BANKS.map((bank) => (
                                <option key={bank.code} value={bank.code}>{bank.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t('account_number')}</Label>
                            <div className="flex gap-2">
                              <Input
                                value={bankAccountNumber}
                                onChange={(e) => { setBankAccountNumber(e.target.value); setBankAccountName('') }}
                                placeholder={t('enter_account_number')}
                                className="h-9 text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={verifyBankAccount}
                                disabled={verifying || !bankName || !bankAccountNumber}
                                className="shrink-0 h-9"
                              >
                                {verifying ? t('verifying') : t('verify')}
                              </Button>
                            </div>
                          </div>
                          {bankAccountName && !verifyFailed && (
                            <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg">
                              <Check className="size-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">{bankAccountName}</span>
                            </div>
                          )}
                          {verifyFailed && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg">
                                <AlertTriangle className="size-4 text-amber-600" />
                                <span className="text-xs text-amber-700">{t('verify_failed_manual')}</span>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">{t('account_owner')}</Label>
                                <Input
                                  value={bankAccountName}
                                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                                  placeholder={t('enter_account_name')}
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Amount input */}
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">{t('amount_label')}</Label>

                      <div className="bg-[#f5f5f5] rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1.5">{t('you_withdraw')}</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="flex-1 bg-transparent text-[24px] leading-[32px] font-bold text-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min="0"
                          />
                          <span className="bg-white rounded-full px-2.5 py-1 text-xs font-bold border">VND</span>
                        </div>
                        {amountNum > balance && (
                          <p className="text-xs text-red-500 mt-1.5">{t('exceeds_balance')}</p>
                        )}
                      </div>

                      <div className="flex justify-center -my-2.5 relative z-10">
                        <div className="size-8 bg-white border-2 rounded-full flex items-center justify-center">
                          <ArrowDown className="size-3.5 text-gray-400" />
                        </div>
                      </div>

                      <div className="bg-[#f5f5f5] rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1.5">{t('you_receive')}</p>
                        <div className="flex items-center gap-2">
                          <span className="flex-1 text-[24px] leading-[32px] font-bold text-black">
                            {receiveAmount > 0 ? new Intl.NumberFormat('vi-VN').format(receiveAmount) : '0'}
                          </span>
                          <span className="bg-white rounded-full px-2.5 py-1 text-xs font-bold border">VND</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Remark */}
                  <div className="space-y-1">
                    <Label className="text-sm">{t('remark_optional')}</Label>
                    <Textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder={t('enter_remark')}
                      maxLength={75}
                      rows={2}
                    />
                  </div>

                  {/* Schedule note */}
                  <div className="flex items-start gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg text-xs">
                    <Clock className="size-4 shrink-0 mt-0.5" />
                    <span dangerouslySetInnerHTML={{ __html: t('withdraw_schedule') }} />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 bg-[#FDE8EA] text-red-700 px-3 py-2.5 rounded-lg text-sm">
                      <AlertTriangle className="size-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Policy checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreePolicy}
                      onChange={(e) => setAgreePolicy(e.target.checked)}
                      className="mt-0.5 size-[18px] rounded accent-[#FF5942]"
                    />
                    <span className="text-sm text-gray-600">
                      {t('agree_with')} <span className="text-[#FF5942] font-medium">{t('terms_of_use')}</span>
                    </span>
                  </label>

                  {/* Submit */}
                  <Button
                    onClick={handleProceed}
                    disabled={!amountNum || amountNum > balance || !agreePolicy || (!selectedBank && !manualMode)}
                    className="w-full h-11 bg-[#FF5942] hover:bg-[#e64d38] text-base font-bold disabled:bg-[#ccc]"
                  >
                    {t('create_withdrawal')}
                  </Button>
                </div>
              )}

              {/* ── Step 2: Confirm ── */}
              {step === 'confirm' && (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2.5 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('bank')}</span>
                      <span className="font-medium">{bankLabel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('account_number')}</span>
                      <span className="font-medium">{activeBankAccountNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('account_owner')}</span>
                      <span className="font-medium">{activeBankAccountName}</span>
                    </div>
                    {remark && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('remark')}</span>
                        <span className="font-medium">{remark}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('withdraw_amount')}</span>
                      <span className="font-bold text-lg">{formatVND(amountNum)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('fee')}</span>
                      <span className="font-medium text-green-600">{t('free_fee')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('you_receive')}</span>
                      <span className="font-bold text-[#FF5942]">{formatVND(receiveAmount)}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-[#FDE8EA] text-red-700 px-3 py-2.5 rounded-lg text-sm mb-4">{error}</div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" onClick={() => setStep('form')} className="flex-1 h-11">
                      {t('go_back')}
                    </Button>
                    <Button
                      onClick={handleWithdraw}
                      disabled={loading}
                      className="flex-1 h-11 bg-[#FF5942] hover:bg-[#e64d38] text-base font-bold"
                    >
                      {loading ? t('processing_withdraw') : t('confirm_withdraw_btn')}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Result ── */}
              {step === 'result' && resultData && (
                <div className="text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-[#ebf5fd] mx-auto mb-3">
                    <Clock className="size-7 text-[#309ae7]" />
                  </div>
                  <h2 className="text-lg font-bold mb-1">{t('withdraw_processing')}</h2>
                  <p className="text-xl font-bold text-[#FF5942] mb-4">{formatVND(Number(resultData.amount))}</p>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2.5 text-left mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('withdraw_code')}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{resultData.hpay_request_id}</span>
                        <button onClick={() => copyText(resultData.hpay_request_id, 'wd-id')}>
                          {copiedId === 'wd-id' ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('time')}</span>
                      <span className="font-medium">{new Date(resultData.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('bank')}</span>
                      <span className="font-medium">
                        {VIETNAMESE_BANKS.find(b => b.code === resultData.bank_name)?.name || resultData.bank_name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('account_number')}</span>
                      <span className="font-medium">{resultData.bank_account_number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('account_owner')}</span>
                      <span className="font-medium">{resultData.bank_account_name}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg text-xs text-left mb-4">
                    <Clock className="size-4 shrink-0 mt-0.5" />
                    <span dangerouslySetInnerHTML={{ __html: t('withdraw_schedule_short') }} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={closeSlideover}
                      className="flex-1 h-11"
                    >
                      {t('close')}
                    </Button>
                    <Button
                      onClick={() => { resetForm(); setStep('form') }}
                      className="flex-1 h-11 bg-[#FF5942] hover:bg-[#e64d38] text-base font-bold"
                    >
                      {t('create_new_order')}
                    </Button>
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

/* ===================================================================
   History Panel Component
   =================================================================== */

function HistoryPanel({ withdrawals, savedBanks, copyText, copiedId, onWithdraw }: {
  withdrawals: Withdrawal[]
  savedBanks: BankAccount[]
  copyText: (text: string, id: string) => void
  copiedId: string | null
  onWithdraw: () => void
}) {
  const { t } = useI18n()
  const [timeRange, setTimeRange] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [bankFilter, setBankFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQ, setSearchQ] = useState('')

  const TIME_RANGES = useMemo(() => [
    { key: 'all', label: t('all') },
    { key: 'today', label: t('today') },
    { key: 'this_week', label: t('this_week') },
    { key: 'this_month', label: t('this_month') },
    { key: 'custom', label: t('custom') },
  ] as const, [t])

  const STATUS_FILTERS = useMemo(() => [
    { value: '', label: t('all_status') },
    { value: 'success', label: t('success_status') },
    { value: 'processing', label: t('processing_status') },
    { value: 'failed', label: t('failed_status') },
  ], [t])

  const userBanks = useMemo(() => {
    const codes = new Set(savedBanks.map((b: BankAccount) => b.bank_name))
    return Array.from(codes).map(code => ({
      code,
      name: VIETNAMESE_BANKS.find(b => b.code === code)?.name || code,
    }))
  }, [savedBanks])

  const filtered = useMemo(() => {
    return withdrawals.filter(w => {
      // Time filter
      if (timeRange === 'custom') {
        if (customStart && new Date(w.created_at) < new Date(customStart)) return false
        if (customEnd && new Date(w.created_at) > new Date(customEnd + 'T23:59:59')) return false
      } else if (timeRange !== 'all') {
        const range = getTimeRange(timeRange)
        if (range) {
          const d = new Date(w.created_at)
          if (d < range.start || d > range.end) return false
        }
      }
      // Bank filter
      if (bankFilter && w.bank_name !== bankFilter) return false
      // Status filter
      if (statusFilter && w.status !== statusFilter) return false
      // Search
      if (searchQ) {
        const q = searchQ.toLowerCase()
        if (!(w.hpay_request_id || '').toLowerCase().includes(q) &&
            !w.bank_account_number.includes(q) &&
            !w.bank_account_name.toLowerCase().includes(q) &&
            !(w.note || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [withdrawals, timeRange, customStart, customEnd, bankFilter, statusFilter, searchQ])

  const hasFilters = searchQ || bankFilter || statusFilter || timeRange === 'custom'

  function clearFilters() {
    setSearchQ('')
    setBankFilter('')
    setStatusFilter('')
    setTimeRange('all')
    setCustomStart('')
    setCustomEnd('')
  }

  return (
    <div>
      {/* Time range buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Calendar className="size-4 text-gray-400" />
        {TIME_RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setTimeRange(r.key)}
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

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {timeRange === 'custom' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-10 w-[145px] text-sm" />
            <span className="text-gray-300">&mdash;</span>
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-10 w-[145px] text-sm" />
          </div>
        )}

        <select
          value={bankFilter}
          onChange={(e) => setBankFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[140px]"
        >
          <option value="">{t('all_banks_filter')}</option>
          {userBanks.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm min-w-[140px]"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t('search_withdraw')}
            className="pl-10 h-10"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 gap-1">
            <X className="size-3.5" /> {t('clear_filters')}
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} {t('withdrawal_history')}</p>

      {/* History table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[650px]">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>{t('wd_transaction_id')}</TableHead>
                    <TableHead>{t('wd_bank')}</TableHead>
                    <TableHead className="text-right">{t('wd_amount')}</TableHead>
                    <TableHead>{t('wd_content')}</TableHead>
                    <TableHead>{t('wd_time')}</TableHead>
                    <TableHead className="text-center w-[90px]">{t('wd_status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((w: Withdrawal) => {
                    const st = STATUS_STYLES[w.status] || STATUS_STYLES.processing
                    const wBankLabel = VIETNAMESE_BANKS.find((b: { code: string }) => b.code === w.bank_name)?.name || w.bank_name
                    return (
                      <TableRow key={w.id} className="group hover:bg-gray-50">
                        <TableCell>
                          <div className="flex size-7 items-center justify-center rounded-full bg-orange-50">
                            <ArrowDown className="size-3.5 text-orange-600 rotate-180" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-gray-600 max-w-[110px] truncate" title={w.hpay_request_id || w.id}>
                              {w.hpay_request_id || w.id}
                            </span>
                            <button onClick={() => copyText(w.hpay_request_id || w.id, w.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {copiedId === w.id ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-gray-300" />}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{wBankLabel}</p>
                            <p className="font-mono text-[10px] text-gray-400">{w.bank_account_number}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold text-orange-600">-{formatVND(Number(w.amount))}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500 max-w-[120px] truncate block" title={w.note || ''}>
                            {w.note || '\u2014'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="text-gray-700">{new Date(w.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            <br />
                            <span className="text-gray-400">{new Date(w.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
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
          ) : (
            <div className="py-16 text-center">
              <CircleOff className="size-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">{t('no_withdraw_transactions')}</p>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 text-[#FF5942]">
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

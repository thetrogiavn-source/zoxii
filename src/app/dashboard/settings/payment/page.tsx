'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VIETNAMESE_BANKS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { BankAccount } from '@/types'
import { useI18n } from '@/lib/i18n'

export default function PaymentSettingsPage() {
  const { t } = useI18n()
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadBankAccounts()
  }, [])

  async function loadBankAccounts() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setBankAccounts(data)
  }

  async function verifyBank() {
    if (!bankName || !bankAccountNumber) return
    setVerifying(true)
    setBankAccountName('')

    const res = await fetch('/api/hpay/verify-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankName, bankAccountNumber }),
    })
    const json = await res.json()
    setVerifying(false)

    if (json.data?.bankAccountName) {
      setBankAccountName(json.data.bankAccountName)
    } else {
      setError(t('cannot_verify_bank_account'))
    }
  }

  async function handleAddBank(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isDefault = bankAccounts.length === 0

    const { error: insertError } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: user.id,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName,
        is_default: isDefault,
      })

    setLoading(false)

    if (insertError) {
      setError(t('add_failed'))
    } else {
      setSuccess(t('add_success'))
      setBankName('')
      setBankAccountNumber('')
      setBankAccountName('')
      setShowAddForm(false)
      loadBankAccounts()
    }
  }

  async function setDefaultAccount(accountId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Remove default from all
    await supabase
      .from('bank_accounts')
      .update({ is_default: false })
      .eq('user_id', user.id)

    // Set new default
    await supabase
      .from('bank_accounts')
      .update({ is_default: true })
      .eq('id', accountId)

    loadBankAccounts()
  }

  async function deleteAccount(accountId: string) {
    if (!confirm(t('confirm_delete_bank'))) return

    const supabase = createClient()
    await supabase.from('bank_accounts').delete().eq('id', accountId)
    loadBankAccounts()
  }

  const getBankLabel = (code: string) => {
    const bank = VIETNAMESE_BANKS.find((b) => b.code === code)
    return bank ? bank.name : code
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Bank Accounts List */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('bank_accounts')}</h2>
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? t('cancel') : t('add_account')}
            </Button>
          </div>

          {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>}

          {bankAccounts.length > 0 ? (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getBankLabel(account.bank_name)}</p>
                      {account.is_default && (
                        <Badge variant="default">{t('default_badge')}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {account.bank_account_number} - {account.bank_account_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!account.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultAccount(account.id)}
                      >
                        {t('set_default')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteAccount(account.id)}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {t('no_bank_accounts')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Bank Account Form */}
      {showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">{t('add_bank_account')}</h2>

            {error && <div className="bg-[#FDE8EA] text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

            <form onSubmit={handleAddBank} className="space-y-5">
              <div className="space-y-2">
                <Label>{t('bank')}</Label>
                <Select value={bankName} onValueChange={(v) => setBankName(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('select_bank_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {VIETNAMESE_BANKS.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('account_number')}</Label>
                <Input
                  className="h-12"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder={t('enter_account_number')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('account_name')}</Label>
                <Input
                  className="h-12"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder={t('account_name_placeholder')}
                  required
                />
              </div>
              <Button type="submit" className="h-12 bg-[#FF5942] hover:bg-[#e64d38]" disabled={loading || !bankAccountName || !bankAccountNumber}>
                {loading ? t('saving') : t('add_account')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

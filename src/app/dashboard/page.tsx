import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('id, amount, fee, net_amount, time_paid, status, va_account')
    .eq('user_id', user!.id)
    .order('time_paid', { ascending: true })

  const { data: allWithdrawals } = await supabase
    .from('withdrawals')
    .select('id, amount, status, created_at, bank_name, bank_account_number')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardContent
      displayName={profile?.full_name || user!.email?.split('@')[0] || 'Seller'}
      transactions={allTransactions || []}
      withdrawals={allWithdrawals || []}
    />
  )
}

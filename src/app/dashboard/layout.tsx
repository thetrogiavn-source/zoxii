import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from './dashboard-layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <DashboardLayoutClient
      userName={profile?.full_name || user.email || 'Seller'}
      email={user.email || ''}
      kycStatus={profile?.kyc_status || 'none'}
      kycLevel={profile?.kyc_level ?? 0}
      tier={profile?.tier || 'FREE'}
      isAdmin={profile?.role === 'admin'}
      avatarUrl={undefined}
    >
      {children}
    </DashboardLayoutClient>
  )
}

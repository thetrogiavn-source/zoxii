import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar
        adminName={profile.full_name || user.email || 'Admin'}
        email={user.email || ''}
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader
          userName={profile.full_name || user.email || 'Admin'}
          email={user.email || ''}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

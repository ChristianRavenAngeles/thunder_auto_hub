import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopBar from '@/components/admin/AdminTopBar'
import AdminSessionTimeoutGuard from '@/components/admin/AdminSessionTimeoutGuard'

export const metadata = { title: 'Admin — Thunder Auto Hub' }

export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/admin')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!['admin', 'manager', 'staff', 'super_admin'].includes(profile?.role)) redirect('/account')
  const { data: timeoutSetting } = await supabase.from('settings').select('value').eq('key', 'admin_session_timeout_minutes').single()
  const timeoutMinutes = Number(timeoutSetting?.value || 15)

  return (
    <div className="dashboard-shell">
      <AdminSessionTimeoutGuard timeoutMinutes={Number.isFinite(timeoutMinutes) ? timeoutMinutes : 15} />
      <AdminSidebar profile={profile} />
      <div className="dashboard-main">
        <AdminTopBar profile={profile} />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}

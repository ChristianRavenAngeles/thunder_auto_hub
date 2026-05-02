import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RiderSidebar from '@/components/rider/RiderSidebar'

export const metadata = { title: 'Rider Portal - Thunder Auto Hub' }

export default async function RiderLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/rider/jobs')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!['rider', 'admin', 'super_admin'].includes(profile?.role)) redirect('/account')

  return (
    <div className="dashboard-shell">
      <RiderSidebar profile={profile} />
      <div className="dashboard-main">
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}

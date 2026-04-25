import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerSidebar from '@/components/customer/CustomerSidebar'
import CustomerTopBar from '@/components/customer/CustomerTopBar'

export const metadata = { title: 'My Account — Thunder Auto Hub' }

export default async function AccountLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="dashboard-shell">
      <CustomerSidebar profile={profile} />
      <div className="dashboard-main">
        <CustomerTopBar profile={profile} />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}

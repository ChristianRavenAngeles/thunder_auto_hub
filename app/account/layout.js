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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0B0B0B' }}>
      <CustomerSidebar profile={profile} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <CustomerTopBar profile={profile} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#0B0B0B' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

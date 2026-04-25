import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RiderSidebar from '@/components/rider/RiderSidebar'

export const metadata = { title: 'Rider Dashboard — Thunder Auto Hub' }

export default async function RiderLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/rider')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!['rider', 'admin', 'super_admin'].includes(profile?.role)) redirect('/account')

  return (
    <div className="min-h-screen bg-[var(--bg-2)] flex">
      <RiderSidebar profile={profile} />
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}

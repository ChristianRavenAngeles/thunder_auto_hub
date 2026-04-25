import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClipboardList, Star, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { formatDate, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'

export default async function RiderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: profile },
    { data: todayJobs },
    { data: staff },
    { data: recentJobs },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bookings').select('*, profiles(full_name, phone), vehicles(make, model, tier), booking_services(service_name)').eq('rider_id', user.id).eq('scheduled_date', today).order('scheduled_time'),
    supabase.from('staff').select('*').eq('user_id', user.id).single(),
    supabase.from('bookings').select('*, profiles(full_name), vehicles(make, model)').eq('rider_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-thunder-dark">Kumusta, {profile?.full_name?.split(' ')[0]}! 🏍️</h1>
        <p className="text-[var(--text-muted)] text-sm">{formatDate(new Date())} — Handa ka na ba?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Jobs Done', value: staff?.jobs_completed || 0, icon: CheckCircle, color: 'text-green-500' },
          { label: "Today's Jobs", value: todayJobs?.length || 0, icon: ClipboardList, color: 'text-brand-500' },
          { label: 'My Rating', value: staff?.rating_avg ? `${staff.rating_avg}★` : '—', icon: Star, color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
            <div className="text-xl font-bold font-display text-thunder-dark">{s.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today's jobs */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold font-display text-thunder-dark flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" /> Today&apos;s Jobs
          </h2>
          <Link href="/rider/jobs" className="text-xs text-brand-500 hover:underline">All jobs →</Link>
        </div>
        {!todayJobs?.length ? (
          <p className="text-[var(--text-muted)] text-sm text-center py-4">Walang nakaplanong job ngayon. Rest muna! 😄</p>
        ) : (
          <div className="space-y-3">
            {todayJobs.map(job => (
              <Link key={job.id} href={`/rider/jobs/${job.id}`}
                className="block p-4 rounded-xl border border-[var(--border)] hover:border-brand-200 hover:bg-brand-50/30 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-thunder-dark text-sm">{job.reference_no}</p>
                    <p className="text-xs text-[var(--text-muted)]">{job.profiles?.full_name} • {job.scheduled_time}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{job.barangay}, {job.city}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{job.vehicles ? `${job.vehicles.make} ${job.vehicles.model} (${job.vehicles.tier})` : ''}</p>
                  </div>
                  <div className="text-right">
                    <span className={BOOKING_STATUS_LABELS[job.status]?.color}>{BOOKING_STATUS_LABELS[job.status]?.label}</span>
                    <p className="text-xs font-bold text-brand-600 mt-1">{formatPrice(job.total_price)}</p>
                  </div>
                </div>
                {job.booking_services?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {job.booking_services.map(s => (
                      <span key={s.service_name} className="badge-teal text-xs">{s.service_name}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

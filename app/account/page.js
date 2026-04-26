import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Car, Crown, Star, ArrowRight, Plus, Clock, RefreshCw, Wrench } from 'lucide-react'
import { formatDate, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'

export default async function AccountDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: bookings },
    { data: vehicles },
    { data: membership },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bookings').select('*, booking_services(service_name, services(category, slug)), vehicles(make, model)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12),
    supabase.from('vehicles').select('*').eq('user_id', user.id).limit(3),
    supabase.from('memberships').select('*, membership_plans(name)').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1),
  ])

  const activeBooking = bookings?.find(b => ['pending', 'confirmed', 'rescheduled', 'in_progress'].includes(b.status))
  const rebookSuggestions = buildRebookSuggestions(bookings || [])
  const recentBookings = (bookings || []).slice(0, 5)

  const stats = [
    { label: 'Total Bookings',    value: profile?.booking_count || 0,          icon: Calendar, href: '/account/bookings' },
    { label: 'My Vehicles',       value: vehicles?.length || 0,                 icon: Car,      href: '/account/vehicles' },
    { label: 'Loyalty Points',    value: (profile?.loyalty_points || 0).toLocaleString(), icon: Star, href: '#' },
    { label: 'Total Spent',       value: formatPrice(profile?.total_spent || 0), icon: Crown,   href: '#' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Active booking alert */}
      {activeBooking && (
        <div className="card p-4 bg-brand-50 border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-thunder-dark text-sm">Active Booking</p>
              <p className="text-xs text-[var(--text-muted)]">
                {activeBooking.reference_no} —
                <span className={`ml-1 ${BOOKING_STATUS_LABELS[activeBooking.status]?.color}`}>
                  {BOOKING_STATUS_LABELS[activeBooking.status]?.label}
                </span>
              </p>
            </div>
          </div>
          <Link href={`/track/${activeBooking.reference_no}`} className="btn-primary !py-2 !px-4 !text-xs flex-shrink-0 w-full sm:w-auto text-center">
            Track <ArrowRight className="w-3 h-3 inline ml-1" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="card p-4 group hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <s.icon className="w-5 h-5 text-brand-500" />
              <ArrowRight className="w-4 h-4 text-[var(--text-2)] group-hover:text-brand-400 transition-colors" />
            </div>
            <div className="text-xl font-bold font-display text-thunder-dark">{s.value}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {rebookSuggestions.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold font-display text-thunder-dark">Suggested Next Bookings</h2>
            <Link href="/account/bookings" className="text-xs text-brand-500 hover:underline">History</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rebookSuggestions.map(item => (
              <Link key={item.title} href={item.href} className="rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-4 hover:bg-brand-50 transition-colors">
                <item.icon className="w-5 h-5 text-brand-500 mb-3" />
                <p className="text-sm font-semibold text-thunder-dark">{item.title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold font-display text-thunder-dark">Recent Bookings</h2>
            <Link href="/account/bookings" className="text-xs text-brand-500 hover:underline">View all</Link>
          </div>
          {!recentBookings.length ? (
            <div className="text-center py-6">
              <p className="text-[var(--text-muted)] text-sm mb-3">Wala pang bookings.</p>
              <Link href="/book" className="btn-primary !py-2 !px-4 !text-sm inline-flex items-center gap-1">
                <Plus className="w-3 h-3" /> Book Now
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBookings.map(b => {
                const meta = BOOKING_STATUS_LABELS[b.status]
                return (
                  <Link key={b.id} href={`/track/${b.reference_no}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-2)] transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      b.status === 'completed' ? 'bg-green-400' :
                      b.status === 'in_progress' || b.status === 'rescheduled' ? 'bg-amber-400 animate-pulse' :
                      b.status === 'cancelled' ? 'bg-red-400' : 'bg-brand-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-thunder-dark truncate">{b.reference_no}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatDate(b.scheduled_date)} • {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : ''}</p>
                    </div>
                    <span className={meta?.color + ' flex-shrink-0 text-xs'}>{meta?.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Membership & vehicles */}
        <div className="space-y-4">
          {membership?.[0] ? (
            <div className="card-dark p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-thunder-gold" />
                  <span className="font-bold text-[var(--text)] font-display">{membership[0].membership_plans?.name}</span>
                </div>
                <span className="badge-teal">Active</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[var(--surface)]/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold font-display text-[var(--text)]">{membership[0].wash_credits}</div>
                  <div className="text-[var(--text-2)] text-xs mt-0.5">Wash Credits</div>
                </div>
                <div className="bg-[var(--surface)]/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold font-display text-[var(--text)]">{membership[0].glow_credits}</div>
                  <div className="text-[var(--text-2)] text-xs mt-0.5">Glow Credits</div>
                </div>
              </div>
              {membership[0].expires_at && (
                <p className="text-[var(--text-muted)] text-xs mt-3">Expires: {formatDate(membership[0].expires_at)}</p>
              )}
            </div>
          ) : (
            <div className="card p-5 border-dashed border-2 border-[var(--border)] text-center">
              <Crown className="w-8 h-8 text-[var(--text-2)] mx-auto mb-2" />
              <p className="text-sm font-medium text-[var(--text-2)] mb-1">No Active Membership</p>
              <p className="text-xs text-[var(--text-muted)] mb-3">Get Thunder Essential for regular savings!</p>
              <Link href="/book?type=membership" className="btn-gold !py-2 !px-4 !text-sm inline-block">Get Membership</Link>
            </div>
          )}

          {/* Quick links */}
          <div className="card p-4">
            <h3 className="font-bold text-thunder-dark font-display text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/book',               label: 'Book Service',  icon: Plus      },
                { href: '/account/bookings',   label: 'My Bookings',   icon: Calendar  },
                { href: '/account/vehicles',   label: 'My Vehicles',   icon: Car       },
                { href: '/account/membership', label: 'Membership',    icon: Crown     },
              ].map(a => (
                <Link key={a.href} href={a.href} className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-2)] hover:bg-brand-50 hover:text-brand-700 transition-colors text-xs font-medium text-[var(--text-2)]">
                  <a.icon className="w-4 h-4" /> {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildRebookSuggestions(bookings) {
  const completed = bookings.filter(b => b.status === 'completed')
  if (!completed.length) return []

  const latest = completed[0]
  const service = latest.booking_services?.[0]
  const serviceName = service?.service_name || 'your last service'
  const vehicleName = latest.vehicles ? `${latest.vehicles.make} ${latest.vehicles.model}` : 'your vehicle'
  const category = service?.services?.category || ''

  const maintenanceSlug =
    category === 'coating' ? 'car-care-deluxe' :
    category === 'detailing' ? 'basic-glow' :
    category === 'wash' ? 'interior-detailing' :
    'basic-wash'

  return [
    {
      title: 'Book again',
      body: `Repeat ${serviceName} for ${vehicleName}.`,
      href: `/book?rebook=${latest.id}`,
      icon: RefreshCw,
    },
    {
      title: 'Same service next month',
      body: 'Prefills the same details and aims for the next available slot around next month.',
      href: `/book?rebook=${latest.id}&nextMonth=1`,
      icon: Calendar,
    },
    {
      title: 'Recommended maintenance',
      body: 'A follow-up service based on your recent vehicle care history.',
      href: `/book?rebook=${latest.id}&service=${maintenanceSlug}`,
      icon: Wrench,
    },
  ]
}

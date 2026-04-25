import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, ChevronRight, RefreshCw, X, Clock } from 'lucide-react'
import { formatDate, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'

export const metadata = { title: 'My Bookings — Thunder Auto Hub' }
export const dynamic = 'force-dynamic'

const STATUS_COLOR = {
  pending:    'badge-gray',
  confirmed:  'badge-teal',
  en_route:   'badge-teal',
  in_progress:'badge-teal',
  completed:  'badge-green',
  cancelled:  'badge-red',
  rescheduled:'badge-gold',
}

export default async function AccountBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, booking_services(service_name, price), vehicles(make, model, plate_number)')
    .eq('user_id', user.id)
    .order('scheduled_date', { ascending: false })

  const active = (bookings || []).filter(b => !['completed','cancelled'].includes(b.status))
  const past   = (bookings || []).filter(b =>  ['completed','cancelled'].includes(b.status))

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">My Bookings</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Track and manage your car care appointments.</p>
        </div>
        <Link href="/book" className="btn-primary flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Book Now
        </Link>
      </div>

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-3">Active</h2>
          <div className="space-y-3">
            {active.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Past</h2>
          <div className="space-y-3">
            {past.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        </section>
      )}

      {(!bookings || bookings.length === 0) && (
        <div className="card p-12 text-center">
          <Calendar className="w-10 h-10 text-[var(--text-2)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)] font-medium">Wala pang bookings</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">I-book na ang inyong first appointment!</p>
          <Link href="/book" className="btn-primary inline-block">Book a Service</Link>
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking: b }) {
  const services = b.booking_services?.map(s => s.service_name).join(', ') || '—'
  const vehicle  = b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : '—'
  const isCompleted = b.status === 'completed'
  const isCancellable = ['pending','confirmed'].includes(b.status)

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-thunder-dark">{services}</p>
          <p className="text-sm text-[var(--text-muted)]">{vehicle} · {b.vehicles?.plate_number}</p>
        </div>
        <span className={`${STATUS_COLOR[b.status] || 'badge-gray'} text-xs`}>
          {BOOKING_STATUS_LABELS[b.status]?.label || b.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-4">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(b.scheduled_date)} {b.scheduled_time}</span>
        <span className="font-semibold text-thunder-dark">{formatPrice(b.total_amount)}</span>
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
        <Link href={`/track/${b.ref_number}`} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
          Track <ChevronRight className="w-3 h-3" />
        </Link>
        {isCompleted && (
          <Link href={`/review/${b.id}`} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
            Leave Review <ChevronRight className="w-3 h-3" />
          </Link>
        )}
        {isCompleted && (
          <Link href={`/book?rebook=${b.id}`} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Rebook
          </Link>
        )}
        {isCancellable && (
          <span className="text-xs text-red-400 ml-auto flex items-center gap-1 cursor-pointer hover:text-red-600">
            <X className="w-3 h-3" /> Cancel
          </span>
        )}
      </div>
    </div>
  )
}

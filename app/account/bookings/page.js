import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Calendar, ChevronRight, Clock, RefreshCw, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'
import {
  ACTIVE_BOOKING_STATUSES,
  buildAvailableSlotOptions,
  buildTimeSlots,
  displayTime,
  isSlotAvailable,
  settingsFromRows,
} from '@/lib/availability'

export const metadata = { title: 'My Bookings - Thunder Auto Hub' }
export const dynamic = 'force-dynamic'

const STATUS_COLOR = {
  pending:     'badge-gray',
  confirmed:   'badge-teal',
  rescheduled: 'badge-gold',
  in_progress: 'badge-teal',
  completed:   'badge-green',
  cancelled:   'badge-red',
  no_show:      'badge-red',
}

async function getBlackoutDates(admin) {
  const { data } = await admin.from('blackout_dates').select('date')
  return (data || []).map(row => row.date)
}

async function getOccupiedSlots(admin) {
  const { data } = await admin
    .from('bookings')
    .select('id, scheduled_date, scheduled_time')
    .in('status', ACTIVE_BOOKING_STATUSES)
  return data || []
}

async function getSettings(admin) {
  const { data } = await admin.from('settings').select('key, value')
  return settingsFromRows(data || [])
}

async function getSlotBlocks(admin) {
  const { data } = await admin.from('booking_slot_blocks').select('date, start_time, end_time, is_full_day')
  return data || []
}

async function notifyAdmins(admin, payload) {
  const { data: admins } = await admin
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'manager', 'super_admin'])

  if (!admins?.length) return
  await admin.from('notifications').insert(admins.map(a => ({ user_id: a.id, ...payload })))
}

async function getOwnedBooking(admin, userId, bookingId) {
  const { data } = await admin
    .from('bookings')
    .select('id, user_id, reference_no, status, scheduled_date, scheduled_time')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .single()
  return data
}

async function rescheduleBooking(formData) {
  'use server'

  const bookingId = formData.get('booking_id')
  const slot = String(formData.get('slot') || '')
  const [nextDate, nextTime] = slot.split('|')
  const reason = String(formData.get('reason') || '').trim()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !bookingId || !nextDate || !nextTime || !reason) return

  const admin = createAdminClient()
  const [settings, blackoutDates, slotBlocks, occupiedSlots] = await Promise.all([
    getSettings(admin),
    getBlackoutDates(admin),
    getSlotBlocks(admin),
    getOccupiedSlots(admin),
  ])

  const booking = await getOwnedBooking(admin, user.id, bookingId)
  if (!booking || !['pending', 'confirmed', 'rescheduled'].includes(booking.status)) return

  const normalizedTime = String(nextTime || '').slice(0, 5)
  const slotOk = isSlotAvailable({
    date: nextDate,
    time: normalizedTime,
    settings,
    blackoutDates,
    slotBlocks,
    occupiedBookings: occupiedSlots,
    excludeBookingId: booking.id,
  })
  if (!slotOk || !buildTimeSlots(settings).some(slot => slot.value === normalizedTime)) return

  await admin.from('bookings').update({
    status: 'rescheduled',
    scheduled_date: nextDate,
    scheduled_time: normalizedTime,
    updated_at: new Date().toISOString(),
  }).eq('id', booking.id)

  await admin.from('booking_status_history').insert({
    booking_id: booking.id,
    changed_by: user.id,
    actor_role: 'customer',
    action: 'reschedule_requested',
    from_status: booking.status,
    to_status: 'rescheduled',
    from_scheduled_date: booking.scheduled_date,
    from_scheduled_time: booking.scheduled_time,
    to_scheduled_date: nextDate,
    to_scheduled_time: normalizedTime,
    reason,
    note: 'Customer selected a new service schedule.',
  })

  await notifyAdmins(admin, {
    type: 'system',
    channel: 'in_app',
    title: 'Booking Rescheduled',
    body: `${booking.reference_no} was rescheduled by the customer.`,
    data: { booking_id: booking.id },
  })

  revalidatePath('/account/bookings')
  revalidatePath(`/track/${booking.reference_no}`)
}

async function cancelBooking(formData) {
  'use server'

  const bookingId = formData.get('booking_id')
  const reason = String(formData.get('reason') || '').trim()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !bookingId || !reason) return

  const admin = createAdminClient()
  const booking = await getOwnedBooking(admin, user.id, bookingId)
  if (!booking || !['pending', 'confirmed', 'rescheduled'].includes(booking.status)) return

  await admin.from('bookings').update({
    status: 'cancelled',
    cancellation_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq('id', booking.id)

  await admin.from('booking_status_history').insert({
    booking_id: booking.id,
    changed_by: user.id,
    actor_role: 'customer',
    action: 'cancelled_by_customer',
    from_status: booking.status,
    to_status: 'cancelled',
    from_scheduled_date: booking.scheduled_date,
    from_scheduled_time: booking.scheduled_time,
    reason,
    note: 'Customer cancelled from the account dashboard.',
  })

  await notifyAdmins(admin, {
    type: 'system',
    channel: 'in_app',
    title: 'Booking Cancelled',
    body: `${booking.reference_no} was cancelled by the customer.`,
    data: { booking_id: booking.id },
  })

  revalidatePath('/account/bookings')
  revalidatePath(`/track/${booking.reference_no}`)
}

export default async function AccountBookingsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: bookings }, settings, blackoutDates, occupiedSlots, slotBlocks] = await Promise.all([
    admin
      .from('bookings')
      .select('*, booking_services(service_name, unit_price, subtotal), vehicles(make, model, plate, tier), booking_status_history(*)')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: false }),
    getSettings(admin),
    getBlackoutDates(admin),
    getOccupiedSlots(admin),
    getSlotBlocks(admin),
  ])

  const slotOptions = buildAvailableSlotOptions({
    settings,
    blackoutDates,
    slotBlocks,
    occupiedBookings: occupiedSlots,
    days: 45,
    limit: 40,
  })
  const active = (bookings || []).filter(b => !['completed', 'cancelled'].includes(b.status))
  const past = (bookings || []).filter(b => ['completed', 'cancelled'].includes(b.status))

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">My Bookings</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Track, reschedule, or cancel your appointments.</p>
        </div>
        <Link href="/book" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4" /> Book Now
        </Link>
      </div>

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-3">Active</h2>
          <div className="space-y-3">
            {active.map(b => <BookingCard key={b.id} booking={b} slotOptions={slotOptions} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Past</h2>
          <div className="space-y-3">
            {past.map(b => <BookingCard key={b.id} booking={b} slotOptions={slotOptions} />)}
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

function BookingCard({ booking: b, slotOptions }) {
  const services = b.booking_services?.map(s => s.service_name).join(', ') || '-'
  const vehicle = b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : '-'
  const plate = b.vehicles?.plate
  const isCompleted = b.status === 'completed'
  const canSelfManage = ['pending', 'confirmed', 'rescheduled'].includes(b.status)
  const history = [...(b.booking_status_history || [])].sort((a, z) => new Date(z.created_at) - new Date(a.created_at))

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-thunder-dark">{services}</p>
          <p className="text-sm text-[var(--text-muted)]">{vehicle}{plate ? ` - ${plate}` : ''}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{b.reference_no}</p>
        </div>
        <span className={`${STATUS_COLOR[b.status] || 'badge-gray'} text-xs`}>
          {BOOKING_STATUS_LABELS[b.status]?.label || b.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> {formatDate(b.scheduled_date)} {displayTime(b.scheduled_time)}
        </span>
        <span className="font-semibold text-thunder-dark">{formatPrice(b.total_price || 0)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border)]">
        <Link href={`/track/${b.reference_no}`} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
          Track <ChevronRight className="w-3 h-3" />
        </Link>
        {isCompleted && (
          <>
            <Link href={`/review/${b.id}`} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
              Leave Review <ChevronRight className="w-3 h-3" />
            </Link>
            <Link href={`/book?rebook=${b.id}`} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Rebook
            </Link>
          </>
        )}
      </div>

      {canSelfManage && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <details className="rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-thunder-dark">Request Reschedule</summary>
            <form action={rescheduleBooking} className="mt-3 space-y-3">
              <input type="hidden" name="booking_id" value={b.id} />
              <select name="slot" className="input !py-2 text-sm" required defaultValue="">
                <option value="" disabled>Choose available slot</option>
                {slotOptions.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
              </select>
              <textarea name="reason" className="input resize-none text-sm" rows={2} placeholder="Reason for rescheduling" required />
              <button className="btn-primary w-full !py-2 !text-sm" type="submit">Submit Reschedule</button>
            </form>
          </details>

          <details className="rounded-xl border border-red-100 bg-red-50/40 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-red-600">Cancel Booking</summary>
            <form action={cancelBooking} className="mt-3 space-y-3">
              <input type="hidden" name="booking_id" value={b.id} />
              <textarea name="reason" className="input resize-none text-sm" rows={2} placeholder="Cancellation reason" required />
              <button className="w-full !py-2 !text-sm flex items-center justify-center gap-2 rounded-lg bg-red-500 text-white font-semibold" type="submit">
                <X className="w-3.5 h-3.5" /> Cancel Booking
              </button>
            </form>
          </details>
        </div>
      )}

      {history.length > 0 && (
        <details className="mt-4 rounded-xl border border-[var(--border)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-thunder-dark">Status History</summary>
          <div className="mt-3 space-y-3">
            {history.map(item => (
              <div key={item.id} className="border-l-2 border-brand-200 pl-3 text-sm">
                <p className="font-medium text-thunder-dark">{historyTitle(item)}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatDate(item.created_at)} by {item.actor_role || 'system'}</p>
                {item.to_scheduled_date && (
                  <p className="text-xs text-[var(--text-2)] mt-1">
                    New schedule: {formatDate(item.to_scheduled_date)} {displayTime(item.to_scheduled_time)}
                  </p>
                )}
                {item.reason && <p className="text-xs text-[var(--text-muted)] mt-1">Reason: {item.reason}</p>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function historyTitle(item) {
  if (item.action === 'reschedule_requested') return 'Reschedule submitted'
  if (item.action === 'cancelled_by_customer') return 'Cancelled by customer'
  if (item.action === 'booking_created') return 'Booking created'
  if (item.action === 'payment_confirmed') return 'Payment confirmed'
  if (item.from_status || item.to_status) {
    return `${item.from_status || 'status'} -> ${item.to_status || 'status'}`
  }
  return item.action?.replace(/_/g, ' ') || 'Booking updated'
}

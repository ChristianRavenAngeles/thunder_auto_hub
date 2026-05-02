import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Calendar, ChevronRight, Clock, RefreshCw, Save, X } from 'lucide-react'
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
import { buildBookingTimeline } from '@/lib/bookingTimeline'
import { safeInsertAuditLog } from '@/lib/audit'

export const metadata = { title: 'My Bookings - Thunder Auto Hub' }
export const dynamic = 'force-dynamic'

const STATUS_COLOR = {
  pending:     'badge-gray',
  confirmed:   'badge-teal',
  assigned:    'badge-teal',
  on_the_way:  'badge-gold',
  rescheduled: 'badge-gold',
  in_progress: 'badge-teal',
  completed:   'badge-green',
  cancelled:   'badge-red',
  no_show:      'badge-red',
}

const DEFAULT_SELF_SERVICE_RULES = {
  rescheduleCutoffHours: 6,
  cancelCutoffHours: 3,
}

function settingNumber(settings, key, fallback) {
  const value = settings?.[key]
  if (value == null) return fallback
  const parsed = Number(typeof value === 'object' && value?.value != null ? value.value : value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getSelfServiceRules(settings) {
  return {
    rescheduleCutoffHours: settingNumber(settings, 'customer_reschedule_cutoff_hours', DEFAULT_SELF_SERVICE_RULES.rescheduleCutoffHours),
    cancelCutoffHours: settingNumber(settings, 'customer_cancel_cutoff_hours', DEFAULT_SELF_SERVICE_RULES.cancelCutoffHours),
  }
}

function bookingDateTime(booking) {
  if (!booking?.scheduled_date) return null
  return new Date(`${booking.scheduled_date}T${String(booking.scheduled_time || '08:00').slice(0, 5)}:00`)
}

function hoursUntilBooking(booking) {
  const start = bookingDateTime(booking)
  if (!start) return Infinity
  return (start.getTime() - Date.now()) / (1000 * 60 * 60)
}

function getSelfServiceAvailability(booking, rules) {
  const eligibleStatus = ['pending', 'confirmed', 'rescheduled'].includes(booking.status)
  const hoursUntil = hoursUntilBooking(booking)
  const canReschedule = eligibleStatus && hoursUntil >= rules.rescheduleCutoffHours
  const canCancel = eligibleStatus && hoursUntil >= rules.cancelCutoffHours

  return {
    canReschedule,
    canCancel,
    hoursUntil,
    rescheduleMessage: canReschedule ? null : `Reschedule is locked within ${rules.rescheduleCutoffHours} hours of the booking time.`,
    cancelMessage: canCancel ? null : `Cancellation is locked within ${rules.cancelCutoffHours} hours of the booking time.`,
  }
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
  const rules = getSelfServiceRules(settings)

  const booking = await getOwnedBooking(admin, user.id, bookingId)
  if (!booking || !['pending', 'confirmed', 'rescheduled'].includes(booking.status)) return
  if (hoursUntilBooking(booking) < rules.rescheduleCutoffHours) return

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

  await admin.from('notifications').insert({
    user_id: user.id,
    type: 'system',
    channel: 'in_app',
    title: 'Reschedule Submitted',
    body: `${booking.reference_no} has been moved to your new requested schedule.`,
    data: { booking_id: booking.id, reference_no: booking.reference_no },
  })

  await safeInsertAuditLog(admin, {
    user_id: user.id,
    action: 'booking_rescheduled_by_customer',
    table_name: 'bookings',
    record_id: booking.id,
    old_data: { status: booking.status, scheduled_date: booking.scheduled_date, scheduled_time: booking.scheduled_time },
    new_data: { status: 'rescheduled', scheduled_date: nextDate, scheduled_time: normalizedTime, reason },
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
  const rules = getSelfServiceRules(await getSettings(admin))
  const booking = await getOwnedBooking(admin, user.id, bookingId)
  if (!booking || !['pending', 'confirmed', 'rescheduled'].includes(booking.status)) return
  if (hoursUntilBooking(booking) < rules.cancelCutoffHours) return

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

  await admin.from('notifications').insert({
    user_id: user.id,
    type: 'system',
    channel: 'in_app',
    title: 'Booking Cancelled',
    body: `${booking.reference_no} has been cancelled from your account.`,
    data: { booking_id: booking.id, reference_no: booking.reference_no },
  })

  await safeInsertAuditLog(admin, {
    user_id: user.id,
    action: 'booking_cancelled_by_customer',
    table_name: 'bookings',
    record_id: booking.id,
    old_data: { status: booking.status },
    new_data: { status: 'cancelled', reason },
  })

  revalidatePath('/account/bookings')
  revalidatePath(`/track/${booking.reference_no}`)
}

async function saveServicePackage(formData) {
  'use server'

  const bookingId = String(formData.get('booking_id') || '')
  if (!bookingId) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id, reference_no, vehicle_id, vehicles(tier), booking_services(service_id, service_name)')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single()

  if (!booking || !booking.booking_services?.length) return

  const packageName = `${booking.reference_no} package`
  const serviceIds = booking.booking_services.map(service => service.service_id).filter(Boolean)
  const serviceNames = booking.booking_services.map(service => service.service_name).filter(Boolean)

  const { error } = await supabase.from('saved_service_packages').insert({
    user_id: user.id,
    name: packageName,
    vehicle_tier: booking.vehicles?.tier || null,
    service_ids: serviceIds,
    service_names: serviceNames,
    source_booking_id: booking.id,
    last_used_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[saved_service_packages]', error)
    return
  }

  revalidatePath('/account')
  revalidatePath('/account/bookings')
}

export default async function AccountBookingsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: bookings }, settings, blackoutDates, occupiedSlots, slotBlocks] = await Promise.all([
    admin
      .from('bookings')
      .select('*, booking_services(service_id, service_name, unit_price, subtotal), vehicles(make, model, plate, tier), booking_status_history(*), reviews(id), photos(id, url, type, is_public)')
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
            {active.map(b => <BookingCard key={b.id} booking={b} slotOptions={slotOptions} rules={getSelfServiceRules(settings)} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Past</h2>
          <div className="space-y-3">
            {past.map(b => <BookingCard key={b.id} booking={b} slotOptions={slotOptions} rules={getSelfServiceRules(settings)} />)}
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

function BookingCard({ booking: b, slotOptions, rules }) {
  const services = b.booking_services?.map(s => s.service_name).join(', ') || '-'
  const vehicle = b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : '-'
  const plate = b.vehicles?.plate
  const isCompleted = b.status === 'completed'
  const canSelfManage = ['pending', 'confirmed', 'rescheduled'].includes(b.status)
  const timeline = buildBookingTimeline(b.status, { hasReview: Boolean(b.reviews?.length) })
  const selfService = getSelfServiceAvailability(b, rules)
  const history = [...(b.booking_status_history || [])].sort((a, z) => new Date(z.created_at) - new Date(a.created_at))
  const publicPhotos = (b.photos || []).filter(photo => photo.is_public)
  const beforePhotos = publicPhotos.filter(photo => photo.type === 'before').slice(0, 2)
  const afterPhotos = publicPhotos.filter(photo => photo.type === 'after').slice(0, 2)

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

      {!['cancelled', 'no_show'].includes(b.status) && (
        <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            {timeline.map(step => (
              <div key={step.key} className={`rounded-lg border px-2 py-2 text-center ${
                step.state === 'done'
                  ? 'border-green-200 bg-green-50'
                  : step.state === 'current'
                    ? 'border-brand-200 bg-brand-50'
                    : 'border-[var(--border)] bg-white'
              }`}>
                <p className={`text-[11px] font-semibold ${
                  step.state === 'done' ? 'text-green-700' : step.state === 'current' ? 'text-brand-700' : 'text-[var(--text-muted)]'
                }`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
          {b.status === 'rescheduled' && (
            <p className="mt-2 text-xs text-amber-600">This booking was rescheduled and is waiting under the confirmed step.</p>
          )}
        </div>
      )}

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
            <form action={saveServicePackage}>
              <input type="hidden" name="booking_id" value={b.id} />
              <button className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1" type="submit">
                <Save className="w-3 h-3" /> Save Package
              </button>
            </form>
          </>
        )}
      </div>

      {isCompleted && (beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-semibold text-thunder-dark">Before / After Photos</p>
            <Link href={`/track/${b.reference_no}`} className="text-xs text-brand-600 hover:underline">Open gallery</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PhotoPreviewGroup title="Before" photos={beforePhotos} />
            <PhotoPreviewGroup title="After" photos={afterPhotos} />
          </div>
        </div>
      )}

      {canSelfManage && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <details className={`rounded-xl border p-3 ${selfService.canReschedule ? 'border-[var(--border)] bg-[var(--bg-2)]' : 'border-amber-200 bg-amber-50/60'}`}>
            <summary className="cursor-pointer text-sm font-semibold text-thunder-dark">Request Reschedule</summary>
            <form action={rescheduleBooking} className="mt-3 space-y-3">
              <input type="hidden" name="booking_id" value={b.id} />
              <select name="slot" className="input !py-2 text-sm" required defaultValue="">
                <option value="" disabled>Choose available slot</option>
                {slotOptions.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
              </select>
              <textarea name="reason" className="input resize-none text-sm" rows={2} placeholder="Reason for rescheduling" required />
              {!selfService.canReschedule && <p className="text-xs text-amber-700">{selfService.rescheduleMessage}</p>}
              <button className="btn-primary w-full !py-2 !text-sm disabled:opacity-50" type="submit" disabled={!selfService.canReschedule}>Submit Reschedule</button>
            </form>
          </details>

          <details className={`rounded-xl border p-3 ${selfService.canCancel ? 'border-red-100 bg-red-50/40' : 'border-red-200 bg-red-50/70'}`}>
            <summary className="cursor-pointer text-sm font-semibold text-red-600">Cancel Booking</summary>
            <form action={cancelBooking} className="mt-3 space-y-3">
              <input type="hidden" name="booking_id" value={b.id} />
              <textarea name="reason" className="input resize-none text-sm" rows={2} placeholder="Cancellation reason" required />
              {!selfService.canCancel && <p className="text-xs text-red-600">{selfService.cancelMessage}</p>}
              <button className="w-full !py-2 !text-sm flex items-center justify-center gap-2 rounded-lg bg-red-500 text-white font-semibold disabled:opacity-50" type="submit" disabled={!selfService.canCancel}>
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

function PhotoPreviewGroup({ title, photos }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{title}</p>
      {!photos.length ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-3 py-6 text-center text-xs text-[var(--text-muted)]">
          No photos yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {photos.map(photo => (
            <img key={photo.id} src={photo.url} alt={title} className="rounded-lg w-full h-24 object-cover" />
          ))}
        </div>
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

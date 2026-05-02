import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeInsertAuditLog } from '@/lib/audit'

const STAFF_ROLES = ['admin', 'manager', 'staff', 'super_admin']
const STATUS_NOTIFICATION_COPY = {
  confirmed: { title: 'Booking Confirmed', body: ref => `${ref} has been confirmed by Thunder Auto Hub.` },
  assigned: { title: 'Team Assigned', body: ref => `A service team has been assigned for ${ref}.` },
  on_the_way: { title: 'Team En Route', body: ref => `Our team is on the way for ${ref}.` },
  in_progress: { title: 'Service Started', body: ref => `Service has started for ${ref}.` },
  completed: { title: 'Service Completed', body: ref => `Your booking ${ref} has been marked completed.` },
  cancelled: { title: 'Booking Cancelled', body: ref => `${ref} has been cancelled.` },
  rescheduled: { title: 'Booking Rescheduled', body: ref => `${ref} has been rescheduled.` },
}

async function requireStaffUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!STAFF_ROLES.includes(profile?.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, admin }
}

export async function PATCH(request, { params }) {
  const auth = await requireStaffUser()
  if (auth.error) return auth.error

  const { user, admin } = auth
  const { id } = params
  const body = await request.json()
  const action = body.action

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, user_id, reference_no, status, scheduled_date, scheduled_time, admin_notes, service_flags, eta_minutes')
    .eq('id', id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (action === 'update_status') {
    const nextStatus = String(body.status || '')
    const etaMinutes = Number.isFinite(Number(body.eta_minutes)) ? Number(body.eta_minutes) : null
    const note = String(body.note || '').trim()

    const updatePayload = {
      status: nextStatus,
      eta_minutes: nextStatus === 'on_the_way' ? etaMinutes : null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await admin.from('bookings').update(updatePayload).eq('id', booking.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await admin.from('booking_status_history').insert({
      booking_id: booking.id,
      changed_by: user.id,
      actor_role: 'admin',
      action: 'status_updated_by_admin',
      from_status: booking.status,
      to_status: nextStatus,
      from_scheduled_date: booking.scheduled_date,
      from_scheduled_time: booking.scheduled_time,
      note: note || 'Status updated from admin booking detail.',
      metadata: nextStatus === 'on_the_way' && etaMinutes ? { eta_minutes: etaMinutes } : {},
    })

    const copy = STATUS_NOTIFICATION_COPY[nextStatus]
    if (copy) {
      await admin.from('notifications').insert({
        user_id: booking.user_id,
        type: 'system',
        channel: 'in_app',
        title: copy.title,
        body: copy.body(booking.reference_no),
        data: { booking_id: booking.id, reference_no: booking.reference_no, status: nextStatus },
      })
    }

    await safeInsertAuditLog(admin, {
      user_id: user.id,
      action: 'booking_status_updated',
      table_name: 'bookings',
      record_id: booking.id,
      old_data: { status: booking.status, eta_minutes: booking.eta_minutes },
      new_data: { status: nextStatus, eta_minutes: updatePayload.eta_minutes, note },
    })

    return NextResponse.json({ ok: true })
  }

  if (action === 'update_internal') {
    const adminNotes = String(body.admin_notes || '').trim()
    const serviceFlags = Array.isArray(body.service_flags)
      ? body.service_flags.map(value => String(value).trim()).filter(Boolean)
      : []

    const { error } = await admin.from('bookings').update({
      admin_notes: adminNotes || null,
      service_flags: serviceFlags,
      updated_at: new Date().toISOString(),
    }).eq('id', booking.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await admin.from('booking_status_history').insert({
      booking_id: booking.id,
      changed_by: user.id,
      actor_role: 'admin',
      action: 'internal_notes_updated',
      from_status: booking.status,
      to_status: booking.status,
      note: 'Internal booking notes or flags were updated.',
      metadata: { service_flags: serviceFlags },
    })

    await safeInsertAuditLog(admin, {
      user_id: user.id,
      action: 'booking_internal_updated',
      table_name: 'bookings',
      record_id: booking.id,
      old_data: { admin_notes: booking.admin_notes, service_flags: booking.service_flags || [] },
      new_data: { admin_notes: adminNotes || null, service_flags: serviceFlags },
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}

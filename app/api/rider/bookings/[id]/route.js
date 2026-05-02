import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeInsertAuditLog } from '@/lib/audit'
import { buildDefaultChecklist, getNextRiderStatusOptions } from '@/lib/riderWorkflow'

const RIDER_ROLES = ['rider', 'admin', 'manager', 'staff', 'super_admin']
const STATUS_COPY = {
  on_the_way: { title: 'Team En Route', body: ref => `Your service team is on the way for ${ref}.` },
  in_progress: { title: 'Service Started', body: ref => `Service has started for ${ref}.` },
  completed: { title: 'Service Completed', body: ref => `Your booking ${ref} has been completed.` },
}

async function requireRiderUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('id, role, full_name').eq('id', user.id).single()
  if (!RIDER_ROLES.includes(profile?.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, profile, admin }
}

async function getBookingForRider(admin, id, user, profile) {
  const { data: booking } = await admin
    .from('bookings')
    .select('id, user_id, rider_id, vehicle_id, reference_no, status, scheduled_date, scheduled_time, eta_minutes, total_price, updated_at, address, barangay, city, notes, admin_notes, service_flags, profiles(full_name, phone), vehicles(id, make, model, plate, color, tier), booking_services(id, service_name), photos(id, url, type, caption, is_public, created_at)')
    .eq('id', id)
    .single()

  if (!booking) return null
  if (profile.role === 'rider' && booking.rider_id !== user.id) return null

  return booking
}

async function ensureChecklist(admin, booking, userId) {
  const { data: existing } = await admin
    .from('job_checklist_items')
    .select('*')
    .eq('booking_id', booking.id)

  if (existing?.length) return existing

  const rows = buildDefaultChecklist(booking).map(item => ({
    booking_id: booking.id,
    item,
    done_by: userId,
  }))

  const { data: inserted } = await admin
    .from('job_checklist_items')
    .insert(rows)
    .select('*')

  return inserted || []
}

export async function GET(request, { params }) {
  const auth = await requireRiderUser()
  if (auth.error) return auth.error

  const { user, profile, admin } = auth
  const booking = await getBookingForRider(admin, params.id, user, profile)
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const [checklist, { data: supplies }, { data: usage }, { data: notes }, riderResult] = await Promise.all([
    ensureChecklist(admin, booking, user.id),
    admin.from('supplies').select('id, name, unit, quantity, low_stock_alert').order('name'),
    admin.from('supply_usage').select('id, supply_id, quantity, type, notes, created_at').eq('booking_id', booking.id).order('created_at', { ascending: false }),
    admin.from('vehicle_health_notes').select('id, note, severity, created_at, noted_by').eq('booking_id', booking.id).order('created_at', { ascending: false }),
    booking.rider_id ? admin.from('profiles').select('id, full_name, phone').eq('id', booking.rider_id).single() : Promise.resolve({ data: null }),
  ])

  const supplyMap = new Map((supplies || []).map(item => [item.id, item]))
  const usageRows = (usage || []).map(item => ({
    ...item,
    supply: supplyMap.get(item.supply_id) || null,
  }))

  return NextResponse.json({
    booking,
    checklist,
    supplies: supplies || [],
    usage: usageRows,
    notes: notes || [],
    rider: riderResult.data || null,
    next_statuses: getNextRiderStatusOptions(booking.status),
  })
}

export async function PATCH(request, { params }) {
  const auth = await requireRiderUser()
  if (auth.error) return auth.error

  const { user, profile, admin } = auth
  const booking = await getBookingForRider(admin, params.id, user, profile)
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const body = await request.json()
  const action = String(body.action || '')

  if (action === 'toggle_checklist') {
    const itemId = String(body.item_id || '')
    const isDone = Boolean(body.is_done)
    const { error } = await admin
      .from('job_checklist_items')
      .update({
        is_done: isDone,
        done_at: isDone ? new Date().toISOString() : null,
        done_by: isDone ? user.id : null,
      })
      .eq('id', itemId)
      .eq('booking_id', booking.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'add_note') {
    const note = String(body.note || '').trim()
    const severity = ['info', 'warning', 'critical'].includes(body.severity) ? body.severity : 'info'
    if (!note) return NextResponse.json({ error: 'Note is required' }, { status: 400 })

    const { error } = await admin.from('vehicle_health_notes').insert({
      vehicle_id: booking.vehicle_id,
      booking_id: booking.id,
      noted_by: user.id,
      note,
      severity,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await safeInsertAuditLog(admin, {
      user_id: user.id,
      action: 'rider_note_added',
      table_name: 'vehicle_health_notes',
      record_id: booking.id,
      new_data: { booking_id: booking.id, severity, note },
    })

    return NextResponse.json({ ok: true })
  }

  if (action === 'log_supply') {
    const supplyId = String(body.supply_id || '')
    const quantity = Number(body.quantity || 0)
    const notes = String(body.notes || '').trim() || null
    if (!supplyId || !(quantity > 0)) {
      return NextResponse.json({ error: 'Supply and quantity are required' }, { status: 400 })
    }

    const { data: supply } = await admin.from('supplies').select('id, quantity').eq('id', supplyId).single()
    if (!supply) return NextResponse.json({ error: 'Supply not found' }, { status: 404 })
    if (Number(supply.quantity || 0) < quantity) {
      return NextResponse.json({ error: 'Not enough stock available' }, { status: 400 })
    }

    await admin.from('supply_usage').insert({
      supply_id: supplyId,
      booking_id: booking.id,
      quantity,
      type: 'use',
      notes,
      logged_by: user.id,
    })
    await admin.from('supplies').update({
      quantity: Number(supply.quantity || 0) - quantity,
      updated_at: new Date().toISOString(),
    }).eq('id', supplyId)

    await safeInsertAuditLog(admin, {
      user_id: user.id,
      action: 'booking_supply_used',
      table_name: 'supply_usage',
      record_id: booking.id,
      new_data: { booking_id: booking.id, supply_id: supplyId, quantity, notes },
    })

    return NextResponse.json({ ok: true })
  }

  if (action === 'update_status') {
    const nextStatus = String(body.status || '')
    const allowedStatuses = getNextRiderStatusOptions(booking.status)
    if (!allowedStatuses.includes(nextStatus)) {
      return NextResponse.json({ error: 'Status transition is not allowed' }, { status: 400 })
    }

    if (nextStatus === 'completed') {
      const checklist = await ensureChecklist(admin, booking, user.id)
      const hasPending = checklist.some(item => !item.is_done)
      if (hasPending) {
        return NextResponse.json({ error: 'Complete the job checklist before finishing the booking' }, { status: 400 })
      }
    }

    const etaMinutes = nextStatus === 'on_the_way' ? Number(body.eta_minutes || 0) : null
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
      actor_role: profile.role,
      action: 'status_updated_by_rider',
      from_status: booking.status,
      to_status: nextStatus,
      from_scheduled_date: booking.scheduled_date,
      from_scheduled_time: booking.scheduled_time,
      note: note || 'Status updated from rider workflow.',
      metadata: nextStatus === 'on_the_way' ? { eta_minutes: etaMinutes } : {},
    })

    const copy = STATUS_COPY[nextStatus]
    if (copy) {
      await admin.from('notifications').insert({
        user_id: booking.user_id,
        type: 'system',
        channel: 'in_app',
        title: copy.title,
        body: copy.body(booking.reference_no),
        data: {
          booking_id: booking.id,
          reference_no: booking.reference_no,
          status: nextStatus,
          rider_name: profile.full_name,
          eta_minutes: nextStatus === 'on_the_way' ? etaMinutes : null,
        },
      })
    }

    await safeInsertAuditLog(admin, {
      user_id: user.id,
      action: 'booking_status_updated_by_rider',
      table_name: 'bookings',
      record_id: booking.id,
      old_data: { status: booking.status, eta_minutes: booking.eta_minutes },
      new_data: { status: nextStatus, eta_minutes: updatePayload.eta_minutes, note },
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}

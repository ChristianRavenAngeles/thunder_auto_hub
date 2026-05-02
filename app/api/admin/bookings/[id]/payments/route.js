import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeInsertAuditLog } from '@/lib/audit'

const STAFF_ROLES = ['admin', 'manager', 'staff', 'super_admin']

export async function POST(request, { params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!STAFF_ROLES.includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = params
  const body = await request.json()
  const amount = Number(body.amount)
  const method = String(body.method || '').trim()
  const note = String(body.note || '').trim()

  if (!amount || amount <= 0 || !method) {
    return NextResponse.json({ error: 'Valid payment details are required' }, { status: 400 })
  }

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, user_id, reference_no, status, total_price, payment_status, payments(amount, status)')
    .eq('id', id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const { error: paymentError } = await admin.from('payments').insert({
    booking_id: id,
    amount,
    method,
    status: 'paid',
    notes: note || null,
    is_deposit: false,
    confirmed_by: user.id,
    confirmed_at: new Date().toISOString(),
  })
  if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 400 })

  const totalPaid = (booking.payments || [])
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0) + amount
  const nextPaymentStatus = totalPaid >= Number(booking.total_price || 0) ? 'paid' : 'partial'

  const { error: bookingUpdateError } = await admin.from('bookings').update({
    payment_status: nextPaymentStatus,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (bookingUpdateError) return NextResponse.json({ error: bookingUpdateError.message }, { status: 400 })

  await admin.from('booking_status_history').insert({
    booking_id: id,
    changed_by: user.id,
    actor_role: 'admin',
    action: 'payment_recorded',
    from_status: booking.status,
    to_status: booking.status,
    note: `Payment recorded: PHP ${amount.toFixed(2)} via ${method.replace(/_/g, ' ')}.`,
    metadata: { payment_status: nextPaymentStatus },
  })

  await admin.from('notifications').insert({
    user_id: booking.user_id,
    type: 'payment_received',
    channel: 'in_app',
    title: 'Payment Posted',
    body: `A payment for ${booking.reference_no} has been posted to your booking.`,
    data: { booking_id: booking.id, reference_no: booking.reference_no, payment_status: nextPaymentStatus },
  })

  await safeInsertAuditLog(admin, {
    user_id: user.id,
    action: 'payment_recorded',
    table_name: 'payments',
    record_id: booking.id,
    old_data: { payment_status: booking.payment_status },
    new_data: { amount, method, note: note || null, payment_status: nextPaymentStatus },
  })

  return NextResponse.json({ ok: true })
}

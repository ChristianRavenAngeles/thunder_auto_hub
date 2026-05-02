import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { booking_id, phone, screenshot_url, method } = await request.json()
    if (!booking_id) return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })
    if (!phone?.trim()) return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 })
    if (!screenshot_url) return NextResponse.json({ error: 'Payment screenshot is required.' }, { status: 400 })

    const admin = createAdminClient()

    // Verify booking belongs to this user
    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .select('id, reference_no, payment_status, user_id')
      .eq('id', booking_id)
      .single()

    if (bookingErr || !booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    if (booking.user_id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (booking.payment_status === 'paid') return NextResponse.json({ error: 'Deposit already confirmed.' }, { status: 409 })

    // Update the pending payment record with screenshot + phone
    const { error: paymentErr } = await admin
      .from('payments')
      .update({
        screenshot_url,
        method: method || 'gcash',
        status: 'submitted',
        notes: `${method || 'gcash'}: ${phone.trim()}`,
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', booking_id)
      .eq('is_deposit', true)

    if (paymentErr) throw paymentErr

    // Save phone to profile if not set
    await admin
      .from('profiles')
      .update({ phone: phone.trim() })
      .eq('id', user.id)
      .is('phone', null)

    // Notify admins
    const { data: admins } = await admin.from('profiles').select('id').in('role', ['admin', 'super_admin'])
    if (admins?.length) {
      await admin.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          type:    'payment_submitted',
          channel: 'in_app',
          title:   'Deposit Proof Submitted',
          body:    `Booking ${booking.reference_no} — GCash ${phone.trim()}. Verify screenshot.`,
          data:    { booking_id },
        }))
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/bookings/deposit]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

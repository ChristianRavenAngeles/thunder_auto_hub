import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmation } from '@/lib/sms'
import { format } from 'date-fns'

export async function POST(request) {
  try {
    const body = await request.json()
    const admin = createAdminClient()

    // Create booking
    const { data: booking, error: bookingErr } = await admin.from('bookings').insert({
      user_id:        body.user_id,
      vehicle_id:     body.vehicle_id,
      rider_id:       null,
      status:         'pending',
      scheduled_date: body.scheduled_date,
      scheduled_time: body.scheduled_time,
      address:        body.address,
      barangay:       body.barangay,
      city:           body.city,
      landmarks:      body.landmarks,
      travel_fee:     body.travel_fee ?? 0,
      subtotal:       body.subtotal,
      discount_amount: body.discount ?? 0,
      total_price:    body.total,
      deposit_amount: 100,
      deposit_paid:   false,
      payment_status: 'pending',
      source:         'website',
      promo_code:     body.promo_code,
      notes:          body.notes,
    }).select().single()
    if (bookingErr) throw bookingErr

    // Create vehicle record if guest (no vehicle_id)
    if (!body.vehicle_id && body.vehicle_make && body.vehicle_tier) {
      const { data: vehicle } = await admin.from('vehicles').insert({
        user_id: body.user_id,
        make:    body.vehicle_make,
        model:   body.vehicle_model,
        tier:    body.vehicle_tier,
        plate:   body.vehicle_plate,
      }).select().single()
      if (vehicle) {
        await admin.from('bookings').update({ vehicle_id: vehicle.id }).eq('id', booking.id)
      }
    }

    // Create booking service line items
    if (body.services?.length) {
      await admin.from('booking_services').insert(
        body.services.map(svc => ({
          booking_id:   booking.id,
          service_id:   svc.id,
          service_name: svc.name,
          unit_price:   svc.price,
          quantity:     1,
          subtotal:     svc.price,
        }))
      )
    }

    // Record deposit payment
    await admin.from('payments').insert({
      booking_id:     booking.id,
      amount:         100,
      method:         body.deposit_method || 'gcash',
      status:         'pending',
      is_deposit:     true,
      screenshot_url: body.deposit_screenshot,
    })

    // In-app notification for admin
    const { data: admins } = await admin.from('profiles').select('id').in('role', ['admin', 'super_admin'])
    if (admins?.length) {
      await admin.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          type:    'booking_confirmed',
          channel: 'in_app',
          title:   'New Booking!',
          body:    `New booking ${booking.reference_no} from ${body.barangay}, ${body.city}`,
          data:    { booking_id: booking.id },
        }))
      )
    }

    // Customer notification
    if (body.user_id) {
      await admin.from('notifications').insert({
        user_id: body.user_id,
        type:    'booking_confirmed',
        channel: 'in_app',
        title:   'Booking Submitted!',
        body:    `Ref: ${booking.reference_no}. I-verify namin ang payment at mag-co-confirm kami shortly.`,
        data:    { booking_id: booking.id },
      })

      // Get phone for SMS
      const { data: profile } = await admin.from('profiles').select('phone').eq('id', body.user_id).single()
      if (profile?.phone) {
        await sendBookingConfirmation(profile.phone, {
          refNo: booking.reference_no,
          date: format(new Date(body.scheduled_date), 'MMMM dd, yyyy'),
          time: body.scheduled_time || '',
        })
      }
    }

    // Audit log
    await admin.from('audit_logs').insert({
      user_id:    body.user_id,
      action:     'booking_created',
      table_name: 'bookings',
      record_id:  booking.id,
      new_data:   { reference_no: booking.reference_no, total: body.total },
    })

    return NextResponse.json({ ok: true, reference_no: booking.reference_no, booking_id: booking.id })
  } catch (err) {
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit  = parseInt(searchParams.get('limit') || '20')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const admin = createAdminClient()

    let query = admin
      .from('bookings')
      .select(`*, profiles(full_name, phone), vehicles(make, model, tier, plate), booking_services(*, services(name)), payments(*)`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!['admin', 'manager', 'staff', 'super_admin'].includes(profile?.role)) {
      query = query.eq('user_id', user.id)
    }
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ bookings: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

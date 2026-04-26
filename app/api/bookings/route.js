import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmation } from '@/lib/sms'
import { format } from 'date-fns'
import { ACTIVE_BOOKING_STATUSES, isSlotAvailable, settingsFromRows } from '@/lib/availability'

export async function POST(request) {
  try {
    const body = await request.json()
    const admin = createAdminClient()

    if (!body.user_id) {
      return NextResponse.json({ error: 'Please sign in before booking a service.' }, { status: 401 })
    }

    const [settingsResult, blackoutResult, blockResult, bookingResult] = await Promise.all([
      admin.from('settings').select('key, value'),
      admin.from('blackout_dates').select('date'),
      admin.from('booking_slot_blocks').select('date, start_time, end_time, is_full_day'),
      admin
        .from('bookings')
        .select('id, scheduled_date, scheduled_time')
        .in('status', ACTIVE_BOOKING_STATUSES),
    ])

    const slotOk = isSlotAvailable({
      date: body.scheduled_date,
      time: body.scheduled_time,
      settings: settingsFromRows(settingsResult.data || []),
      blackoutDates: (blackoutResult.data || []).map(row => row.date),
      slotBlocks: blockResult.data || [],
      occupiedBookings: bookingResult.data || [],
    })

    if (!slotOk) {
      return NextResponse.json({ error: 'Selected schedule is no longer available.' }, { status: 409 })
    }

    let serviceLineItems = []
    if (body.services?.length) {
      const servicesWithoutIds = body.services.filter(svc => !svc.id).map(svc => svc.name).filter(Boolean)
      let serviceIdsByName = {}
      if (servicesWithoutIds.length) {
        const { data: serviceRows } = await admin
          .from('services')
          .select('id, name')
          .in('name', servicesWithoutIds)
        serviceIdsByName = (serviceRows || []).reduce((acc, svc) => ({ ...acc, [svc.name]: svc.id }), {})
      }

      serviceLineItems = body.services.map(svc => {
        const serviceId = svc.id || serviceIdsByName[svc.name]
        if (!serviceId) throw new Error(`Service is unavailable: ${svc.name}`)
        return {
          service_id:   serviceId,
          service_name: svc.name,
          unit_price:   svc.price,
          quantity:     1,
          subtotal:     svc.price,
        }
      })
    }

    // Create booking
    const { data: booking, error: bookingErr } = await admin.from('bookings').insert({
      user_id:        body.user_id,
      vehicle_id:     body.vehicle_id,
      rider_id:       null,
      status:         'pending',
      scheduled_date: body.scheduled_date,
      scheduled_time: body.scheduled_time,
      address:        body.address || [body.barangay, body.city].filter(Boolean).join(', '),
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
    if (!body.vehicle_id && body.user_id && body.vehicle_make && body.vehicle_tier) {
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
    if (serviceLineItems.length) {
      await admin.from('booking_services').insert(
        serviceLineItems.map(item => ({ booking_id: booking.id, ...item }))
      )
    }

    if (body.user_id) {
      const { data: conversation } = await admin
        .from('conversations')
        .insert({ booking_id: booking.id, type: 'customer_admin' })
        .select('id')
        .single()

      if (conversation) {
        const { data: adminsForChat } = await admin
          .from('profiles')
          .select('id')
          .in('role', ['admin', 'manager', 'staff', 'super_admin'])

        const participants = [
          { conversation_id: conversation.id, user_id: body.user_id },
          ...(adminsForChat || []).map(person => ({ conversation_id: conversation.id, user_id: person.id })),
        ]

        await admin
          .from('conversation_participants')
          .upsert(participants, { onConflict: 'conversation_id,user_id' })
      }
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

    await admin.from('booking_status_history').insert({
      booking_id: booking.id,
      changed_by: body.user_id,
      actor_role: 'customer',
      action: 'booking_created',
      to_status: booking.status,
      to_scheduled_date: body.scheduled_date,
      to_scheduled_time: body.scheduled_time,
      note: 'Booking submitted from the website.',
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

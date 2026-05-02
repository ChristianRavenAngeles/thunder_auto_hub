import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ACTIVE_BOOKING_STATUSES,
  buildAvailableSlotOptions,
  settingsFromRows,
} from '@/lib/availability'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = createAdminClient()

    const [settingsResult, blackoutResult, blockResult, bookingResult] = await Promise.all([
      admin.from('settings').select('key, value'),
      admin.from('blackout_dates').select('date'),
      admin.from('booking_slot_blocks').select('date, start_time, end_time, is_full_day'),
      admin
        .from('bookings')
        .select('id, scheduled_date, scheduled_time, estimated_duration_hours')
        .in('status', ACTIVE_BOOKING_STATUSES),
    ])

    const slots = buildAvailableSlotOptions({
      settings: settingsFromRows(settingsResult.data || []),
      blackoutDates: (blackoutResult.data || []).map(row => row.date),
      slotBlocks: blockResult.data || [],
      occupiedBookings: bookingResult.data || [],
      days: 45,
      limit: 80,
    })

    return NextResponse.json({ slots })
  } catch (err) {
    console.error('[GET /api/public/availability]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

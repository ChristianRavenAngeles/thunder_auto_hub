import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBookingSlaAlerts } from '@/lib/sla'

const RIDER_ROLES = ['rider', 'admin', 'manager', 'staff', 'super_admin']

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

export async function GET() {
  const auth = await requireRiderUser()
  if (auth.error) return auth.error

  const { user, profile, admin } = auth
  let bookingQuery = admin
    .from('bookings')
    .select('id, reference_no, status, scheduled_date, scheduled_time, eta_minutes, updated_at, rider_id, address, barangay, city, service_flags, profiles(full_name, phone), vehicles(make, model, plate, tier), booking_services(service_name), photos(id, type), job_checklist_items(id, is_done)')
    .in('status', ['assigned', 'on_the_way', 'in_progress', 'confirmed', 'rescheduled'])
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })

  if (profile.role === 'rider') {
    bookingQuery = bookingQuery.eq('rider_id', user.id)
  }

  const { data: bookings, error } = await bookingQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const items = (bookings || []).map(booking => {
    const checklistItems = booking.job_checklist_items || []
    const completedChecklist = checklistItems.filter(item => item.is_done).length
    const photoCount = (booking.photos || []).length
    return {
      ...booking,
      checklist_total: checklistItems.length,
      checklist_done: completedChecklist,
      photo_count: photoCount,
      sla_alerts: getBookingSlaAlerts(booking),
    }
  })

  return NextResponse.json({ jobs: items })
}

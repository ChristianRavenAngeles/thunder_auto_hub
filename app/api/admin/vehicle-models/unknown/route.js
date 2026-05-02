import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'super_admin', 'manager'].includes(profile?.role)) return null
  return user
}

// GET /api/admin/vehicle-models/unknown
export async function GET() {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('unknown_vehicle_requests')
      .select('*')
      .eq('resolved', false)
      .order('request_count', { ascending: false })
    if (error) throw error
    return NextResponse.json({ requests: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/admin/vehicle-models/unknown — dismiss a request
export async function DELETE(request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const admin = createAdminClient()
    await admin.from('unknown_vehicle_requests').update({ resolved: true }).eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

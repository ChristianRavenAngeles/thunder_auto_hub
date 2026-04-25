import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
  try {
    const body = await request.json()
    const admin = createAdminClient()
    await admin.from('waitlists').insert({
      name:  body.name,
      phone: body.phone,
      email: body.email,
      city:  body.city,
      barangay: body.barangay,
      type:  body.type || 'out_of_area',
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

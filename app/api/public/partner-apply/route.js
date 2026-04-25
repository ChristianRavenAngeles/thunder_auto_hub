import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
  try {
    const body = await request.json()
    const admin = createAdminClient()
    await admin.from('partners').insert({
      business_name: body.business_name,
      contact_name:  body.contact_name,
      phone:         body.phone,
      email:         body.email,
      city:          body.city,
      notes:         body.message,
      status:        'pending',
    })

    // Notify admins
    const { data: admins } = await admin.from('profiles').select('id').in('role', ['admin', 'super_admin'])
    if (admins?.length) {
      await admin.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          type: 'system',
          channel: 'in_app',
          title: 'New Partner Application',
          body: `${body.business_name} from ${body.city} applied to be a partner.`,
        }))
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/sms'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, message, channel, audience } = body
    const admin = createAdminClient()

    // Build recipient query
    let query = admin.from('profiles').select('id, phone, full_name').eq('is_active', true).neq('role', 'admin').neq('role', 'super_admin')

    if (audience === 'members') {
      const { data: memberIds } = await admin.from('memberships').select('user_id').eq('status', 'active')
      query = query.in('id', memberIds?.map(m => m.user_id) || [])
    } else if (audience === 'vip') {
      query = query.contains('tags', ['vip'])
    } else if (audience === 'inactive_30') {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: activeIds } = await admin.from('bookings').select('user_id').gte('created_at', cutoff)
      const activeSet = new Set(activeIds?.map(b => b.user_id) || [])
      query = query.not('id', 'in', `(${[...activeSet].join(',') || 'null'})`)
    }

    const { data: recipients } = await query.limit(500)
    let sent = 0

    for (const recipient of recipients || []) {
      // In-app notification
      if (channel === 'in_app' || channel === 'both') {
        await admin.from('notifications').insert({
          user_id: recipient.id,
          type:    'broadcast',
          channel: 'in_app',
          title,
          body:    body.body,
        })
        sent++
      }

      // SMS
      if ((channel === 'sms' || channel === 'both') && recipient.phone) {
        await sendSMS(recipient.phone, `${title}\n\n${body.body}\n\n- Thunder Auto Hub`)
        sent++
      }
    }

    // Log broadcast
    const { data: broadcast } = await admin.from('broadcasts').insert({
      title,
      body:       body.body,
      channel,
      audience,
      status:     'sent',
      sent_count: sent,
      sent_at:    new Date().toISOString(),
      created_by: user.id,
    }).select().single()

    return NextResponse.json({ ok: true, sent_count: sent, broadcast_id: broadcast?.id })
  } catch (err) {
    console.error('[broadcast]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

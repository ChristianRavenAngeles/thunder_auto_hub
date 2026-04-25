import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { toSessionCookieOptions } from '@/lib/supabase/cookies'

export async function POST(request) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password || !name) return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const admin = createAdminClient()

    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name.trim() },
    })
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })

    await admin.from('profiles').insert({
      id: newUser.user.id,
      email: email.trim().toLowerCase(),
      full_name: name.trim(),
      role: 'customer',
    })

    const { data: sessionData, error: sessionErr } = await admin.auth.admin.createSession({ user_id: newUser.user.id })
    if (sessionErr) throw sessionErr

    const response = NextResponse.json({ ok: true })
    response.cookies.set('sb-access-token', sessionData.session.access_token, toSessionCookieOptions({
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
    }))
    response.cookies.set('sb-refresh-token', sessionData.session.refresh_token, toSessionCookieOptions({
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
    }))
    return response
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

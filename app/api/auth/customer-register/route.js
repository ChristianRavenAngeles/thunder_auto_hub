import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toSessionCookieOptions } from '@/lib/supabase/cookies'

export async function POST(request) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password || !name) return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const normalizedEmail = email.trim().toLowerCase()

    // Create user via GoTrue Admin REST API (auth.admin.createUser is unavailable in supabase-js v2.104+)
    const createRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: name.trim() },
        }),
      }
    )

    const createData = await createRes.json()
    if (!createRes.ok) {
      const msg = createData.msg || createData.message || createData.error_description || 'Registration failed.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Sign in immediately to get a session
    const supabase = await createClient()
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
    if (signInErr) return NextResponse.json({ error: signInErr.message }, { status: 500 })

    const response = NextResponse.json({ ok: true })
    response.cookies.set('sb-access-token', data.session.access_token, toSessionCookieOptions({
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
    }))
    response.cookies.set('sb-refresh-token', data.session.refresh_token, toSessionCookieOptions({
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
    }))
    return response
  } catch (err) {
    console.error('[POST /api/auth/customer-register]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

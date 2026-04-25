import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toSessionCookieOptions } from '@/lib/supabase/cookies'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })

    const response = NextResponse.json({ ok: true })
    response.cookies.set('sb-access-token', data.session.access_token, toSessionCookieOptions({
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
    }))
    response.cookies.set('sb-refresh-token', data.session.refresh_token, toSessionCookieOptions({
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
    }))
    return response
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

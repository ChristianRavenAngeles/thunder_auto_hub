import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/sms'
import { toSessionCookieOptions } from '@/lib/supabase/cookies'

export async function POST(request) {
  try {
    const { phone, otp, name } = await request.json()
    if (!phone || !otp) return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 })

    const normalized = normalizePhone(phone)
    const admin = createAdminClient()

    // Verify OTP
    const { data: token, error: tokenErr } = await admin
      .from('otp_tokens')
      .select('*')
      .eq('phone', normalized)
      .eq('token', otp)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (tokenErr || !token) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
    }

    // Mark OTP used
    await admin.from('otp_tokens').update({ used: true }).eq('id', token.id)

    // Check if user exists
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.phone === normalized || u.user_metadata?.phone === normalized)

    let userId

    if (existing) {
      userId = existing.id
    } else {
      // Create new user
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        phone: normalized,
        phone_confirm: true,
        user_metadata: { phone: normalized, full_name: name || '' },
      })
      if (createErr) throw createErr
      userId = newUser.user.id

      // Create profile
      await admin.from('profiles').insert({
        id: userId,
        phone: normalized,
        full_name: name || '',
        role: 'customer',
      })
    }

    // Update profile name if provided
    if (name && existing) {
      await admin.from('profiles').update({ full_name: name }).eq('id', userId).is('full_name', null)
    }

    // Sign in via magic link workaround — generate session
    const { data: sessionData, error: sessionErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${userId}@thunder-otp.internal`,
    })

    // Fallback: use custom token approach
    const { data: signInData, error: signInErr } = await admin.auth.admin.createSession({ user_id: userId })
    if (signInErr) throw signInErr

    const response = NextResponse.json({ ok: true, user_id: userId })
    response.cookies.set('sb-access-token', signInData.session.access_token, toSessionCookieOptions({
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    }))
    response.cookies.set('sb-refresh-token', signInData.session.refresh_token, toSessionCookieOptions({
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    }))

    return response
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

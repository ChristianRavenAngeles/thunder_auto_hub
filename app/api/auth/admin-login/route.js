import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { authCookieOptions, toSessionCookieOptions } from '@/lib/supabase/cookies'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const cookieStore = await cookies()

    // Build a response we can mutate to attach cookies
    const response = NextResponse.json({ ok: true })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookieOptions: authCookieOptions,
        cookies: {
          getAll:  ()                   => cookieStore.getAll(),
          setAll:  (cookiesToSet)       => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, toSessionCookieOptions(options))),
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })

    // Verify role
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (!['admin', 'manager', 'staff', 'rider', 'super_admin'].includes(profile?.role)) {
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'This account is not authorized for staff login.' }, { status: 403 })
    }

    // Patch the response body with the role
    const body = NextResponse.json({ ok: true, role: profile.role })
    // Copy cookies from the auth response onto the body response
    response.cookies.getAll().forEach(c => body.cookies.set(c.name, c.value, toSessionCookieOptions(c)))
    return body
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

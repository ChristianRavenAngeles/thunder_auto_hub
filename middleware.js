import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { authCookieOptions, toSessionCookieOptions } from '@/lib/supabase/cookies'

const PROTECTED_CUSTOMER = ['/account']
const PROTECTED_ADMIN     = ['/admin']
const PROTECTED_RIDER     = ['/rider']
const PROTECTED_PARTNER   = ['/partner']

export async function middleware(request) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll: ()                  => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, toSessionCookieOptions(options)))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const isCustomerRoute = PROTECTED_CUSTOMER.some(p => pathname.startsWith(p))
  const isAdminRoute    = PROTECTED_ADMIN.some(p => pathname.startsWith(p))
  const isRiderRoute    = PROTECTED_RIDER.some(p => pathname.startsWith(p))
  const isPartnerRoute  = PROTECTED_PARTNER.some(p => pathname.startsWith(p))

  if ((isCustomerRoute || isAdminRoute || isRiderRoute || isPartnerRoute) && !user) {
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && (isAdminRoute || isRiderRoute || isPartnerRoute)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (isAdminRoute && !['admin', 'manager', 'staff', 'super_admin'].includes(role)) {
      return NextResponse.redirect(new URL('/account', request.url))
    }
    if (isRiderRoute && !['rider', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.redirect(new URL('/account', request.url))
    }
    if (isPartnerRoute && !['partner', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.redirect(new URL('/account', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|api/public).*)'],
}

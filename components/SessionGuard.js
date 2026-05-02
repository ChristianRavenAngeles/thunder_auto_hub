'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const SESSION_KEY = 'thunder-session-active'
const PUBLIC_PATHS = ['/auth', '/book', '/blog', '/track', '/payment', '/', '/services', '/pricing', '/faq', '/service-area', '/partner']

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default function SessionGuard() {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // On mount: if no session marker in sessionStorage, clear server cookies and redirect if on protected route
    const hasSession = sessionStorage.getItem(SESSION_KEY)
    if (!hasSession) {
      // Fire-and-forget: clear any stale server-side cookies
      fetch('/api/auth/signout', { method: 'POST' }).catch(() => {})

      if (!isPublicPath(pathname)) {
        const loginUrl = new URL('/auth', window.location.href)
        loginUrl.searchParams.set('redirect', pathname)
        router.replace(loginUrl.pathname + loginUrl.search)
      }
      return
    }
  }, []) // only on initial mount — tab/browser open

  return null
}

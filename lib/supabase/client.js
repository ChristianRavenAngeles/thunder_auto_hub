import { createBrowserClient } from '@supabase/ssr'
import { authCookieOptions, createBrowserSessionCookieMethods } from './cookies'

function createSessionStorageAdapter() {
  if (typeof window === 'undefined') return undefined

  return {
    getItem(key) {
      return window.sessionStorage.getItem(key)
    },
    setItem(key, value) {
      window.localStorage.removeItem(key)
      window.sessionStorage.setItem(key, value)
    },
    removeItem(key) {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    },
  }
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        storage: createSessionStorageAdapter(),
      },
      cookieOptions: authCookieOptions,
      cookies: createBrowserSessionCookieMethods(),
    }
  )
}

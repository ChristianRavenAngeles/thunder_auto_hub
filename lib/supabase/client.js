import { createBrowserClient } from '@supabase/ssr'
import { authCookieOptions, createBrowserSessionCookieMethods } from './cookies'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: authCookieOptions,
      cookies: createBrowserSessionCookieMethods(),
    }
  )
}

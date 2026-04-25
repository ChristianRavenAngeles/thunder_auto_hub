export const AUTH_COOKIE_NAME = 'thunder-auth'

export const authCookieOptions = {
  name: AUTH_COOKIE_NAME,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}

export function toSessionCookieOptions(options = {}) {
  if (options.maxAge === 0) {
    return {
      ...options,
      expires: new Date(0),
    }
  }

  const nextOptions = { ...options }
  delete nextOptions.maxAge
  delete nextOptions.expires
  return nextOptions
}

function parseDocumentCookies() {
  if (typeof document === 'undefined' || !document.cookie) return []

  return document.cookie
    .split('; ')
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf('=')
      const name = separator >= 0 ? entry.slice(0, separator) : entry
      const value = separator >= 0 ? entry.slice(separator + 1) : ''

      return {
        name: decodeURIComponent(name),
        value: decodeURIComponent(value),
      }
    })
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`]

  if (options.path) parts.push(`Path=${options.path}`)
  if (options.domain) parts.push(`Domain=${options.domain}`)
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
  if (options.secure) parts.push('Secure')
  if (options.httpOnly) parts.push('HttpOnly')
  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${options.maxAge}`)
  if (options.expires instanceof Date) parts.push(`Expires=${options.expires.toUTCString()}`)

  return parts.join('; ')
}

export function createBrowserSessionCookieMethods() {
  return {
    getAll() {
      return parseDocumentCookies()
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        document.cookie = serializeCookie(name, value, toSessionCookieOptions(options))
      })
    },
  }
}

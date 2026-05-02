'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const WARNING_SECONDS = 60

export default function AdminSessionTimeoutGuard({ timeoutMinutes = 15 }) {
  const router = useRouter()
  const supabase = createClient()
  const timeoutMs = Math.max(1, timeoutMinutes) * 60 * 1000
  const warningMs = Math.max(0, timeoutMs - WARNING_SECONDS * 1000)
  const lastActivityRef = useRef(Date.now())
  const [secondsLeft, setSecondsLeft] = useState(null)

  useEffect(() => {
    function recordActivity() {
      lastActivityRef.current = Date.now()
      setSecondsLeft(null)
    }

    async function signOutForTimeout() {
      sessionStorage.removeItem('thunder-session-active')
      await fetch('/api/auth/signout', { method: 'POST' })
      await supabase.auth.signOut()
      router.replace('/auth?role=staff')
      router.refresh()
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, recordActivity, { passive: true }))

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      if (elapsed >= timeoutMs) {
        window.clearInterval(interval)
        signOutForTimeout()
        return
      }

      if (elapsed >= warningMs) {
        setSecondsLeft(Math.ceil((timeoutMs - elapsed) / 1000))
      }
    }, 1000)

    return () => {
      events.forEach(event => window.removeEventListener(event, recordActivity))
      window.clearInterval(interval)
    }
  }, [router, supabase, timeoutMs, warningMs])

  if (secondsLeft === null) return null

  return (
    <div style={{
      position: 'fixed',
      right: 20,
      bottom: 20,
      zIndex: 120,
      width: 320,
      maxWidth: 'calc(100vw - 24px)',
      borderRadius: 16,
      background: '#1C1C1C',
      border: '1px solid rgba(255,210,0,0.22)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
      padding: '16px 18px',
      color: '#FFFFFF',
    }}>
      <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '0.08em', fontSize: 12, color: '#FFD200', marginBottom: 8 }}>
        SESSION TIMEOUT
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: '#CFCFCF', marginBottom: 14 }}>
        You will be signed out in about {secondsLeft} second{secondsLeft === 1 ? '' : 's'} due to inactivity.
      </p>
      <button
        type="button"
        onClick={() => {
          lastActivityRef.current = Date.now()
          setSecondsLeft(null)
        }}
        style={{
          width: '100%',
          border: 'none',
          borderRadius: 10,
          background: '#FFD200',
          color: '#0B0B0B',
          fontFamily: 'var(--font-cond)',
          fontWeight: 700,
          letterSpacing: '0.06em',
          padding: '10px 14px',
          cursor: 'pointer',
        }}
      >
        Stay Signed In
      </button>
    </div>
  )
}

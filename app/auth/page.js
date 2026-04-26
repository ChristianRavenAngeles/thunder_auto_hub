'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const STAFF_AUTH_ROLES = ['admin', 'manager', 'staff', 'super_admin']
const ADMIN_ROLES = ['admin', 'manager', 'staff', 'super_admin']

function isSafeRedirect(path) {
  return path?.startsWith('/') && !path.startsWith('//')
}

function getStaffDestination(role, redirect) {
  if (isSafeRedirect(redirect)) {
    if (redirect.startsWith('/admin') && ADMIN_ROLES.includes(role)) return redirect
  }

  return '/admin'
}

/* ── Animations ──────────────────────────────────────────────────── */
const STYLES = `
  @keyframes auth-fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
  @keyframes auth-fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes auth-scan      { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
  @keyframes auth-boltFlash { 0%,100%{opacity:1} 50%{opacity:.5;filter:brightness(1.8)} }
  @keyframes auth-glow      { 0%,100%{box-shadow:0 0 0 0 rgba(255,210,0,0)} 50%{box-shadow:0 0 32px 4px rgba(255,210,0,.18)} }
  @keyframes auth-spin      { to{transform:rotate(360deg)} }
  @keyframes auth-otpBounce { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 70%{transform:scale(.96)} 100%{transform:scale(1)} }
  @keyframes auth-successPop{ 0%{opacity:0;transform:scale(.7)} 60%{transform:scale(1.07)} 100%{opacity:1;transform:scale(1)} }
  @keyframes auth-checkDraw { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }
  @keyframes auth-shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes auth-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes auth-ticker    { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @media (max-width: 1024px) {
    .auth-shell {
      width: 100% !important;
      min-height: 100vh !important;
      min-height: 100dvh !important;
      height: auto !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
    }
    .auth-left-panel {
      display: none !important;
    }
    .auth-form-panel {
      min-height: 100vh !important;
      min-height: 100dvh !important;
      padding: clamp(88px, 14vw, 120px) clamp(16px, 5vw, 40px) 32px !important;
      overflow: visible !important;
    }
    .auth-back-link {
      top: 16px !important;
      left: 16px !important;
    }
  }
  @media (max-width: 520px) {
    .auth-form-panel {
      align-items: stretch !important;
    }
  }
`

/* ── Left Panel ──────────────────────────────────────────────────── */
function LeftPanel() {
  return (
    <div className="auth-left-panel" style={{
      flex: '0 0 52%', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '48px 52px',
      backgroundColor: '#0B0B0B',
      backgroundImage: `
        repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px),
        repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px)
      `,
    }}>
      {/* Top yellow rule */}
      <div style={{
        position: 'absolute', top: 0, left: 52, right: 6, height: 3,
        background: 'linear-gradient(to right, #FFD200, transparent)',
      }} />

      {/* Right yellow slash divider */}
      <div style={{
        position: 'absolute', top: 0, right: -1, width: 6, height: '100%',
        background: 'linear-gradient(to bottom, #FFD200 0%, #FFB000 60%, transparent 100%)',
        zIndex: 10,
      }} />

      {/* Ghost BG text */}
      <div style={{
        position: 'absolute', bottom: -60, left: -30,
        fontFamily: 'var(--font-display)', fontSize: 280, lineHeight: 1,
        color: 'rgba(255,210,0,0.03)', userSelect: 'none', pointerEvents: 'none',
        whiteSpace: 'nowrap', letterSpacing: '-0.02em',
      }}>THUNDER</div>

      {/* Scanline */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '30%',
          background: 'linear-gradient(to bottom, transparent, rgba(255,210,0,0.025), transparent)',
          animation: 'auth-scan 6s linear infinite',
        }} />
      </div>

      {/* Car silhouette */}
      <div style={{
        position: 'absolute', right: 10, bottom: '18%',
        opacity: 0.05, pointerEvents: 'none',
        animation: 'auth-fadeIn 2s ease both 0.5s',
      }}>
        <svg width="340" height="160" viewBox="0 0 380 180" fill="none">
          <path d="M20 130 L20 105 L80 60 L180 40 L270 40 L340 70 L370 105 L370 130 Z" fill="white" />
          <path d="M80 105 L110 65 L180 45 L260 45 L310 75 L340 105 Z" fill="white" opacity="0.4" />
          <circle cx="90" cy="130" r="30" fill="#0B0B0B" stroke="white" strokeWidth="6" />
          <circle cx="290" cy="130" r="30" fill="#0B0B0B" stroke="white" strokeWidth="6" />
          <circle cx="90" cy="130" r="12" fill="white" opacity="0.5" />
          <circle cx="290" cy="130" r="12" fill="white" opacity="0.5" />
          <path d="M118 103 L135 70 L185 55 L200 103 Z" fill="white" opacity="0.3" />
          <path d="M205 103 L205 55 L255 55 L280 103 Z" fill="white" opacity="0.3" />
          <ellipse cx="355" cy="110" rx="12" ry="6" fill="#FFD200" opacity="0.9" />
          <ellipse cx="190" cy="163" rx="160" ry="10" fill="white" opacity="0.08" />
        </svg>
      </div>

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 5, animation: 'auth-fadeIn 0.6s ease both' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38, background: '#FFD200', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            animation: 'auth-boltFlash 3s ease-in-out infinite',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#0B0B0B" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 15, letterSpacing: '0.15em', color: '#FFFFFF', lineHeight: 1 }}>THUNDER AUTO HUB</div>
            <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 10, color: '#FFD200', letterSpacing: '0.25em', fontWeight: 500 }}>PREMIUM CAR CARE</div>
          </div>
        </Link>
      </div>

      {/* Hero copy */}
      <div style={{ position: 'relative', zIndex: 5 }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          border: '1px solid rgba(255,210,0,0.3)', borderRadius: 4,
          padding: '5px 12px', marginBottom: 28,
          animation: 'auth-fadeUp 0.7s ease both 0.2s',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD200', animation: 'auth-glow 2s ease infinite' }} />
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.2em', color: '#FFD200', fontWeight: 600 }}>HOME-SERVICE CAR CARE</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(52px, 6vw, 82px)', lineHeight: 0.92,
          letterSpacing: '-0.01em', marginBottom: 24,
          animation: 'auth-fadeUp 0.8s ease both 0.3s',
        }}>
          <span style={{ display: 'block', color: '#FFFFFF' }}>YOUR CAR,</span>
          <span style={{ display: 'block', color: '#FFD200', position: 'relative' }}>
            SPOTLESS
            <span style={{
              position: 'absolute', bottom: -4, left: 0, right: 0, height: 3,
              background: 'linear-gradient(to right, #FFD200, transparent)',
            }} />
          </span>
          <span style={{ display: 'block', color: '#FFFFFF' }}>AND PROTECTED.</span>
        </h1>

        <p style={{
          fontFamily: 'var(--font-barlow)', fontStyle: 'italic', fontWeight: 300,
          fontSize: 17, color: '#CFCFCF', lineHeight: 1.6, maxWidth: 380,
          marginBottom: 44, animation: 'auth-fadeUp 0.9s ease both 0.4s',
        }}>
          Car wash, detailing, at coating — dini-deliver namin sa inyong pintuan. Walang hassle.
        </p>

        {/* Social proof */}
        <div style={{ display: 'flex', gap: 32, animation: 'auth-fadeUp 1s ease both 0.5s' }}>
          {[
            { icon: '★', label: '4.9 Rating',    sub: '500+ customers' },
            { icon: '⚡', label: 'Home Service',  sub: 'We come to you' },
            { icon: '✦', label: 'Guaranteed',    sub: '100% satisfaction' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#FFD200', fontSize: 13 }}>{item.icon}</span>
                <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', color: '#FFFFFF' }}>{item.label}</span>
              </div>
              <span style={{ fontSize: 12, color: '#CFCFCF', paddingLeft: 20 }}>{item.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 5, animation: 'auth-fadeIn 1s ease both 0.8s' }}>
        <p style={{ fontSize: 11, color: '#3A3A3A', letterSpacing: '0.1em', fontFamily: 'var(--font-cond)' }}>
          © {new Date().getFullYear()} THUNDER AUTO HUB — ARAYAT, PAMPANGA
        </p>
      </div>
    </div>
  )
}

/* ── Shared CTA button style ─────────────────────────────────────── */
function ctaStyle(active) {
  return {
    width: '100%', height: 58, borderRadius: 12, border: 'none',
    cursor: active ? 'pointer' : 'not-allowed',
    background: active ? '#FFD200' : '#1F1F1F',
    color: active ? '#0B0B0B' : '#3A3A3A',
    fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.1em',
    transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    boxShadow: active ? '0 0 32px rgba(255,210,0,0.25)' : 'none',
  }
}

/* ── Right Panel ─────────────────────────────────────────────────── */
function AuthForm() {
  const router   = useRouter()
  const params   = useSearchParams()
  const redirect = params.get('redirect') || '/account'
  const roleParam = params.get('role')
  const supabase = useMemo(() => createClient(), [])

  const [role,     setRole]     = useState(roleParam === 'staff' ? 'staff' : 'customer')
  const [step,     setStep]     = useState('form') // form | success
  const [isNew,    setIsNew]    = useState(false)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showPassC,setShowPassC]= useState(false)
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)

  const emailValid      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const passwordValid   = password.length >= 8
  const customerValid   = emailValid && passwordValid && (!isNew || (name.trim() && confirm === password))
  const staffFormValid  = Boolean(email.trim() && password)

  const panelMeta = role === 'staff'
    ? { badge: 'STAFF PORTAL', title: 'Secure Team Access', description: 'Operational login for admin, manager, and staff accounts.' }
    : step === 'success'
      ? { badge: 'ACCESS GRANTED', title: 'You Are Ready', description: 'Your account is set and your dashboard is waiting.' }
      : {
          badge: isNew ? 'NEW CUSTOMER' : 'CUSTOMER LOGIN',
          title: isNew ? 'Create Your Account' : 'Book Faster Every Time',
          description: isNew
            ? 'Sign up once and keep your details ready for future bookings and tracking.'
            : 'Login with your email to access bookings, tracking, and account management.',
        }

  useEffect(() => {
    setRole(roleParam === 'staff' ? 'staff' : 'customer')
  }, [roleParam])

  async function handleCustomerSubmit(e) {
    e?.preventDefault()
    if (!customerValid) return
    setLoading(true)
    try {
      const url = isNew ? '/api/auth/customer-register' : '/api/auth/customer-login'
      const body = isNew ? { email, password, name } : { email, password }
      const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isNew ? 'Account created!' : 'Welcome back!')
      setStep('success')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault()
    if (!email.trim() || !password) return

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      toast.success('Welcome back!')
      router.push(getStaffDestination(data.role, redirect))
      router.refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  function switchRole(val) {
    setRole(val)
    setStep('form')
    setName('')
    setEmail('')
    setPassword('')
    setConfirm('')

    const nextParams = new URLSearchParams(params.toString())
    if (val === 'staff') nextParams.set('role', 'staff')
    else nextParams.delete('role')
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `/auth?${nextQuery}` : '/auth', { scroll: false })
  }

  function getRoleHref(val) {
    const nextParams = new URLSearchParams(params.toString())
    if (val === 'staff') nextParams.set('role', 'staff')
    else nextParams.delete('role')
    const nextQuery = nextParams.toString()
    return nextQuery ? `/auth?${nextQuery}` : '/auth'
  }

  return (
    <div className="auth-form-panel" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      overflowY: 'auto',
      padding: 'clamp(24px, 6vh, 48px) clamp(24px, 5vw, 60px) clamp(24px, 6vh, 48px) clamp(24px, 5vw, 72px)',
      background: `
        radial-gradient(circle at top left, rgba(255,210,0,0.10), transparent 32%),
        radial-gradient(circle at bottom right, rgba(255,176,0,0.08), transparent 28%),
        linear-gradient(180deg, #111111 0%, #090909 100%)
      `,
      backgroundImage: `
        repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,.012) 2px, rgba(255,255,255,.012) 4px),
        repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,.012) 2px, rgba(255,255,255,.012) 4px)
      `,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 72, right: 60, height: 3,
        background: 'linear-gradient(to right, #FFD200, transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 6, height: '100%',
        background: 'linear-gradient(to bottom, #FFD200 0%, #FFB000 60%, transparent 100%)',
        opacity: 0.75, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -52, right: -12,
        fontFamily: 'var(--font-display)', fontSize: 210, lineHeight: 1,
        color: 'rgba(255,210,0,0.035)', userSelect: 'none', pointerEvents: 'none',
        whiteSpace: 'nowrap', letterSpacing: '-0.03em',
      }}>ACCESS</div>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,.55), transparent 92%)',
      }} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '28%',
          background: 'linear-gradient(to bottom, transparent, rgba(255,210,0,0.03), transparent)',
          animation: 'auth-scan 6s linear infinite',
        }} />
      </div>

      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,210,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 110, right: 86,
        width: 170, height: 170, borderRadius: '50%',
        border: '1px solid rgba(255,210,0,0.12)',
        background: 'radial-gradient(circle, rgba(255,210,0,0.10), transparent 68%)',
        filter: 'blur(2px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 96, left: 58,
        width: 120, height: 120, borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(255,210,0,0.08), transparent)',
        border: '1px solid rgba(255,210,0,0.08)',
        transform: 'rotate(18deg)', pointerEvents: 'none',
      }} />

      {/* Decorative corner accents */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, pointerEvents: 'none' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M120 0 L120 40 L80 0 Z" fill="rgba(255,210,0,0.04)" />
          <path d="M120 0 L120 20 L100 0 Z" fill="rgba(255,210,0,0.08)" />
        </svg>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 120, height: 120, pointerEvents: 'none' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M0 120 L0 80 L40 120 Z" fill="rgba(255,210,0,0.04)" />
          <path d="M0 120 L0 100 L20 120 Z" fill="rgba(255,210,0,0.08)" />
        </svg>
      </div>

      {/* Back to home */}
      <div className="auth-back-link" style={{ position: 'absolute', top: 24, left: 24 }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          color: '#E5E5E5', textDecoration: 'none', fontSize: 11,
          fontFamily: 'var(--font-cond)', letterSpacing: '0.08em', fontWeight: 500,
          padding: '8px 12px', borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
          opacity: 0.72, transition: 'opacity 0.2s, border-color 0.2s, transform 0.2s',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = 1
            e.currentTarget.style.borderColor = 'rgba(255,210,0,0.35)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = 0.72
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.transform = ''
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          BACK
        </Link>
      </div>

      <div style={{ maxWidth: 520, width: '100%', position: 'relative', zIndex: 2 }}>

        <div style={{
          position: 'relative',
          borderRadius: 28,
          padding: isNew ? '20px 26px 20px' : '28px 26px 24px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.36)',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -80, right: -20,
            width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,210,0,0.18), transparent 68%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 1, borderRadius: 27,
            border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 2, marginBottom: step === 'success' ? 10 : isNew ? 12 : 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              borderRadius: 999, padding: '5px 10px',
              background: 'rgba(255,210,0,0.10)',
              border: '1px solid rgba(255,210,0,0.18)',
              color: '#FFD200', fontFamily: 'var(--font-cond)', fontSize: 11,
              letterSpacing: '0.18em', fontWeight: 700, marginBottom: isNew ? 8 : 12,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFD200', boxShadow: '0 0 14px rgba(255,210,0,0.8)' }} />
              {panelMeta.badge}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: isNew ? 24 : 34, lineHeight: 0.98,
              letterSpacing: '0.01em', color: '#FFFFFF', marginBottom: isNew ? 6 : 10,
            }}>
              {panelMeta.title}
            </h2>
            {!isNew && (
              <p style={{ color: '#BDBDBD', fontSize: 14, lineHeight: 1.65, maxWidth: 420 }}>
                {panelMeta.description}
              </p>
            )}
          </div>

          {/* Role toggle */}
          {step !== 'success' && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              background: 'rgba(8,8,8,0.66)', borderRadius: 16, padding: 5,
              marginBottom: isNew ? 16 : 34,
              animation: 'auth-fadeUp 0.6s ease both',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              gap: 6,
            }}>
              {[['customer', 'CUSTOMER'], ['staff', 'STAFF / ADMIN']].map(([val, label]) => (
                <Link
                  key={val}
                  href={getRoleHref(val)}
                  aria-pressed={role === val}
                  onClick={() => switchRole(val)}
                  style={{
                  display: 'block',
                  textAlign: 'center',
                  textDecoration: 'none',
                  padding: '12px 0',
                  background: role === val ? 'linear-gradient(180deg, #FFE066, #FFD200)' : 'transparent',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em',
                  color: role === val ? '#0B0B0B' : '#D0D0D0',
                  transition: 'background 0.2s, color 0.2s',
                  boxShadow: role === val ? '0 10px 26px rgba(255,210,0,0.24)' : 'none',
                }}>{label}</Link>
              ))}
            </div>
          )}

        {/* ── Customer: Email + Password form ── */}
        {role === 'customer' && step === 'form' && (
          <form onSubmit={handleCustomerSubmit} style={{ animation: 'auth-fadeUp 0.5s ease both' }}>
            {/* New account toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20, userSelect: 'none' }}>
              <div onClick={() => { setIsNew(!isNew); setConfirm('') }} style={{
                width: 20, height: 20, borderRadius: 5,
                background: isNew ? '#FFD200' : '#1F1F1F',
                border: `2px solid ${isNew ? '#FFD200' : '#3A3A3A'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0, cursor: 'pointer',
              }}>
                {isNew && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <span style={{ fontSize: 14, color: '#CFCFCF' }}>
                First time?{' '}
                <span style={{ color: '#FFD200', fontWeight: 600 }}>Create new account</span>
              </span>
            </label>

            {isNew && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 6 }}>FULL NAME</label>
                <input
                  placeholder="Juan dela Cruz" value={name} onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%', height: 52, background: '#1F1F1F',
                    border: '2px solid #3A3A3A', borderRadius: 12,
                    color: '#FFFFFF', paddingLeft: 20, paddingRight: 20,
                    fontSize: 15, fontFamily: 'var(--font-cond)', fontWeight: 500,
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,0.4)'}
                  onBlur={e => e.target.style.borderColor = '#3A3A3A'}
                />
              </div>
            )}

            <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 6 }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3A3A3A' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <input
                type="email" placeholder="juan@email.com" value={email}
                onChange={e => setEmail(e.target.value)} autoComplete="email"
                style={{
                  width: '100%', height: 52, background: '#1F1F1F',
                  border: `2px solid ${emailValid ? '#FFD200' : '#3A3A3A'}`,
                  borderRadius: 12, color: '#FFFFFF',
                  paddingLeft: 48, paddingRight: 20,
                  fontSize: 15, fontFamily: 'var(--font-cond)', fontWeight: 500,
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => { if (!emailValid) e.target.style.borderColor = 'rgba(255,210,0,0.4)' }}
                onBlur={e => { if (!emailValid) e.target.style.borderColor = '#3A3A3A' }}
              />
              {emailValid && (
                <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#FFD200' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
              )}
            </div>

            <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 6 }}>PASSWORD</label>
            <div style={{ position: 'relative', marginBottom: isNew ? 16 : 24 }}>
              <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3A3A3A' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input
                type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={password}
                onChange={e => setPassword(e.target.value)} autoComplete={isNew ? 'new-password' : 'current-password'}
                style={{
                  width: '100%', height: 52, background: '#1F1F1F',
                  border: `2px solid ${passwordValid ? '#FFD200' : '#3A3A3A'}`,
                  borderRadius: 12, color: '#FFFFFF',
                  paddingLeft: 48, paddingRight: 52,
                  fontSize: 15, fontFamily: 'var(--font-cond)', fontWeight: 500,
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => { if (!passwordValid) e.target.style.borderColor = 'rgba(255,210,0,0.4)' }}
                onBlur={e => { if (!passwordValid) e.target.style.borderColor = '#3A3A3A' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#CFCFCF', cursor: 'pointer', padding: 0,
              }}>
                {showPass
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            {isNew && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 6 }}>CONFIRM PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3A3A3A' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input
                    type={showPassC ? 'text' : 'password'} placeholder="Repeat password" value={confirm}
                    onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
                    style={{
                      width: '100%', height: 52, background: '#1F1F1F',
                      border: `2px solid ${confirm && confirm === password ? '#FFD200' : '#3A3A3A'}`,
                      borderRadius: 12, color: '#FFFFFF',
                      paddingLeft: 48, paddingRight: 52,
                      fontSize: 15, fontFamily: 'var(--font-cond)', fontWeight: 500,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,0.4)'}
                    onBlur={e => e.target.style.borderColor = confirm && confirm === password ? '#FFD200' : '#3A3A3A'}
                  />
                  <button type="button" onClick={() => setShowPassC(!showPassC)} style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#CFCFCF', cursor: 'pointer', padding: 0,
                  }}>
                    {showPassC
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={!customerValid || loading}
              style={ctaStyle(customerValid && !loading)}
              onMouseEnter={e => { if (customerValid && !loading) { e.currentTarget.style.background = '#FFC800'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
              onMouseLeave={e => { e.currentTarget.style.background = customerValid && !loading ? '#FFD200' : '#1F1F1F'; e.currentTarget.style.transform = '' }}
            >
              {loading
                ? <div style={{ width: 22, height: 22, border: '3px solid rgba(0,0,0,0.3)', borderTopColor: '#0B0B0B', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
                : isNew
                  ? <>CREATE ACCOUNT <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                  : <>LOGIN <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
              }
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 16, lineHeight: 1.6 }}>
              By continuing, you agree to our{' '}
              <Link href="/terms" style={{ color: '#CFCFCF', textDecoration: 'underline' }}>Terms</Link> and{' '}
              <Link href="/privacy" style={{ color: '#CFCFCF', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
          </form>
        )}

        {/* ── Success step ── */}
        {role === 'customer' && step === 'success' && (
          <div style={{ animation: 'auth-successPop 0.5s ease both', textAlign: 'center' }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'rgba(255,210,0,0.12)', border: '2px solid #FFD200',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
              boxShadow: '0 0 48px rgba(255,210,0,0.2)',
            }}>
              <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
                <path d="M14 30 L26 42 L46 18"
                  stroke="#FFD200" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="60" strokeDashoffset="60"
                  style={{ animation: 'auth-checkDraw 0.5s ease forwards 0.2s' }}
                />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 46, lineHeight: 1, marginBottom: 12, color: '#FFFFFF' }}>{isNew ? 'ACCOUNT CREATED!' : 'WELCOME BACK!'}</h2>
            <p style={{ fontSize: 15, color: '#CFCFCF', lineHeight: 1.6, marginBottom: 36 }}>Naka-login ka na. Handa na ang iyong dashboard.</p>
            <div style={{ background: '#1F1F1F', borderRadius: 14, padding: '20px 24px', border: '1px solid #3A3A3A', marginBottom: 28, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: '#CFCFCF', fontFamily: 'var(--font-cond)', letterSpacing: '0.15em', marginBottom: 6 }}>LOGGED IN AS</div>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 18, letterSpacing: '0.1em', color: '#FFFFFF' }}>{email}</div>
              <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', background: 'rgba(255,210,0,0.12)', border: '1px solid rgba(255,210,0,0.3)', borderRadius: 6, fontSize: 11, color: '#FFD200', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '0.12em' }}>CUSTOMER</div>
            </div>
            <button onClick={() => { router.push(redirect); router.refresh() }}
              style={ctaStyle(true)}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFC800'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFD200'; e.currentTarget.style.transform = '' }}
            >
              GO TO DASHBOARD
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

          {/* ── Staff / Admin: email + password ── */}
          {role === 'staff' && (
          <form onSubmit={handleAdminLogin} style={{ animation: 'auth-fadeUp 0.5s ease both' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 42, lineHeight: 1, marginBottom: 8, color: '#FFFFFF' }}>STAFF LOGIN</h2>
            <p style={{ fontSize: 14, color: '#CFCFCF', marginBottom: 32, lineHeight: 1.5 }}>
              Para sa admin, manager, at staff accounts.
            </p>

            {/* Email */}
            <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 8 }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3A3A3A' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <input
                type="email" placeholder="staff@thunder.ph" value={email}
                onChange={e => setEmail(e.target.value)} autoComplete="email" required
                style={{
                  width: '100%', height: 58, background: '#1F1F1F',
                  border: '2px solid #3A3A3A', borderRadius: 12,
                  color: '#FFFFFF', paddingLeft: 48, paddingRight: 20,
                  fontSize: 15, fontFamily: 'var(--font-cond)', fontWeight: 500,
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,0.4)'}
                onBlur={e => e.target.style.borderColor = '#3A3A3A'}
              />
            </div>

            {/* Password */}
            <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 8 }}>PASSWORD</label>
            <div style={{ position: 'relative', marginBottom: 32 }}>
              <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3A3A3A' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input
                type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} autoComplete="current-password" required
                style={{
                  width: '100%', height: 58, background: '#1F1F1F',
                  border: '2px solid #3A3A3A', borderRadius: 12,
                  color: '#FFFFFF', paddingLeft: 48, paddingRight: 52,
                  fontSize: 16, fontFamily: 'var(--font-cond)', fontWeight: 500,
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,0.4)'}
                onBlur={e => e.target.style.borderColor = '#3A3A3A'}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#CFCFCF', cursor: 'pointer', padding: 0,
              }}>
                {showPass
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            <button type="submit" disabled={!staffFormValid || loading}
              style={ctaStyle(staffFormValid && !loading)}
              onMouseEnter={e => { if (staffFormValid && !loading) { e.currentTarget.style.background = '#FFC800'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = staffFormValid && !loading ? '#FFD200' : '#1F1F1F'; e.currentTarget.style.transform = '' }}
            >
              {loading
                ? <div style={{ width: 22, height: 22, border: '3px solid rgba(0,0,0,0.3)', borderTopColor: '#0B0B0B', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
                : 'LOGIN TO DASHBOARD'
              }
            </button>

            {/* Staff info card */}
            <div style={{
              marginTop: 28, padding: '16px 20px',
              background: 'rgba(255,210,0,0.04)', border: '1px solid rgba(255,210,0,0.12)',
              borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🔒</span>
              <div>
                <div style={{ fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#FFD200', marginBottom: 4 }}>STAFF ACCESS ONLY</div>
                <p style={{ fontSize: 12, color: '#777', lineHeight: 1.6 }}>
                  Ang page na ito ay para lamang sa authorized staff at admin ng Thunder Auto Hub. Kung customer ka, gamitin ang Customer tab.
                </p>
              </div>
            </div>
          </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <>
      <style>{STYLES}</style>
      <div className="auth-shell" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0B0B0B', color: '#FFFFFF', fontFamily: 'var(--font-barlow)' }}>
        <LeftPanel />
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>
    </>
  )
}

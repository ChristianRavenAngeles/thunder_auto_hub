'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

/* ── Left panel ─────────────────────────────────────────────────── */
function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between flex-none relative overflow-hidden"
      style={{
        width: '52%',
        padding: '48px 52px',
        backgroundColor: '#0B0B0B',
        backgroundImage: `
          repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px),
          repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)
        `,
      }}
    >
      {/* Top horizontal rule */}
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

      {/* Giant BG text */}
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
          animation: 'auth-scanline 6s linear infinite',
        }} />
      </div>

      {/* Car silhouette */}
      <div style={{
        position: 'absolute', right: 52, bottom: 120,
        opacity: 0.07, pointerEvents: 'none',
        animation: 'auth-fadeIn 2s ease both 0.5s',
      }}>
        <svg width="380" height="180" viewBox="0 0 380 180" fill="none">
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
        <Link href="/" className="flex items-center gap-2.5 w-fit group">
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
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD200', animation: 'auth-pulse-glow 2s ease infinite' }} />
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.2em', color: '#FFD200', fontWeight: 600 }}>HOME-SERVICE CAR CARE</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 86, lineHeight: 0.92,
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
            { icon: '★', label: '4.9 Rating', sub: '500+ customers' },
            { icon: '⚡', label: 'Home Service', sub: 'We come to you' },
            { icon: '✦', label: 'Guaranteed', sub: '100% satisfaction' },
          ].map((item) => (
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

/* ── OTP digit boxes ─────────────────────────────────────────────── */
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([])
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  function handleKey(e, idx) {
    if (e.key === 'Backspace') {
      const next = [...digits]
      if (next[idx]) { next[idx] = ''; onChange(next.join('')) }
      else if (idx > 0) inputs.current[idx - 1]?.focus()
    } else if (/^\d$/.test(e.key)) {
      const next = [...digits]
      next[idx] = e.key
      onChange(next.join(''))
      if (idx < 5) inputs.current[idx + 1]?.focus()
      e.preventDefault()
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      onChange(pasted)
      inputs.current[5]?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10 }} onPaste={handlePaste}>
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          readOnly
          onKeyDown={e => handleKey(e, i)}
          onClick={() => inputs.current[i]?.focus()}
          disabled={disabled}
          autoFocus={i === 0}
          style={{
            width: 52, height: 62,
            background: digits[i] ? 'rgba(255,210,0,0.1)' : '#1F1F1F',
            border: `2px solid ${digits[i] ? '#FFD200' : '#3A3A3A'}`,
            borderRadius: 10,
            color: digits[i] ? '#FFD200' : '#FFFFFF',
            fontSize: 26,
            fontFamily: 'var(--font-display)',
            textAlign: 'center',
            outline: 'none',
            cursor: 'text',
            transition: 'all 0.15s',
            animation: digits[i] ? 'auth-otpBounce 0.2s ease' : 'none',
          }}
        />
      ))}
    </div>
  )
}

/* ── Right panel / form ──────────────────────────────────────────── */
function AuthForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/account'

  const [role, setRole] = useState('customer')
  const [step, setStep] = useState('phone') // phone | otp | success
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  function formatPhone(v) {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 4) return d
    if (d.length <= 7) return `${d.slice(0,4)} ${d.slice(4)}`
    return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7)}`
  }

  const rawPhone = phone.replace(/\s/g, '')
  const phoneValid = rawPhone.length === 11 && rawPhone.startsWith('09')
  const maskedPhone = phone.replace(/\s/g, '').replace(/(\d{4})\d{4}(\d{3})/, '$1 •••• $2')

  useEffect(() => {
    if (countdown <= 0) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current); return 0 } return c - 1 })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [countdown])

  async function handleSendOTP(e) {
    e?.preventDefault()
    if (!phoneValid) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('OTP sent! Check your SMS.')
      setStep('otp')
      setCountdown(60)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e) {
    e?.preventDefault()
    if (otp.length < 6) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone, otp, name: isNew ? name : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Welcome to Thunder Auto Hub!')
      setStep('success')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const dest = data.role === 'rider' ? '/rider' : '/admin'
      toast.success('Welcome back!')
      router.push(dest)
      router.refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  function switchRole(val) {
    setRole(val)
    setStep('phone')
    setPhone('')
    setOtp('')
    setName('')
    setEmail('')
    setPassword('')
  }

  /* Shared CTA button style */
  function ctaBtnStyle(active) {
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

  return (
    <div
      className="flex min-h-screen"
      style={{ background: '#0B0B0B', color: '#FFFFFF', fontFamily: 'var(--font-barlow)' }}
    >
      <LeftPanel />

      {/* Right panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '48px 60px 48px 72px',
        background: '#0B0B0B', position: 'relative', overflow: 'hidden',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,210,0,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Mobile logo row */}
        <div className="lg:hidden w-full mb-6" style={{ maxWidth: 400 }}>
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div style={{ width: 38, height: 38, background: '#FFD200', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#0B0B0B" />
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 15, letterSpacing: '0.15em', color: '#FFFFFF' }}>THUNDER AUTO HUB</span>
            </Link>
            <Link href="/" style={{ fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.1em', color: '#CFCFCF', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              HOME
            </Link>
          </div>
        </div>

        {/* Back to home — desktop */}
        <div className="hidden lg:block absolute" style={{ top: 40, left: 72 }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#CFCFCF', textDecoration: 'none', fontSize: 13,
            fontFamily: 'var(--font-cond)', letterSpacing: '0.08em', fontWeight: 500,
            opacity: 0.7, transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            BACK TO HOME
          </Link>
        </div>

        <div style={{ maxWidth: 400, width: '100%', position: 'relative', zIndex: 2 }}>

          {/* Role toggle */}
          {step !== 'success' && (
            <div style={{
              display: 'flex', background: '#1F1F1F', borderRadius: 12, padding: 4,
              marginBottom: 40, position: 'relative',
              animation: 'auth-fadeUp 0.6s ease both',
            }}>
              <div style={{
                position: 'absolute', top: 4,
                left: role === 'customer' ? 4 : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)', height: 'calc(100% - 8px)',
                background: '#FFD200', borderRadius: 8,
                transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
              }} />
              {[['customer', 'CUSTOMER'], ['staff', 'STAFF / ADMIN']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => switchRole(val)}
                  style={{
                    flex: 1, padding: '11px 0', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '0.08em',
                    color: role === val ? '#0B0B0B' : '#CFCFCF',
                    position: 'relative', zIndex: 2, transition: 'color 0.2s',
                  }}
                >{label}</button>
              ))}
            </div>
          )}

          {/* ── Phone step ── */}
          {role === 'customer' && step === 'phone' && (
            <form onSubmit={handleSendOTP} key="phone" style={{ animation: 'auth-fadeUp 0.5s ease both' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 42, letterSpacing: '0.01em', lineHeight: 1, marginBottom: 8, color: '#FFFFFF' }}>
                {isNew ? 'CREATE ACCOUNT' : 'MAG-LOGIN'}
              </h2>
              <p style={{ fontSize: 14, color: '#CFCFCF', marginBottom: 32, lineHeight: 1.5 }}>
                {isNew
                  ? 'I-enter ang iyong phone number para mag-sign up.'
                  : 'I-enter ang iyong phone number para makatanggap ng OTP.'}
              </p>

              <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 8 }}>
                PHONE NUMBER
              </label>

              <div style={{ position: 'relative', marginBottom: 20 }}>
                <div style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  pointerEvents: 'none',
                }}>
                  <span style={{ fontSize: 18 }}>🇵🇭</span>
                  <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 600, color: '#CFCFCF', fontSize: 13 }}>+63</span>
                  <div style={{ width: 1, height: 18, background: '#3A3A3A' }} />
                </div>
                <input
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  style={{
                    width: '100%', height: 58,
                    background: '#1F1F1F',
                    border: `2px solid ${phoneValid ? '#FFD200' : '#3A3A3A'}`,
                    borderRadius: 12, color: '#FFFFFF',
                    paddingLeft: 90, paddingRight: 20,
                    fontSize: 18, fontFamily: 'var(--font-cond)', fontWeight: 600, letterSpacing: '0.08em',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { if (!phoneValid) e.target.style.borderColor = 'rgba(255,210,0,0.4)' }}
                  onBlur={e => { if (!phoneValid) e.target.style.borderColor = '#3A3A3A' }}
                />
                {phoneValid && (
                  <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#FFD200' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
              </div>

              {/* New account toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: isNew ? 16 : 28, userSelect: 'none' }}>
                <div
                  onClick={() => setIsNew(!isNew)}
                  style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: isNew ? '#FFD200' : '#1F1F1F',
                    border: `2px solid ${isNew ? '#FFD200' : '#3A3A3A'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', flexShrink: 0, cursor: 'pointer',
                  }}
                >
                  {isNew && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <span style={{ fontSize: 14, color: '#CFCFCF' }}>
                  First time?{' '}
                  <span style={{ color: '#FFD200', fontWeight: 600 }} onClick={() => setIsNew(!isNew)}>Create new account</span>
                </span>
              </label>

              {isNew && (
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 8 }}>FULL NAME</label>
                  <input
                    placeholder="Juan dela Cruz"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    style={{
                      width: '100%', height: 58, background: '#1F1F1F',
                      border: '2px solid #3A3A3A', borderRadius: 12,
                      color: '#FFFFFF', paddingLeft: 20, paddingRight: 20,
                      fontSize: 16, fontFamily: 'var(--font-cond)', fontWeight: 500,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,0.4)'}
                    onBlur={e => e.target.style.borderColor = '#3A3A3A'}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!phoneValid || loading}
                style={ctaBtnStyle(phoneValid && !loading)}
                onMouseEnter={e => { if (phoneValid) { e.currentTarget.style.background = '#FFC800'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
                onMouseLeave={e => { e.currentTarget.style.background = phoneValid ? '#FFD200' : '#1F1F1F'; e.currentTarget.style.transform = '' }}
              >
                {loading
                  ? <div style={{ width: 22, height: 22, border: '3px solid rgba(0,0,0,0.3)', borderTopColor: '#0B0B0B', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
                  : <>SEND OTP <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                }
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 20, lineHeight: 1.6 }}>
                By continuing, you agree to our{' '}
                <Link href="/terms" style={{ color: '#CFCFCF', textDecoration: 'underline' }}>Terms</Link>{' '}
                and{' '}
                <Link href="/privacy" style={{ color: '#CFCFCF', textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>
            </form>
          )}

          {/* ── OTP step ── */}
          {role === 'customer' && step === 'otp' && (
            <form onSubmit={handleVerifyOTP} key="otp" style={{ animation: 'auth-fadeUp 0.5s ease both' }}>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                  color: '#CFCFCF', cursor: 'pointer', fontSize: 13,
                  fontFamily: 'var(--font-cond)', letterSpacing: '0.08em', marginBottom: 32, padding: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                CHANGE NUMBER
              </button>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 42, lineHeight: 1, marginBottom: 8, color: '#FFFFFF' }}>CHECK YOUR SMS</h2>
              <p style={{ fontSize: 14, color: '#CFCFCF', marginBottom: 8, lineHeight: 1.5 }}>
                Nagpadala kami ng 6-digit code sa
              </p>
              <p style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 17, color: '#FFD200', letterSpacing: '0.12em', marginBottom: 36 }}>
                {maskedPhone}
              </p>

              <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 14 }}>
                ENTER OTP
              </label>

              <div style={{ marginBottom: 32 }}>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
              </div>

              <button
                type="submit"
                disabled={otp.length < 6 || loading}
                style={ctaBtnStyle(otp.length === 6 && !loading)}
                onMouseEnter={e => { if (otp.length === 6) { e.currentTarget.style.background = '#FFC800'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
                onMouseLeave={e => { e.currentTarget.style.background = otp.length === 6 ? '#FFD200' : '#1F1F1F'; e.currentTarget.style.transform = '' }}
              >
                {loading
                  ? <div style={{ width: 22, height: 22, border: '3px solid rgba(0,0,0,0.3)', borderTopColor: '#0B0B0B', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
                  : 'VERIFY & CONTINUE'
                }
              </button>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#CFCFCF' }}>
                Di natanggap?{' '}
                {countdown > 0
                  ? <span style={{ color: '#3A3A3A' }}>Resend in {countdown}s</span>
                  : <span onClick={handleSendOTP} style={{ color: '#FFD200', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</span>
                }
              </div>
            </form>
          )}

          {/* ── Success screen ── */}
          {role === 'customer' && step === 'success' && (
            <div key="success" style={{ animation: 'auth-successPop 0.5s ease both', textAlign: 'center' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'rgba(255,210,0,0.12)', border: '2px solid #FFD200',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 28px',
                boxShadow: '0 0 48px rgba(255,210,0,0.2)',
              }}>
                <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
                  <path
                    d="M14 30 L26 42 L46 18"
                    stroke="#FFD200" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="60" strokeDashoffset="60"
                    style={{ animation: 'auth-checkDraw 0.5s ease forwards 0.2s' }}
                  />
                </svg>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 46, lineHeight: 1, marginBottom: 12, color: '#FFFFFF' }}>
                WELCOME BACK!
              </h2>
              <p style={{ fontSize: 15, color: '#CFCFCF', lineHeight: 1.6, marginBottom: 36 }}>
                Naka-login ka na. Handa na ang iyong dashboard. 🚗
              </p>

              <div style={{
                background: '#1F1F1F', borderRadius: 14, padding: '20px 24px',
                border: '1px solid #3A3A3A', marginBottom: 28, textAlign: 'left',
              }}>
                <div style={{ fontSize: 11, color: '#CFCFCF', fontFamily: 'var(--font-cond)', letterSpacing: '0.15em', marginBottom: 6 }}>LOGGED IN AS</div>
                <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 18, letterSpacing: '0.1em', color: '#FFFFFF' }}>{maskedPhone}</div>
                <div style={{
                  display: 'inline-block', marginTop: 8, padding: '3px 10px',
                  background: 'rgba(255,210,0,0.12)', border: '1px solid rgba(255,210,0,0.3)',
                  borderRadius: 6, fontSize: 11, color: '#FFD200',
                  fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '0.12em',
                }}>CUSTOMER</div>
              </div>

              <button
                onClick={() => { router.push(redirect); router.refresh() }}
                style={{ ...ctaBtnStyle(true) }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFC800'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFD200'; e.currentTarget.style.transform = '' }}
              >
                GO TO DASHBOARD
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          )}

          {/* ── Staff / Admin login ── */}
          {role === 'staff' && (
            <form onSubmit={handleAdminLogin} key="admin" style={{ animation: 'auth-fadeUp 0.5s ease both' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 42, lineHeight: 1, marginBottom: 8, color: '#FFFFFF' }}>STAFF LOGIN</h2>
              <p style={{ fontSize: 14, color: '#CFCFCF', marginBottom: 32, lineHeight: 1.5 }}>
                Para sa admin, manager, staff, at rider accounts.
              </p>

              <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 8 }}>EMAIL</label>
              <input
                type="email"
                placeholder="staff@thunder.ph"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{
                  width: '100%', height: 58, background: '#1F1F1F',
                  border: '2px solid #3A3A3A', borderRadius: 12,
                  color: '#FFFFFF', paddingLeft: 20, paddingRight: 20,
                  fontSize: 16, fontFamily: 'var(--font-cond)', fontWeight: 500,
                  outline: 'none', transition: 'border-color 0.2s', marginBottom: 20,
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,0.4)'}
                onBlur={e => e.target.style.borderColor = '#3A3A3A'}
              />

              <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '0.15em', color: '#CFCFCF', fontWeight: 600, marginBottom: 8 }}>PASSWORD</label>
              <div style={{ position: 'relative', marginBottom: 28 }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%', height: 58, background: '#1F1F1F',
                    border: '2px solid #3A3A3A', borderRadius: 12,
                    color: '#FFFFFF', paddingLeft: 20, paddingRight: 52,
                    fontSize: 16, fontFamily: 'var(--font-cond)', fontWeight: 500,
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,0.4)'}
                  onBlur={e => e.target.style.borderColor = '#3A3A3A'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#CFCFCF', cursor: 'pointer', padding: 0,
                  }}
                >
                  {showPass
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={ctaBtnStyle(!loading)}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFC800'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFD200'; e.currentTarget.style.transform = '' }}
              >
                {loading
                  ? <div style={{ width: 22, height: 22, border: '3px solid rgba(0,0,0,0.3)', borderTopColor: '#0B0B0B', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
                  : 'LOGIN TO DASHBOARD'
                }
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}

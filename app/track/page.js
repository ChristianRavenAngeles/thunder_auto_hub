'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'

export default function TrackPage() {
  const router = useRouter()
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)

  function track() {
    const val = ref.trim().toUpperCase()
    if (!val) return
    setLoading(true)
    router.push(`/track/${val}`)
  }

  return (
    <>
      <style>{`
        @keyframes track-pop    { 0%{opacity:0;transform:scale(.95)} 100%{opacity:1;transform:none} }
        @keyframes track-pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes track-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(255,210,0,0)} 50%{box-shadow:0 0 28px 4px rgba(255,210,0,.2)} }
        @keyframes track-spin   { to{transform:rotate(360deg)} }
        @keyframes track-fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
      `}</style>

      <PublicNav />

      <main style={{
        minHeight: '100vh', minHeight: '100dvh', background: '#0B0B0B',
        backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px),repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px)',
        padding: 'clamp(96px, 16vw, 100px) 0 80px', position: 'relative',
      }}>
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom,#FFD200,rgba(255,178,0,.4),transparent)', pointerEvents: 'none', zIndex: 50 }} />

        <div style={{ width: '100%', maxWidth: 680, margin: '0 auto', padding: '0 clamp(14px, 4vw, 24px)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 52, animation: 'track-fadeUp .5s ease both' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,210,0,.3)', borderRadius: 40, padding: '5px 16px', marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD200', animation: 'track-glow 2s ease infinite' }} />
              <span style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.2em', color: '#FFD200' }}>REAL-TIME TRACKING</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px,10vw,72px)', lineHeight: .9, letterSpacing: '-.01em', marginBottom: 12, color: '#FFFFFF' }}>
              TRACK YOUR<br /><span style={{ color: '#FFD200' }}>BOOKING</span>
            </h1>
            <p style={{ fontSize: 15, color: '#CFCFCF', lineHeight: 1.6, fontStyle: 'italic' }}>
              I-enter ang inyong booking reference number para makita ang status ng inyong serbisyo.
            </p>
          </div>

          {/* Search card */}
          <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 20, padding: 'clamp(22px, 5vw, 36px) clamp(16px, 5vw, 40px)', marginBottom: 24, boxShadow: '0 24px 80px rgba(0,0,0,.5)' }}>
            <label style={{ fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: '.14em', color: '#CFCFCF', display: 'block', marginBottom: 8 }}>
              REFERENCE NUMBER
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px' }}>
                <input
                  type="text"
                  value={ref}
                  onChange={e => setRef(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && track()}
                  placeholder="TAH-XXXXXXXX"
                  style={{
                    width: '100%', height: 54, background: '#222', border: '1.5px solid #3A3A3A',
                    borderRadius: 10, color: '#FFFFFF', padding: '0 16px',
                    fontSize: 16, fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.12em',
                    outline: 'none', transition: 'border-color .15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.5)'}
                  onBlur={e => e.target.style.borderColor = '#3A3A3A'}
                />
              </div>
              <button
                onClick={track}
                disabled={!ref.trim() || loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: ref.trim() ? '#FFD200' : '#1A1A1A',
                  color: ref.trim() ? '#0B0B0B' : '#3A3A3A',
                  border: 'none', cursor: ref.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '.1em',
                  padding: '0 28px', borderRadius: 10, flexShrink: 0,
                  transition: 'background .15s', opacity: ref.trim() ? 1 : .5, minHeight: 54,
                }}
                onMouseEnter={e => { if (ref.trim()) e.currentTarget.style.background = '#FFC800' }}
                onMouseLeave={e => { if (ref.trim()) e.currentTarget.style.background = '#FFD200' }}
              >
                {loading
                  ? <div style={{ width: 20, height: 20, border: '2.5px solid rgba(0,0,0,.3)', borderTopColor: '#0B0B0B', borderRadius: '50%', animation: 'track-spin .7s linear infinite' }} />
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg> Track</>
                }
              </button>
            </div>
          </div>

          {/* Book CTA */}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontSize: 14, color: '#777', marginBottom: 16 }}>
              Wala pang booking? Mag-book ngayon at i-experience ang premium home-service car care.
            </p>
            <Link href="/book" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#FFD200', color: '#0B0B0B', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '.1em',
              padding: '14px 28px', borderRadius: 10, textDecoration: 'none',
              transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFC800'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFD200'}
            >
              BOOK NOW
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </>
  )
}

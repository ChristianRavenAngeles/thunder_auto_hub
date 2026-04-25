'use client'

import Link from 'next/link'

export default function CtaSection() {
  return (
    <section style={{
      padding: 'clamp(64px, 10vw, 100px) 0', background: '#FFD200', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, background: 'rgba(0,0,0,.08)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 300, height: 300, background: 'rgba(0,0,0,.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
        {/* BG ghost text */}
        <div style={{
          position: 'absolute', bottom: -40, right: -20,
          fontFamily: 'var(--font-display)', fontSize: 200, lineHeight: 1,
          color: 'rgba(0,0,0,.05)', userSelect: 'none', whiteSpace: 'nowrap',
        }}>THUNDER</div>
      </div>

      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,0,0,.15)', border: '1px solid rgba(0,0,0,.15)',
          borderRadius: 40, padding: '6px 16px', marginBottom: 24,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13Z" fill="#0B0B0B" />
          </svg>
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: '#0B0B0B' }}>READY TO BOOK?</span>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 72px)',
          lineHeight: 0.95, color: '#0B0B0B', marginBottom: 20, letterSpacing: '-0.01em',
        }}>
          ANG SASAKYAN MO AY<br />NARARAPAT SA PINAKAMAHUSAY
        </h2>

        <p style={{ fontSize: 18, color: 'rgba(0,0,0,.7)', marginBottom: 40, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Book ngayon at maranasan ang premium home-service car care. ₱100 lang ang reservation deposit.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          <Link href="/book" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#0B0B0B', color: '#FFFFFF', fontFamily: 'var(--font-display)',
            fontSize: 'clamp(15px, 4vw, 18px)', letterSpacing: '0.1em', padding: '16px clamp(20px, 5vw, 32px)', borderRadius: 10,
            textDecoration: 'none', transition: 'background 0.15s', justifyContent: 'center', textAlign: 'center',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1F1F1F'}
            onMouseLeave={e => e.currentTarget.style.background = '#0B0B0B'}
          >
            BOOK AN APPOINTMENT
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link href="/track" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,0,0,.15)', color: '#0B0B0B', border: '1px solid rgba(0,0,0,.2)',
            fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.1em',
            padding: '16px clamp(20px, 5vw, 32px)', borderRadius: 10, textDecoration: 'none',
            transition: 'background 0.15s', justifyContent: 'center', textAlign: 'center',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,.15)'}
          >TRACK MY BOOKING</Link>
        </div>
      </div>
    </section>
  )
}

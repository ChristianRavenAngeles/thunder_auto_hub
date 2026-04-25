'use client'

import Link from 'next/link'

const STATS = [
  { val: '500+', label: 'Happy Customers', highlight: false },
  { val: '4.9★', label: 'Average Rating',  highlight: true  },
  { val: '25km', label: 'Service Range',   highlight: false },
  { val: '2hr',  label: 'Avg. Service Time', highlight: false },
]

const TRUST = [
  { icon: '📍', text: 'Arayat, Pampanga & nearby' },
  { icon: '🕗', text: 'Mon–Fri, 8AM–6PM' },
  { icon: '✦',  text: '100% Satisfaction Guaranteed' },
]

export default function HeroSection() {
  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '140px 0 0', position: 'relative', overflow: 'hidden',
        backgroundColor: '#0B0B0B',
        backgroundImage: `
          repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px),
          repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px)
        `,
      }}
    >
      {/* Ghost BG text */}
      <div style={{
        position: 'absolute', bottom: -80, left: -20,
        fontFamily: 'var(--font-display)', fontSize: 320, lineHeight: 1,
        color: 'rgba(255,210,0,0.03)', userSelect: 'none', pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>THUNDER</div>

      {/* Right yellow slash */}
      <div style={{
        position: 'absolute', right: 0, top: 0, width: 4, height: '100%',
        background: 'linear-gradient(to bottom, #FFD200, rgba(255,178,0,.4), transparent)',
      }} />

      {/* Scanline */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '25%',
          background: 'linear-gradient(to bottom, transparent, rgba(255,210,0,.02), transparent)',
          animation: 'hero-scan 8s linear infinite',
        }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 2, flex: 1 }}>
        <div style={{ maxWidth: 780, animation: 'hero-fadeUp 0.8s ease both' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(255,210,0,.3)', borderRadius: 40,
            padding: '6px 16px', marginBottom: 32,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFD200', animation: 'hero-glow 2s ease infinite' }} />
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: '#FFD200' }}>
              PREMIUM HOME-SERVICE CAR CARE
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(52px, 6vw, 90px)',
            lineHeight: 0.92, letterSpacing: '-0.01em', marginBottom: 28, color: '#FFFFFF',
          }}>
            <span style={{ display: 'block' }}>YOUR CAR DESERVES</span>
            <span style={{ display: 'block', color: '#FFD200', position: 'relative' }}>
              THUNDER-LEVEL
              <span style={{
                position: 'absolute', bottom: -2, left: 0, right: 0, height: 3,
                background: 'linear-gradient(to right, #FFD200, transparent)',
              }} />
            </span>
            <span style={{ display: 'block' }}>CARE.</span>
          </h1>

          <p style={{
            fontSize: 18, color: '#CFCFCF', lineHeight: 1.65,
            maxWidth: 520, marginBottom: 44, fontWeight: 300,
            fontFamily: 'var(--font-barlow)', fontStyle: 'italic',
          }}>
            Premium car wash, detailing, at coating — dini-deliver namin sa inyong pintuan.
            Walang hassle. Professional results. Mismo sa inyong location.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 48, flexWrap: 'wrap' }}>
            <Link href="/book" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#FFD200', color: '#0B0B0B', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: '0.1em',
              padding: '16px 32px', borderRadius: 10, textDecoration: 'none',
              transition: 'background 0.15s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFC800'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFD200'; e.currentTarget.style.transform = '' }}
            >
              BOOK NOW — LIBRE ANG PUMUNTA
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/#services" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', color: '#FFFFFF', border: '1px solid #3A3A3A', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: '0.1em',
              padding: '16px 32px', borderRadius: 10, textDecoration: 'none',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#CFCFCF'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.transform = '' }}
            >VIEW SERVICES & PRICING</Link>
          </div>

          {/* Trust row */}
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', paddingBottom: 72 }}>
            {TRUST.map(i => (
              <div key={i.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{i.icon}</span>
                <span style={{ fontSize: 13, color: '#CFCFCF', fontFamily: 'var(--font-cond)', fontWeight: 500, letterSpacing: '0.06em' }}>{i.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: '#1A1A1A', borderTop: '1px solid #3A3A3A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '32px 0' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid #3A3A3A' : 'none',
                padding: '0 24px',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: s.highlight ? '#FFD200' : '#FFFFFF', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: '#CFCFCF', fontFamily: 'var(--font-cond)', fontWeight: 500, letterSpacing: '0.1em', marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hero-fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        @keyframes hero-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(255,210,0,0)} 50%{box-shadow:0 0 36px 4px rgba(255,210,0,.18)} }
        @keyframes hero-scan   { 0%{transform:translateY(-100%)} 100%{transform:translateY(500%)} }
      `}</style>
    </section>
  )
}

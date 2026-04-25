'use client'

import Link from 'next/link'

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: 34, height: 34, background: '#FFD200', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13Z" fill="#0B0B0B" />
      </svg>
    </div>
    <div>
      <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '0.14em', color: '#FFFFFF', lineHeight: 1 }}>THUNDER AUTO HUB</div>
      <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 9, color: '#FFD200', letterSpacing: '0.22em', fontWeight: 500 }}>PREMIUM CAR CARE</div>
    </div>
  </div>
)

const NAV_LINKS = ['Services', 'Pricing', 'Service Area', 'Track Booking', 'FAQ']
const NAV_HREFS = ['/#services', '/#pricing', '/#coverage', '/track', '/faq']

export default function PublicFooter() {
  return (
    <footer style={{ background: '#0B0B0B', borderTop: '1px solid #3A3A3A' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <Logo />

          <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            {NAV_LINKS.map((l, i) => (
              <Link key={l} href={NAV_HREFS[i]} style={{
                fontFamily: 'var(--font-cond)', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.08em', color: '#888', textDecoration: 'none', transition: 'color .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#CFCFCF'}
                onMouseLeave={e => e.currentTarget.style.color = '#888'}
              >{l}</Link>
            ))}
          </div>

          <Link href="/book" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-display)',
            fontSize: 15, letterSpacing: '0.1em', padding: '10px 22px', borderRadius: 10,
            textDecoration: 'none', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFC800'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFD200'}
          >
            BOOK NOW
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        <div style={{ borderTop: '1px solid #3A3A3A', marginTop: 36, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-cond)', letterSpacing: '0.1em' }}>
            © {new Date().getFullYear()} THUNDER AUTO HUB — ARAYAT, PAMPANGA
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['TERMS', '/terms'], ['PRIVACY', '/privacy']].map(([label, href]) => (
              <Link key={label} href={href} style={{
                fontSize: 12, color: '#888', textDecoration: 'none',
                fontFamily: 'var(--font-cond)', letterSpacing: '0.08em', transition: 'color .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#CFCFCF'}
                onMouseLeave={e => e.currentTarget.style.color = '#888'}
              >{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

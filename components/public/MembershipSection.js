'use client'

import Link from 'next/link'

const TIERS = [
  { key: 'S',  label: 'Small',  price: 1000 },
  { key: 'M',  label: 'Medium', price: 1200 },
  { key: 'L',  label: 'Large',  price: 1500 },
  { key: 'XL', label: 'XL',     price: 1750 },
]

const PERKS = [
  '3x Basic Wash credits',
  '1x Basic Glow credit',
  'Priority booking',
  'Free interior protectant',
  '10% discount on all detailing',
  'Dedicated customer support',
]

export default function MembershipSection() {
  return (
    <section style={{ padding: 'clamp(64px, 10vw, 100px) 0', background: '#1A1A1A' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', border: '1px solid rgba(255,210,0,.35)',
            borderRadius: 40, fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', color: '#FFD200', marginBottom: 20,
          }}>Membership</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 8vw, 56px)', lineHeight: 1, marginBottom: 16, color: '#FFFFFF' }}>
            Thunder Essential<br />Membership
          </h2>
          <p style={{ fontSize: 16, color: '#CFCFCF', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
            Regular maintenance made affordable. Per-month credits, discounts, at priority booking — lahat para sa inyong sasakyan.
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'clamp(28px, 6vw, 48px)', alignItems: 'center' }}>
          {/* Perks */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 20, letterSpacing: '0.06em', color: '#FFFFFF', marginBottom: 24 }}>KASAMA SA MEMBERSHIP</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PERKS.map(perk => (
                <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 20, height: 20, background: '#FFD200', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <span style={{ fontSize: 14, color: '#CFCFCF' }}>{perk}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 20 }}>Valid for 1 month. Renewable monthly.</p>
          </div>

          {/* Pricing cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: 12 }}>
            {TIERS.map(t => (
              <div key={t.key} style={{
                background: '#0B0B0B', border: '1px solid #3A3A3A', borderRadius: 16,
                padding: '20px 16px', textAlign: 'center', transition: 'border-color .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,210,0,.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#3A3A3A'}
              >
                <div style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-cond)', letterSpacing: '0.12em', marginBottom: 6 }}>{t.label.toUpperCase()}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: '#FFFFFF', lineHeight: 1 }}>₱{t.price.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 6, fontFamily: 'var(--font-cond)' }}>per month</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link href="/book?type=membership" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-display)',
            fontSize: 18, letterSpacing: '0.1em', padding: '16px 32px', borderRadius: 10,
            textDecoration: 'none', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFC800'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFD200'}
          >
            ⚡ GET A MEMBERSHIP
          </Link>
          <p style={{ fontSize: 12, color: '#888', marginTop: 12 }}>Credits credited upon payment confirmation.</p>
        </div>
      </div>
    </section>
  )
}

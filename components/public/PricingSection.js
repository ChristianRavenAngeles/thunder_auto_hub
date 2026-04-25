'use client'

import { useState } from 'react'
import Link from 'next/link'

const TIERS = [
  { id: 'S',  label: 'SMALL',  sub: 'Hatchback / Subcompact' },
  { id: 'M',  label: 'MEDIUM', sub: 'Sedan / Small SUV' },
  { id: 'L',  label: 'LARGE',  sub: 'Mid-size SUV / Pickup' },
  { id: 'XL', label: 'XL',     sub: 'Full-size SUV / Van' },
]

const TIER_DESC = {
  S:  'Subcompact Sedan / Hatchback',
  M:  'Compact Sedan / Small SUV / MPV',
  L:  'Mid-size SUV / Pickup Truck',
  XL: 'Full-size SUV / Passenger Van',
}

const SERVICES = [
  { name: 'Basic Wash',          cat: 'Wash',    S: 300,   M: 350,   L: 450,   XL: 550,   note: '+ travel fee' },
  { name: 'Basic Glow',          cat: 'Wash',    S: 450,   M: 500,   L: 650,   XL: 750,   note: '+ travel fee' },
  { name: 'Interior Detailing',  cat: 'Detail',  S: 1200,  M: 1400,  L: 1800,  XL: 2200  },
  { name: 'Exterior Detailing',  cat: 'Detail',  S: 1500,  M: 1800,  L: 2200,  XL: 2800  },
  { name: 'Glass Detailing',     cat: 'Detail',  S: 800,   M: 1000,  L: 1200,  XL: 1500  },
  { name: 'Engine Detailing',    cat: 'Detail',  S: 800,   M: 1000,  L: 1200,  XL: 1500  },
  { name: 'Tire Detailing',      cat: 'Detail',  S: 500,   M: 600,   L: 800,   XL: 1000  },
  { name: 'Car Care Deluxe',     cat: 'Maint',   S: 1800,  M: 2200,  L: 2800,  XL: 3500  },
  { name: 'Ceramic Coating',     cat: 'Coating', S: 8000,  M: 10000, L: 13000, XL: 16000, orig: { S: 10667, M: 13333, L: 17333, XL: 21333 }, highlight: true },
  { name: 'Graphene Coating',    cat: 'Coating', S: 10000, M: 12500, L: 16000, XL: 20000, orig: { S: 13333, M: 16667, L: 21333, XL: 26667 }, highlight: true },
]

const CAT_COLORS = {
  Wash:    { bg: '#FFD200',  text: '#0B0B0B' },
  Detail:  { bg: '#A78BFA',  text: '#0B0B0B' },
  Maint:   { bg: '#60A5FA',  text: '#0B0B0B' },
  Coating: { bg: '#22C55E',  text: '#0B0B0B' },
}

export default function PricingSection() {
  const [active, setActive] = useState('M')

  return (
    <section id="pricing" style={{ padding: '100px 0', background: '#0B0B0B' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', border: '1px solid rgba(255,210,0,.35)',
            borderRadius: 40, fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', color: '#FFD200', marginBottom: 20,
          }}>Pricing</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, marginBottom: 16, color: '#FFFFFF' }}>Transparent, Honest Pricing</h2>
          <p style={{ fontSize: 16, color: '#CFCFCF', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            Walang hidden charges. Piliin ang size ng inyong sasakyan para makita ang presyo.
          </p>
        </div>

        {/* Tier tabs */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          {TIERS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)} style={{
              padding: '14px 24px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${active === t.id ? '#FFD200' : '#3A3A3A'}`,
              background: active === t.id ? '#FFD200' : '#1A1A1A',
              color: active === t.id ? '#0B0B0B' : '#CFCFCF',
              fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 15, letterSpacing: '0.06em',
              transition: 'all .15s', textAlign: 'center',
            }}>
              <div>{t.label}</div>
              <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.7, marginTop: 2 }}>{t.sub}</div>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 14, color: '#CFCFCF', letterSpacing: '0.08em' }}>
            <span style={{ color: '#FFD200', fontWeight: 700 }}>{TIERS.find(t => t.id === active)?.label}</span>{' — '}{TIER_DESC[active]}
          </span>
        </div>

        {/* Price list */}
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SERVICES.map(s => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', padding: '18px 24px',
              background: s.highlight ? 'linear-gradient(90deg, rgba(255,210,0,.06), rgba(255,210,0,.02))' : '#1A1A1A',
              border: `1px solid ${s.highlight ? 'rgba(255,210,0,.25)' : '#3A3A3A'}`,
              borderRadius: 12, gap: 16, transition: 'border-color .15s',
            }}>
              <span style={{
                background: CAT_COLORS[s.cat].bg, color: CAT_COLORS[s.cat].text,
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-cond)', letterSpacing: '0.12em',
                padding: '3px 9px', borderRadius: 40, flexShrink: 0, whiteSpace: 'nowrap',
              }}>{s.cat.toUpperCase()}</span>
              <span style={{ flex: 1, fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 16, letterSpacing: '0.04em', color: '#FFFFFF' }}>{s.name}</span>
              {s.note && <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-cond)', letterSpacing: '0.06em' }}>{s.note}</span>}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {s.orig && (
                  <div style={{ fontSize: 11, color: '#888', textDecoration: 'line-through', fontFamily: 'var(--font-cond)' }}>
                    ₱{s.orig[active].toLocaleString()}
                  </div>
                )}
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: s.highlight ? '#FFD200' : '#FFFFFF' }}>
                  ₱{s[active].toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link href="/book" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-display)',
            fontSize: 18, letterSpacing: '0.1em', padding: '16px 32px', borderRadius: 10,
            textDecoration: 'none', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFC800'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFD200'}
          >
            BOOK THIS SERVICE
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

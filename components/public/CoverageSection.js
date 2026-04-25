'use client'

import { useState } from 'react'
import Link from 'next/link'

const SERVICE_AREAS = [
  { city: 'Arayat',      km: '0km',   fee: 'FREE',  barangays: 7  },
  { city: 'San Luis',    km: '9–14km', fee: '₱150',  barangays: 4  },
  { city: 'Mexico',      km: '15–18km',fee: '₱150–₱170', barangays: 4 },
  { city: 'Magalang',    km: '16–20km',fee: '₱170',  barangays: 3  },
  { city: 'Candaba',     km: '18–22km',fee: '₱170–₱200', barangays: 3 },
  { city: 'Sta. Ana',    km: '21km',   fee: '₱200',  barangays: 1  },
  { city: 'Capas',       km: '23km',   fee: '₱200',  barangays: 1  },
  { city: 'Concepcion',  km: '24km',   fee: '₱200',  barangays: 1  },
]

const AREAS_DETAIL = [
  { barangay: 'Arayat',        city: 'Arayat',     km: 0,  fee: 0   },
  { barangay: 'San Juan',      city: 'Arayat',     km: 3,  fee: 0   },
  { barangay: 'San Vicente',   city: 'Arayat',     km: 4,  fee: 0   },
  { barangay: 'Mabiga',        city: 'Arayat',     km: 5,  fee: 0   },
  { barangay: 'Candating',     city: 'Arayat',     km: 6,  fee: 0   },
  { barangay: 'Gatiawin',      city: 'Arayat',     km: 7,  fee: 0   },
  { barangay: 'Magumbali',     city: 'San Luis',   km: 9,  fee: 150 },
  { barangay: 'Sta. Catalina', city: 'San Luis',   km: 10, fee: 150 },
  { barangay: 'Poblacion',     city: 'San Luis',   km: 12, fee: 150 },
  { barangay: 'Sampaloc',      city: 'San Luis',   km: 14, fee: 150 },
  { barangay: 'Poblacion',     city: 'Mexico',     km: 15, fee: 150 },
  { barangay: 'Sta. Cruz',     city: 'Mexico',     km: 16, fee: 170 },
  { barangay: 'Lagundi',       city: 'Mexico',     km: 17, fee: 170 },
  { barangay: 'Pandacaqui',    city: 'Mexico',     km: 18, fee: 170 },
  { barangay: 'Poblacion',     city: 'Magalang',   km: 16, fee: 170 },
  { barangay: 'San Agustin',   city: 'Magalang',   km: 18, fee: 170 },
  { barangay: 'Sto. Rosario',  city: 'Magalang',   km: 20, fee: 170 },
  { barangay: 'Poblacion',     city: 'Candaba',    km: 18, fee: 170 },
  { barangay: 'Sta. Monica',   city: 'Candaba',    km: 20, fee: 170 },
  { barangay: 'Sta. Rita',     city: 'Candaba',    km: 22, fee: 200 },
  { barangay: 'Poblacion',     city: 'Sta. Ana',   km: 21, fee: 200 },
  { barangay: 'Poblacion',     city: 'Capas',      km: 23, fee: 200 },
  { barangay: 'Poblacion',     city: 'Concepcion', km: 24, fee: 200 },
]

export default function CoverageSection() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)

  function check() {
    const q = query.trim().toLowerCase()
    if (!q) { setResult({ type: 'empty' }); return }
    const found = AREAS_DETAIL.find(a =>
      a.barangay.toLowerCase().includes(q) || a.city.toLowerCase().includes(q)
    )
    if (found) {
      setResult({ type: 'found', area: { city: found.city, fee: found.fee === 0 ? 'FREE' : `₱${found.fee}`, km: `${found.km}km` } })
    } else {
      setResult({ type: 'notfound' })
    }
  }

  return (
    <section id="coverage" style={{ padding: 'clamp(64px, 10vw, 100px) 0', background: '#1A1A1A' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', border: '1px solid rgba(255,210,0,.35)',
            borderRadius: 40, fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', color: '#FFD200', marginBottom: 20,
          }}>Service Area</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 8vw, 56px)', lineHeight: 1, marginBottom: 16, color: '#FFFFFF' }}>
            Naka-Service Ba<br />ang Inyong Lugar?
          </h2>
          <p style={{ fontSize: 16, color: '#CFCFCF', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            Nagse-serve kami sa loob ng 25km mula Arayat, Pampanga.
          </p>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', background: '#0B0B0B', border: '1px solid #3A3A3A', borderRadius: 20, padding: 'clamp(18px, 4vw, 32px)', marginBottom: 48 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 16, letterSpacing: '0.1em', marginBottom: 20, color: '#FFFFFF' }}>Check Your Location</div>

          <div style={{ display: 'flex', gap: 12, marginBottom: result ? 20 : 0, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setResult(null) }}
                onKeyDown={e => e.key === 'Enter' && check()}
                placeholder="e.g. Magalang, San Luis, Mexico..."
                style={{
                  width: '100%', height: 52, background: '#1A1A1A', border: '1px solid #3A3A3A',
                  borderRadius: 10, color: '#FFFFFF', paddingLeft: 44, paddingRight: 16,
                  fontSize: 15, fontFamily: 'var(--font-barlow)', outline: 'none',
                }}
              />
            </div>
            <button onClick={check} style={{
              display: 'inline-flex', alignItems: 'center', background: '#FFD200', color: '#0B0B0B',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 16,
              letterSpacing: '0.1em', padding: '0 28px', borderRadius: 10, flexShrink: 0,
              transition: 'background 0.15s', minHeight: 52,
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFC800'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFD200'}
            >CHECK</button>
          </div>

          {result && (
            <div style={{
              padding: '16px 20px', borderRadius: 10,
              background: result.type === 'found' ? 'rgba(34,197,94,.1)' : result.type === 'notfound' ? 'rgba(239,68,68,.1)' : 'rgba(255,210,0,.08)',
              border: `1px solid ${result.type === 'found' ? 'rgba(34,197,94,.3)' : result.type === 'notfound' ? 'rgba(239,68,68,.3)' : 'rgba(255,210,0,.2)'}`,
              marginBottom: 24,
            }}>
              {result.type === 'found' && (
                <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 15, color: '#FFFFFF' }}>
                  <span style={{ color: '#22C55E' }}>✓ </span>{result.area.city} — Travel fee:{' '}
                  <span style={{ color: '#FFD200', fontWeight: 700 }}>{result.area.fee}</span>{' '}({result.area.km})
                </div>
              )}
              {result.type === 'notfound' && (
                <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 15, color: '#F87171' }}>
                  ✗ Pasensya na, hindi pa namin ina-abot ang lugar na ito. Maaari kaming mag-expand sa hinaharap!
                </div>
              )}
              {result.type === 'empty' && (
                <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 14, color: '#FFD200' }}>
                  Pakienter ang iyong city o municipality.
                </div>
              )}
            </div>
          )}

          <div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '0.14em', color: '#CFCFCF', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD200" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              COVERED CITIES & MUNICIPALITIES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {SERVICE_AREAS.map(a => (
                <div key={a.city}
                  onClick={() => { setQuery(a.city); check() }}
                  style={{
                    background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 10,
                    padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,210,0,.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#3A3A3A'}
                >
                  <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#FFFFFF' }}>{a.city}</div>
                  <div style={{ fontSize: 12, color: a.fee === 'FREE' ? '#22C55E' : '#FFD200', fontFamily: 'var(--font-cond)', fontWeight: 700, marginBottom: 2 }}>{a.fee}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{a.barangays} barangay{a.barangays > 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#888', marginTop: 16, lineHeight: 1.6 }}>
            * Travel fee applies to Wash services only. Detailing at Coating — walang travel fee sa lahat ng covered areas.
          </p>
        </div>
      </div>
    </section>
  )
}

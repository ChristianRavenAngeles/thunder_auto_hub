'use client'

import { useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'

const MOCK_BOOKINGS = {
  'TAH-ABC123': {
    ref: 'TAH-ABC123', vehicle: 'Toyota Fortuner (2021)', plate: 'ABC 1234',
    services: ['Ceramic Coating', 'Exterior Detailing'],
    location: 'Brgy. San Roque, San Luis, Pampanga',
    date: 'May 3, 2025 · 9:00 AM',
    status: 'in-progress', step: 2,
    rider: { name: 'Kuya Mark', phone: '0917 XXX XXXX', eta: 'On the way — 15 mins' },
    timeline: [
      { label: 'Booking Confirmed',   time: 'Apr 28 · 10:32 AM', done: true },
      { label: 'Rider Assigned',      time: 'Apr 28 · 11:00 AM', done: true },
      { label: 'Rider On the Way',    time: 'May 3 · 8:45 AM',   done: true, active: true },
      { label: 'Service In Progress', time: '—',                  done: false },
      { label: 'Completed',          time: '—',                  done: false },
    ],
  },
  'TAH-XYZ789': {
    ref: 'TAH-XYZ789', vehicle: 'Honda Civic (2022)', plate: 'XYZ 5678',
    services: ['Basic Wash', 'Basic Glow'],
    location: 'Brgy. Sta. Lucia, Arayat, Pampanga',
    date: 'May 5, 2025 · 10:00 AM',
    status: 'confirmed', step: 1,
    rider: null,
    timeline: [
      { label: 'Booking Confirmed',   time: 'Apr 30 · 2:15 PM', done: true, active: true },
      { label: 'Rider Assigned',      time: '—',                 done: false },
      { label: 'Rider On the Way',    time: '—',                 done: false },
      { label: 'Service In Progress', time: '—',                 done: false },
      { label: 'Completed',          time: '—',                 done: false },
    ],
  },
  'TAH-DEMO': {
    ref: 'TAH-DEMO', vehicle: 'Ford Ranger (2023)', plate: 'DEF 9012',
    services: ['Graphene Coating', 'Tire Detailing'],
    location: 'Brgy. Dalayap, Candaba, Pampanga',
    date: 'Apr 25, 2025 · 8:00 AM',
    status: 'completed', step: 4,
    rider: { name: 'Kuya Jun', phone: '0918 XXX XXXX', eta: 'Completed' },
    timeline: [
      { label: 'Booking Confirmed',   time: 'Apr 20 · 9:00 AM', done: true },
      { label: 'Rider Assigned',      time: 'Apr 20 · 9:30 AM', done: true },
      { label: 'Rider On the Way',    time: 'Apr 25 · 7:40 AM', done: true },
      { label: 'Service In Progress', time: 'Apr 25 · 8:05 AM', done: true },
      { label: 'Completed',          time: 'Apr 26 · 4:30 PM', done: true },
    ],
  },
}

const STATUS_CONFIG = {
  confirmed:    { label: 'BOOKING CONFIRMED',    color: '#60A5FA', bg: 'rgba(96,165,250,.1)',  border: 'rgba(96,165,250,.3)' },
  'in-progress': { label: 'SERVICE IN PROGRESS', color: '#FFD200', bg: 'rgba(255,210,0,.1)',   border: 'rgba(255,210,0,.3)' },
  completed:    { label: 'COMPLETED',            color: '#22C55E', bg: 'rgba(34,197,94,.1)',   border: 'rgba(34,197,94,.3)' },
}

function TrackingResult({ booking }) {
  const sc = STATUS_CONFIG[booking.status]
  const progress = Math.round((booking.step / 4) * 100)

  return (
    <div style={{ animation: 'track-pop .4s ease both' }}>
      {/* Status badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.16em', color: '#777', marginBottom: 4 }}>BOOKING REFERENCE</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: '#FFD200', letterSpacing: '.08em' }}>{booking.ref}</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 40 }}>
          {booking.status === 'in-progress' && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color, animation: 'track-pulse 1.5s ease infinite' }} />
          )}
          <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.12em', color: sc.color }}>{sc.label}</span>
        </div>
      </div>

      {/* Vehicle + schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#222', border: '1px solid #3A3A3A', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, letterSpacing: '.16em', color: '#777', marginBottom: 6 }}>SASAKYAN</div>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>{booking.vehicle}</div>
          <div style={{ fontSize: 12, color: '#CFCFCF', marginTop: 2 }}>{booking.plate}</div>
        </div>
        <div style={{ background: '#222', border: '1px solid #3A3A3A', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, letterSpacing: '.16em', color: '#777', marginBottom: 6 }}>ISKEDYUL</div>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>{booking.date}</div>
          <div style={{ fontSize: 12, color: '#CFCFCF', marginTop: 2 }}>{booking.location}</div>
        </div>
      </div>

      {/* Services */}
      <div style={{ background: '#222', border: '1px solid #3A3A3A', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, letterSpacing: '.16em', color: '#777', marginBottom: 10 }}>SERBISYO</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {booking.services.map(s => (
            <span key={s} style={{
              background: 'rgba(255,210,0,.1)', border: '1px solid rgba(255,210,0,.25)',
              color: '#FFD200', fontFamily: 'var(--font-cond)', fontWeight: 700,
              fontSize: 12, letterSpacing: '.08em', padding: '5px 12px', borderRadius: 40,
            }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.14em', color: '#777' }}>OVERALL PROGRESS</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: sc.color }}>{progress}%</span>
        </div>
        <div style={{ height: 6, background: '#3A3A3A', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(to right,#FFB000,#FFD200)', borderRadius: 3, transition: 'width 1s ease' }} />
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: '#222', border: '1px solid #3A3A3A', borderRadius: 12, padding: '24px', marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, letterSpacing: '.16em', color: '#777', marginBottom: 20 }}>TRACKING TIMELINE</div>
        {booking.timeline.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < booking.timeline.length - 1 ? 24 : 0, position: 'relative' }}>
            {i < booking.timeline.length - 1 && (
              <div style={{ position: 'absolute', left: 15, top: 30, width: 2, height: 24, background: t.done ? '#FFD200' : '#3A3A3A' }} />
            )}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `2px solid ${t.done ? '#FFD200' : t.active ? '#FFD200' : '#3A3A3A'}`,
              background: t.done ? '#FFD200' : t.active ? 'rgba(255,210,0,.1)' : '#1A1A1A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all .3s',
              animation: t.active && !t.done ? 'track-glow 2s ease infinite' : 'none',
            }}>
              {t.done
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                : t.active
                  ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD200', animation: 'track-pulse 1.2s ease infinite' }} />
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3A3A3A' }} />
              }
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '.04em', color: t.done || t.active ? '#FFFFFF' : '#777' }}>{t.label}</div>
              <div style={{ fontSize: 12, color: t.done ? '#CFCFCF' : '#3A3A3A', marginTop: 2, fontFamily: 'var(--font-cond)', letterSpacing: '.06em' }}>{t.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Rider card */}
      {booking.rider && (
        <div style={{ background: 'rgba(255,210,0,.06)', border: '1px solid rgba(255,210,0,.25)', borderRadius: 12, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,210,0,.15)',
              border: '2px solid #FFD200', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 22, color: '#FFD200',
            }}>
              {booking.rider.name.split(' ')[1]?.[0] || 'R'}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, letterSpacing: '.16em', color: '#777', marginBottom: 2 }}>YOUR RIDER</div>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>{booking.rider.name}</div>
              <div style={{ fontSize: 12, color: '#CFCFCF' }}>{booking.rider.phone}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, letterSpacing: '.14em', color: '#777', marginBottom: 2 }}>STATUS</div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, color: '#FFD200' }}>{booking.rider.eta}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrackPage() {
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [notFound, setNotFound] = useState(false)

  function track() {
    const val = ref.trim().toUpperCase()
    if (!val) return
    setLoading(true)
    setNotFound(false)
    setResult(null)
    setTimeout(() => {
      setLoading(false)
      const found = MOCK_BOOKINGS[val]
      if (found) setResult(found)
      else setNotFound(true)
    }, 1200)
  }

  function tryDemo(key) {
    setRef(key)
    setTimeout(() => {
      setLoading(true)
      setResult(null)
      setNotFound(false)
      setTimeout(() => {
        setLoading(false)
        setResult(MOCK_BOOKINGS[key])
      }, 1000)
    }, 100)
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
        minHeight: '100vh', background: '#0B0B0B',
        backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px),repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px)',
        padding: '100px 0 80px', position: 'relative',
      }}>
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom,#FFD200,rgba(255,178,0,.4),transparent)', pointerEvents: 'none', zIndex: 50 }} />

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
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
          <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 20, padding: '36px 40px', marginBottom: 24, boxShadow: '0 24px 80px rgba(0,0,0,.5)' }}>
            <label style={{ fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: '.14em', color: '#CFCFCF', display: 'block', marginBottom: 8 }}>
              REFERENCE NUMBER
            </label>
            <div style={{ display: 'flex', gap: 12, marginBottom: result || notFound ? 24 : 0 }}>
              <div style={{ flex: 1 }}>
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
                  transition: 'background .15s', opacity: ref.trim() ? 1 : .5,
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

            {notFound && (
              <div style={{ padding: '16px 20px', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 12, animation: 'track-pop .3s ease' }}>
                <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, color: '#F87171', letterSpacing: '.06em' }}>Reference number not found.</div>
                <div style={{ fontSize: 13, color: '#CFCFCF', marginTop: 4 }}>I-check ang spelling o makipag-ugnayan sa amin para sa tulong.</div>
              </div>
            )}

            {result && <TrackingResult booking={result} />}
          </div>

          {/* Demo refs */}
          {!result && (
            <div style={{ background: 'rgba(255,210,0,.04)', border: '1px solid rgba(255,210,0,.12)', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.16em', color: '#777', marginBottom: 12 }}>TRY A DEMO BOOKING</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { key: 'TAH-ABC123', label: 'In Progress' },
                  { key: 'TAH-XYZ789', label: 'Confirmed' },
                  { key: 'TAH-DEMO',   label: 'Completed' },
                ].map(d => (
                  <button key={d.key} onClick={() => tryDemo(d.key)} style={{
                    padding: '8px 18px', borderRadius: 8, border: '1px solid #3A3A3A',
                    background: '#1A1A1A', cursor: 'pointer',
                    fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, letterSpacing: '.08em',
                    color: '#CFCFCF', transition: 'all .15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,210,0,.4)'; e.currentTarget.style.color = '#FFD200' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.color = '#CFCFCF' }}
                  >
                    {d.key} · {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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

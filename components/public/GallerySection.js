'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

const ITEMS = [
  'Ceramic Coating — Toyota Fortuner',
  'Exterior Detail — Honda Civic',
  'Interior Detail — Ford Ranger',
  'Graphene Coating — Toyota Alphard',
  'Basic Glow — Mitsubishi Triton',
  'Exterior Detail — Toyota Veloz',
]

function BACard({ label }) {
  const [pos, setPos] = useState(50)
  const ref = useRef(null)
  const dragging = useRef(false)

  const move = useCallback(e => {
    if (!dragging.current || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    setPos(Math.max(5, Math.min(95, (x / rect.width) * 100)))
  }, [])

  const stop = () => { dragging.current = false }

  useEffect(() => {
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', stop)
    }
  }, [move])

  return (
    <div
      ref={ref}
      onMouseDown={() => { dragging.current = true }}
      onTouchStart={() => { dragging.current = true }}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16,
        aspectRatio: '4/3', cursor: 'ew-resize', userSelect: 'none',
      }}
    >
      {/* After side */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
      }}>
        <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, color: '#888', letterSpacing: '0.12em' }}>{label}</span>
      </div>

      {/* Before side (clipped) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${pos}%` }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #111, #1f1f1f)',
          width: ref.current ? ref.current.offsetWidth + 'px' : '400px',
        }}>
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, color: '#888', letterSpacing: '0.12em' }}>{label}</span>
        </div>
      </div>

      {/* Handle */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: `${pos}%`,
        width: 3, background: '#FFD200', cursor: 'ew-resize', transform: 'translateX(-50%)',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 38, height: 38, background: '#FFD200', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,.7)', fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', padding: '4px 10px', borderRadius: 40, backdropFilter: 'blur(4px)', color: '#FFFFFF' }}>BEFORE</div>
      <div style={{ position: 'absolute', top: 12, right: 12, background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', padding: '4px 10px', borderRadius: 40 }}>AFTER</div>
    </div>
  )
}

export default function GallerySection() {
  return (
    <section style={{ padding: '100px 0', background: '#0B0B0B' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', border: '1px solid rgba(255,210,0,.35)',
            borderRadius: 40, fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', color: '#FFD200', marginBottom: 20,
          }}>Results</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, marginBottom: 16, color: '#FFFFFF' }}>Before &amp; After Results</h2>
          <p style={{ fontSize: 16, color: '#CFCFCF', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            Bawat kotse ay may kwento. Ito ang ilan sa aming mga trabaho.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
          {ITEMS.map((lbl, i) => <BACard key={i} label={lbl} />)}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/gallery" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'transparent', color: '#FFFFFF', border: '1px solid #3A3A3A',
            fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.1em',
            padding: '16px 32px', borderRadius: 10, textDecoration: 'none',
            transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#CFCFCF'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#3A3A3A'}
          >
            VIEW FULL GALLERY
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

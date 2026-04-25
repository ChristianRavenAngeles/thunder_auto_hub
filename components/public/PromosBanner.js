'use client'

const MSG = '⚡ SUMMER PROMO: 25% OFF sa lahat ng Ceramic at Graphene Coating services! Book na habang may promo.    '

export default function PromosBanner() {
  return (
    <div style={{
      background: '#FFD200', color: '#0B0B0B',
      fontFamily: 'var(--font-cond)', fontSize: 13, fontWeight: 700,
      letterSpacing: '0.1em', overflow: 'hidden', position: 'relative',
      padding: '9px 0',
    }}>
      <div style={{
        display: 'flex', whiteSpace: 'nowrap', width: 'max-content',
        animation: 'promo-ticker 22s linear infinite',
      }}>
        {[MSG, MSG, MSG, MSG].map((m, i) => (
          <span key={i} style={{ padding: '0 4px' }}>{m}</span>
        ))}
      </div>
      <style>{`
        @keyframes promo-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

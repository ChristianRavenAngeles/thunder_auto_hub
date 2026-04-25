'use client'

const REVIEWS = [
  { init: 'M', name: 'Mark T.',  car: 'Toyota Fortuner',   text: 'Super satisfied! Hindi ko inasahan na ganito kaganda ang resulta ng basic wash nila. Pumunta sila on time at very professional ang team. Highly recommended! 🙌' },
  { init: 'J', name: 'Jessa P.', car: 'Honda Civic',       text: 'Nagpa-ceramic coating ako — wow lang. 2 days lang pero sulit na sulit. Parang bago ang kotse ko. Plus yung tracking feature, swak na swak para sa busy na tao.' },
  { init: 'C', name: 'Carlo M.', car: 'Mitsubishi Triton',  text: 'Nagtake kami ng Thunder Essential membership at worth every peso. 3 basic wash + 1 glow for less than ₱1,500? Solid deal para sa large vehicle.' },
  { init: 'R', name: 'Rhea B.',  car: 'Toyota Veloz',      text: 'Ang dali mag-book online. Ilang minuto lang. Sinend nila ang rider details bago dumating at nakita ko ang progress sa app. 10/10 experience!' },
  { init: 'J', name: 'Jun R.',   car: 'Ford Ranger',       text: 'Sa lahat ng car wash na natry ko, Thunder ang pinaka-professional at pinaka-buo ang ginagawa. Before/after photos pa na sine-send nila. Grabe.' },
  { init: 'A', name: 'Anna L.',  car: 'Toyota Alphard',    text: 'Mahirap hanapin ang mapagkakatiwalaang car care para sa malaking van. Natry ko ang Thunder at hindi na ako maghahanap pa. Laging babalik-balik! 💯' },
]

export default function TestimonialsSection() {
  return (
    <section style={{ padding: 'clamp(64px, 10vw, 100px) 0', background: '#1A1A1A' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', border: '1px solid rgba(255,210,0,.35)',
            borderRadius: 40, fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', color: '#FFD200', marginBottom: 20,
          }}>Reviews</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 8vw, 56px)', lineHeight: 1, marginBottom: 16, color: '#FFFFFF' }}>Sabi Nila</h2>
          <p style={{ fontSize: 16, color: '#CFCFCF', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            Tunay na feedback mula sa aming mga satisfied customers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
          {REVIEWS.map((r, i) => (
            <div key={i} style={{
              background: '#0B0B0B', border: '1px solid #3A3A3A', borderRadius: 16, padding: 28,
              transition: 'border-color .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,210,0,.25)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#3A3A3A'}
            >
              <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#FFD200', fontSize: 14 }}>★</span>)}
              </div>
              <p style={{ fontSize: 14, color: '#CFCFCF', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #3A3A3A', paddingTop: 16 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(255,210,0,.15)', border: '1px solid rgba(255,210,0,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 15, color: '#FFD200', flexShrink: 0,
                }}>{r.init}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', color: '#FFFFFF' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{r.car}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

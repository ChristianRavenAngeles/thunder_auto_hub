'use client'

const FEATURES = [
  { icon: '🏠', title: 'Home-Service Convenience',      desc: 'Di na kailangan lumabas. Pumunta kami sa inyo — opisina, bahay, kahit saan sa loob ng aming service area.' },
  { icon: '✦',  title: 'Premium Quality Results',       desc: 'Professional-grade chemicals at equipment. Hindi basta-basta — nakikita ang pagkakaiba pagkatapos ng bawat serbisyo.' },
  { icon: '📅', title: 'Easy Online Booking',           desc: 'Book sa loob ng 2 minuto. Pumili ng date at oras, i-submit ang detalye ng sasakyan, tapos hintayin ang aming team.' },
  { icon: '📍', title: 'Real-Time Tracking',            desc: 'Alam mo kung nasaan na ang aming rider — mula "on the way" hanggang "completed." No guessing games.' },
  { icon: '🛡', title: 'Coating Warranty',              desc: '1-year warranty sa lahat ng coating services. Kasama na ang maintenance guidance para mapanatili ang proteksyon.' },
  { icon: '📸', title: 'Before & After Documentation',  desc: 'Kinukuha namin ang before at after photos ng bawat job. Transparent ang proseso, makikita ninyo ang pagbabago.' },
]

export default function WhyUsSection() {
  return (
    <section id="why-thunder" style={{ padding: '100px 0', background: '#1A1A1A' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', border: '1px solid rgba(255,210,0,.35)',
            borderRadius: 40, fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', color: '#FFD200', marginBottom: 20,
          }}>Why Thunder</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, marginBottom: 16, color: '#FFFFFF' }}>
            Bakit Piliin ang<br />Thunder Auto Hub?
          </h2>
          <p style={{ fontSize: 16, color: '#CFCFCF', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            Hindi kami basta car wash. Kami ay isang sistema ng pag-aalaga ng sasakyan na dini-deliver sa inyong pintuan.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: '#0B0B0B', border: '1px solid #3A3A3A', borderRadius: 16, padding: 28,
              transition: 'border-color .2s, transform .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,210,0,.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.transform = '' }}
            >
              <div style={{
                width: 44, height: 44, background: 'rgba(255,210,0,.1)', border: '1px solid rgba(255,210,0,.2)',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 18,
              }}>{f.icon}</div>
              <h4 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', marginBottom: 10, color: '#FFFFFF' }}>{f.title}</h4>
              <p style={{ fontSize: 13, color: '#CFCFCF', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

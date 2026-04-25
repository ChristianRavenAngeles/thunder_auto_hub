'use client'

import Link from 'next/link'

const WASH = [
  {
    name: 'Basic Wash', tag: 'Most Popular', tagBg: '#FFD200', tagColor: '#0B0B0B',
    desc: 'Full exterior wash + interior vacuum + mat cleaning + tire black + glass cleaning.',
    includes: ['Exterior wash', 'Tire black', 'Mat cleaning', 'Full interior vacuum', 'Glass cleaning', 'Interior wipe down'],
    price: 'Starts at ₱300', note: '+ travel fee',
  },
  {
    name: 'Basic Glow', tag: 'Best Value', tagBg: '#A78BFA', tagColor: '#0B0B0B',
    desc: 'Everything in Basic Wash + paint shine treatment + dashboard UV protectant.',
    includes: ['Everything in Basic Wash', 'Paint shine formula', 'Dashboard UV protectant'],
    price: 'Starts at ₱450', note: '+ travel fee',
  },
]

const DETAILING = [
  { name: 'Interior Detailing',   desc: 'Deep cleaning ng seats, carpet, panels, headliner at odor treatment.' },
  { name: 'Exterior Detailing',   desc: 'Clay bar decontamination, paint correction, at full exterior polish.' },
  { name: 'Glass Detailing',      desc: 'Water spot removal, glass polish, at hydrophobic coating.' },
  { name: 'Dry Engine Detailing', desc: 'Safe, waterless engine bay cleaning for a showroom-ready engine.' },
  { name: 'Tire Detailing',       desc: 'Deep sidewall cleaning, tire dressing, at rim polish.' },
  { name: 'Car Care Deluxe',      desc: 'Full maintenance package para sa coated at non-coated vehicles.' },
]

const COATING = [
  { name: 'Ceramic Coating',  desc: 'Professional-grade nano-ceramic protection. 3–5 year durability, UV resistance, hydrophobic finish.', badge: '25% OFF' },
  { name: 'Graphene Coating', desc: 'Next-level graphene protection with superior heat dissipation and water beading. Perfect for Philippine summer heat.', badge: '25% OFF' },
]

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD200" strokeWidth="2.5" strokeLinecap="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const CategoryHeader = ({ icon, label, iconBg, iconColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
    <div style={{ width: 36, height: 36, background: iconBg, border: `1px solid ${iconColor}40`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <h3 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 22, letterSpacing: '0.06em', color: '#FFFFFF' }}>{label}</h3>
  </div>
)

export default function ServicesSection() {
  return (
    <section id="services" style={{ padding: '100px 0', background: '#0B0B0B' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', border: '1px solid rgba(255,210,0,.35)',
            borderRadius: 40, fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', color: '#FFD200', marginBottom: 20,
          }}>Our Services</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, marginBottom: 16, color: '#FFFFFF' }}>Everything Your Car Needs</h2>
          <p style={{ fontSize: 16, color: '#CFCFCF', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 56px' }}>
            Mula basic wash hanggang full ceramic coating — lahat ng kailangan ng inyong sasakyan, nandito. Home-service sa loob ng 25km mula Arayat.
          </p>
        </div>

        {/* Wash */}
        <CategoryHeader
          label="Wash Services"
          iconBg="rgba(255,210,0,.12)" iconColor="#FFD200"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD200" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 48 }}>
          {WASH.map(s => (
            <div key={s.name} style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 16, padding: 28, position: 'relative', transition: 'border-color .2s, transform .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,210,0,.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.transform = '' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h4 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 22, letterSpacing: '0.04em', color: '#FFFFFF' }}>{s.name}</h4>
                <span style={{ background: s.tagBg, color: s.tagColor, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-cond)', letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 40 }}>{s.tag}</span>
              </div>
              <p style={{ fontSize: 13, color: '#CFCFCF', marginBottom: 16, lineHeight: 1.55, fontStyle: 'italic' }}>{s.desc}</p>
              <div style={{ marginBottom: 20 }}>
                {s.includes.map(inc => (
                  <div key={inc} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Check />
                    <span style={{ fontSize: 13, color: '#CFCFCF' }}>{inc}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderTop: '1px solid #3A3A3A', paddingTop: 16 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: '#FFD200' }}>{s.price}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{s.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailing */}
        <CategoryHeader
          label="Detailing Services"
          iconBg="rgba(167,139,250,.12)" iconColor="#A78BFA"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 48 }}>
          {DETAILING.map(s => (
            <div key={s.name} style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 16, padding: 28, transition: 'border-color .2s, transform .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,210,0,.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.transform = '' }}
            >
              <h4 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 17, letterSpacing: '0.04em', color: '#FFD200', marginBottom: 8 }}>{s.name}</h4>
              <p style={{ fontSize: 13, color: '#CFCFCF', lineHeight: 1.55 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Coating */}
        <CategoryHeader
          label="Coating Services"
          iconBg="rgba(34,197,94,.12)" iconColor="#22C55E"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 48 }}>
          {COATING.map(s => (
            <div key={s.name} style={{
              background: 'linear-gradient(135deg, #1A1A1A, rgba(255,210,0,.04))',
              border: '1px solid rgba(255,210,0,.2)', borderRadius: 16, padding: 28,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, background: '#FFD200', color: '#0B0B0B', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-cond)', letterSpacing: '0.1em', padding: '6px 14px', borderRadius: '0 16px 0 10px' }}>{s.badge}</div>
              <div style={{ position: 'absolute', bottom: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,210,0,.04)', pointerEvents: 'none' }} />
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#FFD200', letterSpacing: '0.03em', marginBottom: 10 }}>{s.name}</h4>
              <p style={{ fontSize: 13, color: '#CFCFCF', lineHeight: 1.6, marginBottom: 16 }}>{s.desc}</p>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-cond)', letterSpacing: '0.08em' }}>⏱ ~2 days service</span>
                <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-cond)', letterSpacing: '0.08em' }}>🛡 3–5 year durability</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/book" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-display)',
            fontSize: 18, letterSpacing: '0.1em', padding: '16px 32px', borderRadius: 10,
            textDecoration: 'none', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFC800'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFD200'}
          >
            BOOK A SERVICE NOW
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

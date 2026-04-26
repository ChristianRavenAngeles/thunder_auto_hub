'use client'

import { useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'

const FAQS = [
  {
    cat: 'General',
    items: [
      { q: 'Paano gumagana ang home-service?', a: 'Simple lang! Mag-book ka online, ilagay ang detalye ng sasakyan at lokasyon, pumili ng petsa at oras — tapos hintayin mo na kami. Pupunta kami sa inyong pintuan na may lahat ng kagamitan at chemicals. Hindi na kailangan pang lumabas o pumunta sa car wash.' },
      { q: 'Saan kayo nagse-serve?', a: 'Nagse-serve kami sa loob ng 25km mula Arayat, Pampanga. Kasama na ang San Luis, Mexico, Magalang, Candaba, Sta. Ana, at ilang parte ng Capas at Concepcion. I-check ang Service Area section sa home page para sa exact na coverage.' },
      { q: 'Anong oras kayo available?', a: 'Bukas kami Lunes hanggang Biyernes, 8:00 AM hanggang 6:00 PM. Hindi pa kami available sa weekends sa ngayon, pero maaaring magbago ito sa hinaharap. Para sa updates, sundan kami sa social media.' },
      { q: 'Kailangan ko bang nandoon habang ginagawa ang serbisyo?', a: 'Hindi kailangan, pero mas mabuti kung may responsableng tao na nandoon para ma-access ang sasakyan at makapirma sa inspection form. Para sa coating services (2 days), kailangan mo lang i-arrange na nandoon ang kotse sa araw ng pick-up.' },
      { q: 'Anong payment methods ang tinatanggap ninyo?', a: 'Tinatanggap namin ang GCash, Maya, at cash on service day. Para sa coating services, maaaring hilingin ang partial na deposit bago ang appointment. Ang detalye ng payment ay ipapaliwanag ng aming team sa confirmation call.' },
    ],
  },
  {
    cat: 'Services',
    items: [
      { q: 'Ano ang pagkakaiba ng Basic Wash at Basic Glow?', a: 'Ang Basic Wash ay aming standard maintenance wash — exterior wash, tire black, mat cleaning, interior vacuum, glass cleaning, at interior wipe down. Ang Basic Glow ay upgrade mula dito — kasama na ang paint shine formula at dashboard UV protectant para sa dagdag na proteksyon at shine pagkatapos ng bawat wash.' },
      { q: 'Gaano katagal ang bawat serbisyo?', a: 'Ang Basic Wash at Basic Glow ay karaniwang 1.5 hanggang 2.5 oras depende sa kondisyon ng sasakyan. Ang mga detailing services ay 4 hanggang 8 oras. Ang Ceramic at Graphene Coating ay karaniwang 2 araw — kasama na ang curing time para sa pinakamahusay na resulta.' },
      { q: 'Ano ang Ceramic vs Graphene Coating? Alin ang mas maganda?', a: 'Parehong nagbibigay ng matagalang proteksyon (3 hanggang 5 taon), UV resistance, at hydrophobic (water-beading) properties. Ang Graphene Coating ay ang mas advanced na opsyon — mas mahusay ito sa heat dissipation (importante sa mainit na klima ng Pilipinas), mas matibay na film strength, at mas magandang water beading. Kung priority mo ang maximum protection laban sa init, Graphene ang rekomendasyon namin.' },
      { q: 'Kailangan ko ba ng coating kung bago pa lang ang kotse ko?', a: 'Oo! Sa katunayan, ito ang pinakamahusay na panahon para mag-coating. Ang bagong kotse ay mas madaling ma-protect bago pa man lumabas ang mga scratches, water spots, o fading. Ang coating sa bagong kotse ay nagpapanatili ng bagong hitsura ng sasakyan nang mas matagal.' },
      { q: 'Pwede ba ang coating sa lumang kotse?', a: 'Pwede, pero kailangan muna ng paint correction (Exterior Detailing) bago ang coating para alisin ang mga scratches at imperfections. Hindi maayos na mag-a-adhere ang coating sa may defects na paint. Ang aming team ay mag-a-assess ng kondisyon ng kotse bago ang trabaho.' },
    ],
  },
  {
    cat: 'Booking & Scheduling',
    items: [
      { q: 'Paano mag-book?', a: 'Pumunta sa aming Booking page, sundan ang 5 simple na hakbang: ilagay ang detalye ng sasakyan, pumili ng serbisyo, ilagay ang lokasyon, pumili ng petsa at oras, tapos i-review at ipadala. Makikipag-ugnayan sa inyo ang aming team para sa final confirmation at payment details.' },
      { q: 'Gaano katagal bago makumpirma ang booking?', a: 'Karaniwang nakikipag-ugnayan kami sa loob ng ilang oras matapos matanggap ang booking request. Para sa mas mabilis na response, magtanong sa aming GHL chatbot o direktang makipag-chat sa aming team.' },
      { q: 'Pwede ba na ako ang pipili ng technician?', a: 'Hindi pa kami nag-o-offer ng specific technician request sa ngayon. Sinisigurado namin na lahat ng aming team members ay trained at may dalang tamang kagamitan para sa bawat serbisyo.' },
      { q: 'Pwede ba mag-book para sa ibang tao o ibang lokasyon?', a: 'Oo, pwede! Ilagay lang ang lokasyon at detalye ng sasakyan ng taong bibigyan ng serbisyo. Siguraduhing nandoon ang may-ari o responsableng tao sa oras ng appointment.' },
    ],
  },
  {
    cat: 'Travel Fee',
    items: [
      { q: 'Ano ang travel fee at kailan ito applicable?', a: 'Ang travel fee ay applicable lamang sa Wash services (Basic Wash at Basic Glow). Ang halaga ay depende sa distansya mula Arayat: 0 hanggang 7km ay libre, 8 hanggang 15km ay P150, 16 hanggang 20km ay P170, at 21 hanggang 25km ay P200. Ang lahat ng Detailing at Coating services ay walang travel fee kahit nasaan man kayo sa aming service area.' },
      { q: 'Bakit may travel fee sa wash pero wala sa detailing?', a: 'Ang detailing at coating services ay mas mataas ang halaga at mas matagal na trabaho, kaya naabot na ng service fee ang gastos ng transportasyon. Ang wash services naman ay mas mababang presyo, kaya kailangan ng hiwalay na travel fee para mapanatiling sustainable ang serbisyo.' },
    ],
  },
]

const POLICIES = [
  {
    title: 'Booking Policy', icon: '📋',
    items: [
      'Ang lahat ng bookings ay subject sa confirmation ng aming team bago maging official.',
      'Kailangan ilagay ang eksaktong lokasyon (barangay, city, at landmark kung meron) para matiyak na nasa service area ang appointment.',
      'Hindi namin maaaring i-guarantee ang eksaktong oras ng arrival lalo na sa maliwanag na trapik o mainit na panahon. Bibigyan kayo ng heads-up bago dumating ang team.',
      'Ang bawat booking ay para sa isang sasakyan lamang. Para sa maraming sasakyan, mag-book ng hiwalay para sa bawat isa.',
      'Ang booking link ay para sa self-booking. Hindi directly nagba-book ang aming team para sa inyo, pero maaari kayong humingi ng tulong sa aming chatbot o customer service.',
    ],
  },
  {
    title: 'Cancellation & Rescheduling', icon: '📅',
    items: [
      'Maaaring mag-reschedule o mag-cancel ng appointment nang hindi bababa sa 24 na oras bago ang appointment nang walang bayad.',
      'Ang cancellation na ginawa nang wala pang 24 na oras bago ang appointment ay maaaring may cancellation fee.',
      'Para sa coating services na may deposit: ang deposit ay non-refundable kung mag-cancel ng wala pang 48 na oras bago ang appointment.',
      'Para mag-reschedule, pumunta sa My Bookings sa customer dashboard at pumili ng bagong available slot.',
      'Ang Thunder Auto Hub ay may karapatang mag-reschedule ng appointment dahil sa masamang panahon, emergency, o ibang sitwasyong hindi kontrolado.',
    ],
  },
  {
    title: 'Coating Warranty Policy', icon: '🛡',
    items: [
      'Lahat ng ceramic at graphene coating services ay may kasamang 1-year warranty.',
      'Ang warranty ay sumasaklaw sa defects sa coating application — hindi kasama ang damage na dulot ng physical impact, improper aftercare, o pagkasira ng paint bago ang coating.',
      'Para mapanatili ang warranty, kailangan sundin ang aming recommended maintenance schedule (regular wash at paggamit ng coating-safe products).',
      'Ang warranty claim ay dapat i-report sa loob ng warranty period. Ang aming team ay mag-a-assess ng kondisyon ng coating bago aprubahan ang warranty claim.',
      'Ang warranty ay nangangailangan ng regular maintenance wash ng kahit isang beses bawat isang buwan para mapanatiling aktibo.',
    ],
  },
  {
    title: 'Service & Quality Policy', icon: '✦',
    items: [
      'Ginagamit namin ang professional-grade chemicals at equipment para sa lahat ng serbisyo.',
      'Bago at pagkatapos ng serbisyo, kukuha kami ng photos para sa dokumentasyon at para ibahagi sa inyo.',
      'Kung hindi kayo satisfied sa resulta, sabihin agad bago umalis ang aming team para maayos namin on-the-spot kung posible.',
      'Ang Thunder Auto Hub ay hindi responsable sa pre-existing na damage sa kotse (scratches, dents, chips) na wala namang kinalaman sa aming serbisyo.',
      'Ang aming technicians ay trained at susunod sa standard operating procedures para sa bawat uri ng serbisyo.',
    ],
  },
  {
    title: 'Privacy & Data Policy', icon: '🔒',
    items: [
      'Ang personal na impormasyon (pangalan, numero, lokasyon, detalye ng sasakyan) ay ginagamit lamang para sa booking at serbisyo — hindi namin ito ibinabahagi sa third parties.',
      'Ang mga before/after photos ay maaaring gamitin sa aming marketing materials. Kung ayaw niyo, sabihin lang sa aming team bago ang serbisyo.',
      'Ang inyong numero ay maaaring gamitin para sa booking updates, follow-ups, at occasional promotions. Maaari kayong mag-opt out sa anumang oras.',
      'Ang lahat ng payment information ay pinoproseso nang ligtas. Hindi namin ino-store ang sensitibong payment data.',
    ],
  },
]

function AccordionItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid #3A3A3A' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 16, padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{
          fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 17, letterSpacing: '.03em',
          color: isOpen ? '#FFD200' : '#FFFFFF', transition: 'color .2s', lineHeight: 1.3, flex: 1,
        }}>{q}</span>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: `1.5px solid ${isOpen ? '#FFD200' : '#3A3A3A'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all .2s',
          background: isOpen ? 'rgba(255,210,0,.1)' : 'transparent', marginTop: 2,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={isOpen ? '#FFD200' : '#CFCFCF'} strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div style={{ paddingBottom: 22, animation: 'faq-expand .25s ease' }}>
          <p style={{ fontSize: 15, color: '#CFCFCF', lineHeight: 1.75 }}>{a}</p>
        </div>
      )}
    </div>
  )
}

function PolicyCard({ title, icon, items }) {
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 16, padding: 28, transition: 'border-color .2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,210,0,.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#3A3A3A'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 42, height: 42, background: 'rgba(255,210,0,.1)', border: '1px solid rgba(255,210,0,.2)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
        }}>{icon}</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '.03em', lineHeight: 1, color: '#FFFFFF' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 20, height: 20, borderRadius: 5, background: 'rgba(255,210,0,.12)',
              border: '1px solid rgba(255,210,0,.2)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, marginTop: 2,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFD200" strokeWidth="3" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p style={{ fontSize: 14, color: '#CFCFCF', lineHeight: 1.7 }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [tab,      setTab]      = useState('FAQ')
  const [openCat,  setOpenCat]  = useState('General')
  const [openItem, setOpenItem] = useState(null)
  const [search,   setSearch]   = useState('')

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(i =>
      !search ||
      i.q.toLowerCase().includes(search.toLowerCase()) ||
      i.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0)

  const visibleFaqs = search ? filtered : FAQS.filter(c => !openCat || c.cat === openCat)

  return (
    <>
      <style>{`
        @keyframes faq-expand { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
        @keyframes faq-fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
        @keyframes faq-glow   { 0%,100% { box-shadow:0 0 0 0 rgba(255,210,0,0) } 50% { box-shadow:0 0 28px 4px rgba(255,210,0,.2) } }
      `}</style>

      <PublicNav />

      <main style={{
        minHeight: '100vh', background: '#0B0B0B',
        backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px),repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px)',
        padding: '100px 0 100px', position: 'relative',
      }}>
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom,#FFD200,rgba(255,178,0,.4),transparent)', pointerEvents: 'none', zIndex: 50 }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56, padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,210,0,.3)', borderRadius: 40, padding: '5px 16px', marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD200', animation: 'faq-glow 2s ease infinite' }} />
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.2em', color: '#FFD200' }}>HELP CENTER</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px,8vw,80px)', lineHeight: .9, letterSpacing: '-.01em', marginBottom: 16, color: '#FFFFFF' }}>
            FAQ &amp;<br /><span style={{ color: '#FFD200' }}>POLICIES</span>
          </h1>
          <p style={{ fontSize: 16, color: '#CFCFCF', lineHeight: 1.6, maxWidth: 500, margin: '0 auto', fontStyle: 'italic' }}>
            Lahat ng kailangan mong malaman tungkol sa Thunder Auto Hub — serbisyo, booking, at aming mga patakaran.
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <div style={{ display: 'flex', background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 12, padding: 4, gap: 4 }}>
            {['FAQ', 'Policies'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px 36px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 15, letterSpacing: '.1em',
                background: tab === t ? '#FFD200' : 'transparent',
                color: tab === t ? '#0B0B0B' : '#CFCFCF', transition: 'all .2s',
              }}>{t.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

          {/* FAQ tab */}
          {tab === 'FAQ' && (
            <div style={{ animation: 'faq-fadeUp .4s ease both' }}>
              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 40 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Maghanap ng tanong..."
                  style={{
                    width: '100%', height: 56, background: '#1A1A1A', border: '1.5px solid #3A3A3A',
                    borderRadius: 14, color: '#FFFFFF', paddingLeft: 52, paddingRight: 48,
                    fontSize: 16, fontFamily: 'var(--font-barlow)', outline: 'none', transition: 'border-color .15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.5)'}
                  onBlur={e => e.target.style.borderColor = '#3A3A3A'}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: 22, lineHeight: 1,
                  }}>×</button>
                )}
              </div>

              {/* Category pills */}
              {!search && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
                  {FAQS.map(cat => (
                    <button key={cat.cat} onClick={() => setOpenCat(openCat === cat.cat ? null : cat.cat)} style={{
                      padding: '8px 20px', borderRadius: 40,
                      border: `1.5px solid ${openCat === cat.cat ? '#FFD200' : '#3A3A3A'}`,
                      background: openCat === cat.cat ? 'rgba(255,210,0,.1)' : '#1A1A1A',
                      cursor: 'pointer', fontFamily: 'var(--font-cond)', fontWeight: 700,
                      fontSize: 13, letterSpacing: '.08em',
                      color: openCat === cat.cat ? '#FFD200' : '#CFCFCF', transition: 'all .15s',
                    }}>{cat.cat}</button>
                  ))}
                </div>
              )}

              {/* Accordion */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {visibleFaqs.map(cat => (
                  <div key={cat.cat} style={{ marginBottom: search ? 8 : 32 }}>
                    {search && (
                      <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.18em', color: '#777', marginBottom: 16, marginTop: 8 }}>{cat.cat}</div>
                    )}
                    <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 16, padding: '0 28px' }}>
                      {cat.items.map((item, i) => (
                        <AccordionItem key={i} q={item.q} a={item.a}
                          isOpen={openItem === `${cat.cat}-${i}`}
                          onToggle={() => setOpenItem(openItem === `${cat.cat}-${i}` ? null : `${cat.cat}-${i}`)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {search && filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#777' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8, color: '#FFFFFF' }}>WALANG NAHANAP</div>
                    <p style={{ fontSize: 14 }}>Subukan ang ibang keywords o makipag-chat sa amin.</p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div style={{ background: 'rgba(255,210,0,.05)', border: '1px solid rgba(255,210,0,.15)', borderRadius: 16, padding: '32px 36px', textAlign: 'center', marginTop: 48 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8, color: '#FFFFFF' }}>HINDI MAKITA ANG SAGOT?</div>
                <p style={{ fontSize: 14, color: '#CFCFCF', marginBottom: 24, lineHeight: 1.6 }}>
                  Makipag-chat sa aming team — lagi kaming handa para sagutin ang inyong mga tanong sa Taglish.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/book" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-display)',
                    fontSize: 16, letterSpacing: '.1em', padding: '14px 28px', borderRadius: 10, textDecoration: 'none',
                  }}>
                    Book a Service
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </Link>
                  <a href="https://m.me/thunderautohub" target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: 'transparent', color: '#CFCFCF', border: '1.5px solid #3A3A3A',
                      fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '.1em',
                      padding: '14px 28px', borderRadius: 10, textDecoration: 'none', transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#CFCFCF'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#3A3A3A'}
                  >Message Us</a>
                </div>
              </div>
            </div>
          )}

          {/* Policies tab */}
          {tab === 'Policies' && (
            <div style={{ animation: 'faq-fadeUp .4s ease both' }}>
              <div style={{ background: 'rgba(255,210,0,.06)', border: '1px solid rgba(255,210,0,.2)', borderRadius: 14, padding: '18px 24px', marginBottom: 40, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '.08em', color: '#FFD200', marginBottom: 4 }}>EFFECTIVE DATE: JANUARY 1, 2025</div>
                  <p style={{ fontSize: 14, color: '#CFCFCF', lineHeight: 1.6 }}>
                    Ang mga patakaran na ito ay nangunguna sa lahat ng serbisyo ng Thunder Auto Hub. Sa pag-book ng aming serbisyo, tinatanggap ninyo ang mga terms na ito.
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {POLICIES.map((p, i) => <PolicyCard key={i} {...p} />)}
              </div>
              <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 16, padding: 28, marginTop: 20, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8, color: '#FFFFFF' }}>MAY KATANUNGAN SA AMING POLICIES?</div>
                <p style={{ fontSize: 14, color: '#CFCFCF', marginBottom: 20, lineHeight: 1.6 }}>
                  Para sa mga katanungan, concerns, o complaints — makipag-ugnayan sa aming team nang direkta.
                </p>
                <Link href="/book" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-display)',
                  fontSize: 16, letterSpacing: '.1em', padding: '14px 28px', borderRadius: 10, textDecoration: 'none',
                }}>
                  Book a Service
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      <PublicFooter />
    </>
  )
}

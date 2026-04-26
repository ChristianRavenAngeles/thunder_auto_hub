import { createAdminClient } from '@/lib/supabase/admin'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'
import { CheckCircle, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/pricing'

export const metadata = { title: 'Services — Thunder Auto Hub' }
export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const admin = createAdminClient()
  const { data: services } = await admin.from('services').select('*').eq('is_active', true).order('sort_order')

  const byCategory = (services || []).reduce((acc, s) => {
    const cat = s.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const catLabels = { wash: 'Wash Services', detailing: 'Detailing', coating: 'Coating', maintenance: 'Maintenance' }

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="page-container py-12">
          <div className="text-center mb-12">
            <div className="badge-teal mb-3">Services</div>
            <h1 className="section-title">Lahat ng Serbisyo</h1>
            <p className="section-subtitle">Premium home-service car care — pumupunta kami sa inyo.</p>
          </div>

          {Object.entries(byCategory).map(([cat, items]) => (
            <section key={cat} className="mb-12">
              <h2 className="text-lg font-bold font-display text-thunder-dark mb-5 flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-500" />
                {catLabels[cat] || cat}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map(s => (
                  <div key={s.id} className="card p-5 flex flex-col">
                    <h3 className="font-bold text-thunder-dark mb-2">{s.name}</h3>
                    {s.description && <p className="text-sm text-[var(--text-muted)] mb-3 flex-1">{s.description}</p>}

                    {/* Price tiers */}
                    {s.price_s || s.price_m || s.price_l || s.price_xl ? (
                      <div className="grid grid-cols-4 gap-1 mb-4">
                        {[['S', s.price_s], ['M', s.price_m], ['L', s.price_l], ['XL', s.price_xl]].map(([tier, price]) =>
                          price ? (
                            <div key={tier} className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-xs text-[var(--text-muted)]">{tier}</p>
                              <p className="text-xs font-bold text-thunder-dark">{formatPrice(price)}</p>
                            </div>
                          ) : null
                        )}
                      </div>
                    ) : null}

                    {/* Duration & inclusions */}
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-4">
                      {s.duration_hours && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{s.duration_hours} hr</span>
                      )}
                    </div>

                    {s.inclusions && (
                      <ul className="space-y-1 mb-4">
                        {(Array.isArray(s.inclusions) ? s.inclusions : []).map((inc, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> {inc}
                          </li>
                        ))}
                      </ul>
                    )}

                    <Link href="/book" className="btn-primary w-full text-center mt-auto !py-2 !text-sm">Book Now</Link>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {(!services || services.length === 0) && (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p>Services loading... Please check back shortly.</p>
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  )
}

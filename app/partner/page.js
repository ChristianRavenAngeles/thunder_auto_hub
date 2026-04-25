'use client'

import { useState } from 'react'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'
import { Handshake, Check, ArrowRight, Building2, TrendingUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const PARTNER_BENEFITS = [
  'Access to Thunder Auto Hub brand and systems',
  'Detailing and coating referral revenue share',
  'Training and certification support',
  'Priority job assignments in your area',
  'Co-branded marketing materials',
  'Dedicated partner dashboard',
]

export default function PartnerPage() {
  const [form, setForm] = useState({ business_name: '', contact_name: '', phone: '', email: '', address: '', city: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/public/partner-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) { setSubmitted(true) }
    else toast.error('May error. Subukan ulit.')
  }

  return (
    <>
      <PublicNav />
      <main className="min-h-screen pt-16">
        {/* Hero */}
        <section className="bg-gradient-thunder py-20 text-center">
          <div className="page-container max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[var(--surface)]/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
              <Handshake className="w-4 h-4 text-thunder-gold" />
              <span className="text-[var(--text)] text-sm">B2B Partnership Program</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Partner with Thunder Auto Hub
            </h1>
            <p className="text-[var(--text-2)] text-lg mb-6">
              May sarili kang car wash shop? Join our network at mag-offer ng detailing at coating services
              sa inyong customers — gamit ang aming brand, sistema, at expertise.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {[
                { icon: Building2, label: 'Expand Services' },
                { icon: TrendingUp, label: 'More Revenue'   },
                { icon: Users,     label: 'More Customers'  },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-[var(--surface)]/10 rounded-2xl p-3 text-center">
                  <Icon className="w-5 h-5 text-thunder-gold mx-auto mb-1" />
                  <p className="text-[var(--text)] text-xs font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-[var(--surface)]">
          <div className="page-container max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="section-title mb-4">What You Get as a Partner</h2>
                <ul className="space-y-3">
                  {PARTNER_BENEFITS.map(b => (
                    <li key={b} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-brand-600" />
                      </div>
                      <span className="text-gray-700 text-sm">{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 bg-brand-50 rounded-2xl p-4 border border-brand-100">
                  <p className="text-sm text-brand-700 font-medium">
                    🚀 Ginawa namin ang partnership model katulad ng OYO / RedDoorz — ikaw ang may lupa, kami ang may sistema at brand.
                  </p>
                </div>
              </div>

              {/* Application form */}
              <div className="card p-6">
                {submitted ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="font-bold font-display text-thunder-dark mb-1">Application Received! 🎉</h3>
                    <p className="text-[var(--text-muted)] text-sm">Salamat sa interes! Makikipag-ugnayan kami sa inyo within 2–3 business days.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <h3 className="font-bold font-display text-thunder-dark">Apply to be a Partner</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Business Name *</label>
                        <input className="input" required value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Contact Person *</label>
                        <input className="input" required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Phone *</label>
                      <input className="input" type="tel" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">City / Location *</label>
                      <input className="input" required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Tell us about your business</label>
                      <textarea className="input resize-none" rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Ilang taon na kayo, ano ang inyong kasalukuyang services..." />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                      {loading ? 'Submitting…' : <>Submit Application <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}

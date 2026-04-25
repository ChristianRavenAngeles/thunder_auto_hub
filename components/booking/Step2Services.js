'use client'

import { useState, useEffect } from 'react'
import { useBookingStore } from '@/store/bookingStore'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, applyPromo } from '@/lib/pricing'
import { Check, ChevronRight, ChevronLeft, Tag, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CAT_LABELS = { wash: 'Wash', detailing: 'Detailing', coating: 'Coating', maintenance: 'Maintenance' }
const CAT_COLORS = { wash: 'badge-teal', detailing: 'badge-purple', coating: 'badge-red', maintenance: 'badge-gold' }

export default function Step2Services() {
  const { tier, setStep, setServices, setPromo, selectedServices, subtotal, discount, travelFee, total, promoCode, promoData } = useBookingStore()
  const supabase = createClient()
  const [services, setAllServices] = useState([])
  const [selected, setSelected]    = useState(selectedServices)
  const [code, setCode]            = useState(promoCode || '')
  const [promoErr, setPromoErr]    = useState('')
  const [checkingPromo, setCheckingPromo] = useState(false)

  const tierKey = `price_${tier.toLowerCase()}`

  useEffect(() => {
    supabase.from('services').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setAllServices(data || []))
  }, [])

  function toggleService(svc) {
    setSelected(prev =>
      prev.find(s => s.id === svc.id) ? prev.filter(s => s.id !== svc.id) : [...prev, svc]
    )
  }

  const computedSubtotal = selected.reduce((sum, svc) => sum + (svc[tierKey] ?? 0), 0)
  const computedDiscount = promoData ? applyPromo(promoData, computedSubtotal, selected.map(s => s.id)) : 0
  const computedTotal    = computedSubtotal - computedDiscount

  async function applyCode() {
    if (!code) return
    setCheckingPromo(true)
    setPromoErr('')
    const { data, error } = await supabase.from('promos').select('*').eq('code', code.toUpperCase()).single()
    setCheckingPromo(false)
    if (error || !data) { setPromoErr('Invalid promo code.'); return }
    if (!data.is_active)  { setPromoErr('This promo is no longer active.'); return }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoErr('This promo has expired.'); return }
    const disc = applyPromo(data, computedSubtotal, selected.map(s => s.id))
    setPromo(data, disc)
    toast.success(`Promo applied! Discount: ${formatPrice(disc)}`)
  }

  function handleNext() {
    if (selected.length === 0) return toast.error('Pumili ng kahit isang serbisyo.')
    setServices(selected)
    if (promoData) setPromo(promoData, computedDiscount)
    setStep(3)
  }

  const grouped = services.reduce((acc, svc) => {
    if (!acc[svc.category]) acc[svc.category] = []
    acc[svc.category].push(svc)
    return acc
  }, {})

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-6">
        <h2 className="text-xl font-bold font-display text-thunder-dark mb-1">Piliin ang Serbisyo</h2>
        <p className="text-sm text-[var(--text-muted)] mb-5">Maaaring pumili ng isa o maraming serbisyo. Presyo ay para sa <strong>{tier}</strong> tier.</p>

        {Object.entries(grouped).map(([cat, svcs]) => (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={CAT_COLORS[cat]}>{CAT_LABELS[cat]}</span>
            </div>
            <div className="space-y-2">
              {svcs.map(svc => {
                const price = svc[tierKey] ?? 0
                const isSelected = !!selected.find(s => s.id === svc.id)
                return (
                  <button
                    key={svc.id}
                    onClick={() => toggleService(svc)}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                      isSelected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-brand-200 hover:bg-brand-50/50'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                      isSelected ? 'bg-brand-500 border-brand-500' : 'border-[var(--border)]'
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-[var(--text)]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-thunder-dark text-sm">{svc.name}</span>
                        <span className="font-bold text-brand-600 font-display flex-shrink-0">
                          {price > 0 ? formatPrice(price) : 'N/A'}
                        </span>
                      </div>
                      {svc.description && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">{svc.description}</p>
                      )}
                      {svc.has_travel_fee && (
                        <span className="text-xs text-[var(--text-muted)]">+ travel fee applicable</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Promo code */}
      <div className="card p-4">
        <label className="label flex items-center gap-2"><Tag className="w-4 h-4 text-brand-500" /> Promo Code</label>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Enter code..."
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
          />
          <button onClick={applyCode} disabled={checkingPromo} className="btn-secondary !px-4">
            {checkingPromo ? '...' : 'Apply'}
          </button>
        </div>
        {promoErr && <p className="text-xs text-red-500 mt-1">{promoErr}</p>}
        {computedDiscount > 0 && (
          <p className="text-xs text-green-600 mt-1">✅ Discount: {formatPrice(computedDiscount)} applied!</p>
        )}
      </div>

      {/* Summary */}
      {selected.length > 0 && (
        <div className="card p-4 bg-brand-50 border-brand-100">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[var(--text-2)]">
              <span>Subtotal ({selected.length} service{selected.length > 1 ? 's' : ''})</span>
              <span>{formatPrice(computedSubtotal)}</span>
            </div>
            {computedDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Promo discount</span>
                <span>- {formatPrice(computedDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[var(--text-muted)] text-xs">
              <span>Travel fee (computed in next step)</span>
              <span>TBD</span>
            </div>
            <div className="flex justify-between font-bold text-thunder-dark border-t border-brand-100 pt-2 mt-2">
              <span>Estimated Total</span>
              <span className="font-display text-brand-600 text-lg">{formatPrice(computedTotal)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Next: Schedule <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

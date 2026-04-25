'use client'

import { useState, useEffect } from 'react'
import { useBookingStore } from '@/store/bookingStore'
import { detectTierFromModel, VEHICLE_TIERS } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'
import { Car, Plus, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TIER_KEYS = ['S', 'M', 'L', 'XL']

export default function Step1Vehicle() {
  const { setStep, setVehicle, tier, model } = useBookingStore()
  const supabase = createClient()
  const [myVehicles, setMyVehicles] = useState([])
  const [useNew, setUseNew] = useState(true)
  const [form, setForm] = useState({ make: '', model: '', plate: '', year: '', color: '' })
  const [detectedTier, setDetectedTier] = useState('')
  const [manualTier, setManualTier] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMyVehicles()
  }, [])

  async function loadMyVehicles() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('vehicles').select('*').eq('user_id', user.id).order('is_primary', { ascending: false })
    if (data?.length) { setMyVehicles(data); setUseNew(false) }
  }

  function handleModelChange(val) {
    setForm(f => ({ ...f, model: val }))
    const detected = detectTierFromModel(val)
    setDetectedTier(detected || '')
    if (detected) setManualTier(detected)
  }

  const activeTier = manualTier || detectedTier

  async function selectExisting(vehicle) {
    setVehicle({
      vehicleId: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      tier: vehicle.tier,
      plate: vehicle.plate,
      isExisting: true,
    })
    setStep(2)
  }

  async function handleNext() {
    if (!form.make || !form.model) return toast.error('Lagyan ng make at model ang sasakyan.')
    if (!activeTier) return toast.error('Piliin ang vehicle tier.')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let vehicleId = null

      if (user) {
        const { data } = await supabase.from('vehicles').insert({
          user_id: user.id,
          make: form.make,
          model: form.model,
          tier: activeTier,
          plate: form.plate || null,
          year: form.year ? parseInt(form.year) : null,
          color: form.color || null,
        }).select().single()
        vehicleId = data?.id
      }

      setVehicle({
        vehicleId,
        make: form.make,
        model: form.model,
        tier: activeTier,
        plate: form.plate,
        isExisting: false,
      })
      setStep(2)
    } catch (err) {
      toast.error('May error. Try ulit.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6 animate-fade-in">
      <h2 className="text-xl font-bold font-display text-thunder-dark mb-1">Sasakyan</h2>
      <p className="text-sm text-[var(--text-muted)] mb-5">Ilagay ang detalye ng inyong sasakyan para makuha ang tamang presyo.</p>

      {/* Saved vehicles */}
      {myVehicles.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-thunder-dark">Inyong mga Sasakyan</span>
            <button onClick={() => setUseNew(true)} className="text-xs text-brand-500 hover:underline">+ Add new</button>
          </div>
          <div className="grid gap-2">
            {myVehicles.map(v => (
              <button
                key={v.id}
                onClick={() => selectExisting(v)}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-brand-200 hover:bg-brand-50 transition-all text-left"
              >
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                  <Car className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-thunder-dark text-sm">{v.make} {v.model}</div>
                  <div className="text-xs text-[var(--text-muted)]">{VEHICLE_TIERS[v.tier]?.label} {v.plate ? `• ${v.plate}` : ''}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            ))}
          </div>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--surface)] px-3 text-xs text-[var(--text-muted)]">or add a new vehicle</span>
            </div>
          </div>
        </div>
      )}

      {/* New vehicle form */}
      {(useNew || myVehicles.length === 0) && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Car Brand / Make *</label>
              <input className="input" placeholder="Toyota, Honda, Ford..." value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} />
            </div>
            <div>
              <label className="label">Model *</label>
              <input className="input" placeholder="Fortuner, Vios, Ranger..." value={form.model} onChange={e => handleModelChange(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Year</label>
              <input className="input" placeholder="2020" maxLength={4} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            </div>
            <div>
              <label className="label">Plate Number</label>
              <input className="input" placeholder="ABC 1234" value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} />
            </div>
          </div>

          {/* Tier selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">Vehicle Size *</label>
              {detectedTier && (
                <span className="text-xs text-brand-500">Auto-detected: {VEHICLE_TIERS[detectedTier]?.label}</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIER_KEYS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setManualTier(t)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all',
                    activeTier === t
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:border-brand-200'
                  )}
                >
                  <div className="font-bold text-sm">{t}</div>
                  <div className="text-xs opacity-70 mt-0.5">{VEHICLE_TIERS[t]?.label}</div>
                  <div className="text-xs opacity-50 mt-0.5 hidden sm:block">{VEHICLE_TIERS[t]?.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={loading || (!useNew && myVehicles.length === 0)}
        className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
      >
        {loading ? 'Please wait…' : 'Next: Choose Services'} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useBookingStore } from '@/store/bookingStore'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/pricing'
import { Upload, ChevronLeft, CreditCard, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

const METHODS = [
  { key: 'gcash',        label: 'GCash',         number: '09XX XXX XXXX',  note: 'Thunder Auto Hub' },
  { key: 'bank_transfer',label: 'Bank Transfer',  number: 'BDO / BPI XXXX', note: 'Thunder Auto Hub' },
]

export default function Step4Payment({ onSuccess }) {
  const store = useBookingStore()
  const supabase = createClient()
  const [method, setMethod]   = useState('gcash')
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    onDrop: ([f]) => {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    },
  })

  const selectedMethod = METHODS.find(m => m.key === method)

  async function handleSubmit() {
    if (!file) return toast.error('I-upload ang screenshot ng inyong payment.')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Upload deposit screenshot
      const ext = file.name.split('.').pop()
      const path = `deposits/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('photos').upload(path, file)
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
      const screenshotUrl = urlData.publicUrl

      // Create booking via API
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:        user?.id,
          vehicle_id:     store.vehicleId,
          vehicle_make:   store.make,
          vehicle_model:  store.model,
          vehicle_tier:   store.tier,
          vehicle_plate:  store.plate,
          services:       store.selectedServices.map(s => ({ id: s.id, name: s.name, price: s[`price_${store.tier.toLowerCase()}`] })),
          scheduled_date: store.scheduledDate,
          scheduled_time: store.scheduledTime,
          address:        store.address,
          barangay:       store.barangay,
          city:           store.city,
          landmarks:      store.landmarks,
          travel_fee:     store.travelFee,
          subtotal:       store.subtotal,
          discount:       store.discount,
          total:          store.total,
          promo_code:     store.promoData?.code,
          deposit_method: method,
          deposit_screenshot: screenshotUrl,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      store.reset()
      onSuccess(data.reference_no)
    } catch (err) {
      console.error(err)
      toast.error('May error. Subukan ulit.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Order summary */}
      <div className="card p-5 bg-brand-50 border-brand-100">
        <h3 className="font-bold text-thunder-dark font-display mb-3">Order Summary</h3>
        <div className="space-y-1.5 text-sm">
          {store.selectedServices.map(svc => (
            <div key={svc.id} className="flex justify-between text-[var(--text-2)]">
              <span>{svc.name}</span>
              <span>{formatPrice(svc[`price_${store.tier?.toLowerCase()}`] ?? 0)}</span>
            </div>
          ))}
          {store.travelFee > 0 && (
            <div className="flex justify-between text-[var(--text-2)]">
              <span>Travel Fee</span>
              <span>{formatPrice(store.travelFee)}</span>
            </div>
          )}
          {store.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Promo Discount</span>
              <span>- {formatPrice(store.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-thunder-dark border-t border-brand-100 pt-2 mt-1">
            <span>Total</span>
            <span className="font-display text-brand-600 text-lg">{formatPrice(store.total)}</span>
          </div>
          <div className="flex justify-between font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl mt-1">
            <span>Reservation Deposit</span>
            <span>₱100 due now</span>
          </div>
          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Balance (pay on service day)</span>
            <span>{formatPrice(Math.max(0, store.total - 100))}</span>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="card p-5">
        <h3 className="font-bold text-thunder-dark font-display mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-500" /> Pay ₱100 Deposit
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {METHODS.map(m => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={cn(
                'p-3 rounded-xl border-2 text-left transition-all',
                method === m.key ? 'border-brand-500 bg-brand-50' : 'border-[var(--border)] hover:border-brand-200'
              )}
            >
              <div className="font-semibold text-sm text-thunder-dark">{m.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{m.number}</div>
            </button>
          ))}
        </div>

        {selectedMethod && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
            <p className="text-[var(--text-muted)] mb-1">Send ₱100 to:</p>
            <p className="font-bold text-thunder-dark text-lg">{selectedMethod.number}</p>
            <p className="text-[var(--text-muted)]">{selectedMethod.label} — {selectedMethod.note}</p>
            <div className="flex items-start gap-2 mt-2 text-amber-700 bg-amber-50 rounded-lg p-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs">I-screenshot ang confirmation at i-upload sa ibaba para ma-confirm ang inyong booking.</span>
            </div>
          </div>
        )}

        {/* Upload */}
        <div>
          <label className="label flex items-center gap-2"><Upload className="w-4 h-4 text-brand-500" /> Upload Payment Screenshot *</label>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
              isDragActive ? 'border-brand-500 bg-brand-50' : 'border-[var(--border)] hover:border-brand-300 hover:bg-brand-50/30'
            )}
          >
            <input {...getInputProps()} />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                <div className="mt-2 flex items-center justify-center gap-1 text-green-600 text-sm">
                  <Check className="w-4 h-4" /> {file?.name}
                </div>
              </div>
            ) : (
              <div className="text-[var(--text-muted)]">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Drag & drop or click to upload</p>
                <p className="text-xs">JPG, PNG, WEBP up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <label className="label">Additional Notes (optional)</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="May additional request? Ilagay dito..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => store.setStep(3)} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading ? 'Submitting…' : 'Submit Booking'}
        </button>
      </div>

      <p className="text-xs text-center text-[var(--text-muted)]">
        Ang inyong booking ay i-co-confirm ng aming team pagkatapos ma-verify ang payment. Matatanggap kayo ng SMS confirmation.
      </p>
    </div>
  )
}

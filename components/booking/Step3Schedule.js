'use client'

import { useState, useEffect } from 'react'
import { useBookingStore } from '@/store/bookingStore'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/pricing'
import { Calendar, Clock, MapPin, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays, isWeekend } from 'date-fns'
import toast from 'react-hot-toast'

const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']

export default function Step3Schedule() {
  const { setStep, setSchedule, scheduledDate, scheduledTime, barangay, city, address, landmarks, selectedServices } = useBookingStore()
  const supabase = createClient()

  const [date, setDate]         = useState(scheduledDate || '')
  const [time, setTime]         = useState(scheduledTime || '')
  const [brgy, setBrgy]         = useState(barangay || '')
  const [cityVal, setCityVal]   = useState(city || '')
  const [addr, setAddr]         = useState(address || '')
  const [lmk, setLmk]           = useState(landmarks || '')
  const [serviceAreas, setServiceAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [blackouts, setBlackouts] = useState([])

  const hasTravelFee = selectedServices.some(s => s.has_travel_fee)

  useEffect(() => {
    supabase.from('service_areas').select('*').eq('is_serviceable', true).order('city')
      .then(({ data }) => setServiceAreas(data || []))
    supabase.from('blackout_dates').select('date')
      .then(({ data }) => setBlackouts((data || []).map(b => b.date)))
  }, [])

  function handleAreaSelect(area) {
    setSelectedArea(area)
    setBrgy(area.barangay)
    setCityVal(area.city)
    setSchedule({ travelFee: hasTravelFee ? area.travel_fee : 0 })
  }

  function isBlackedOut(dateStr) {
    return blackouts.includes(dateStr)
  }

  // Generate next 30 available days (Mon-Fri only, no blackouts)
  const availableDates = []
  let d = addDays(new Date(), 1)
  while (availableDates.length < 30) {
    const dayOfWeek = d.getDay()
    const iso = format(d, 'yyyy-MM-dd')
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isBlackedOut(iso)) {
      availableDates.push(iso)
    }
    d = addDays(d, 1)
  }

  // Group by week for display
  const weekDates = availableDates.slice(0, 14)

  function handleNext() {
    if (!date) return toast.error('Pumili ng date.')
    if (!time) return toast.error('Pumili ng oras.')
    if (!brgy || !cityVal) return toast.error('Ilagay ang inyong barangay at lungsod.')
    if (!addr) return toast.error('Ilagay ang inyong address.')

    setSchedule({
      scheduledDate: date,
      scheduledTime: time,
      barangay: brgy,
      city: cityVal,
      address: addr,
      landmarks: lmk,
      travelFee: hasTravelFee ? (selectedArea?.travel_fee ?? 0) : 0,
    })
    setStep(4)
  }

  const groupedAreas = serviceAreas.reduce((acc, a) => {
    if (!acc[a.city]) acc[a.city] = []
    acc[a.city].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-6">
        <h2 className="text-xl font-bold font-display text-thunder-dark mb-1">Petsa at Oras</h2>
        <p className="text-sm text-[var(--text-muted)] mb-5">Available kami Monday to Friday, 8AM–6PM.</p>

        {/* Date picker */}
        <div className="mb-5">
          <label className="label flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-500" /> Piliin ang Petsa</label>
          <div className="flex gap-2 flex-wrap mt-2">
            {weekDates.map(d => (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={cn(
                  'flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all text-center min-w-[56px]',
                  date === d
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:border-brand-200'
                )}
              >
                <span className="text-xs">{format(new Date(d), 'EEE')}</span>
                <span className="font-bold text-sm">{format(new Date(d), 'd')}</span>
                <span className="text-xs opacity-70">{format(new Date(d), 'MMM')}</span>
              </button>
            ))}
          </div>
          <div className="mt-2">
            <label className="label text-xs">Or pick a specific date:</label>
            <input
              type="date"
              className="input !py-2"
              value={date}
              min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Time slots */}
        <div>
          <label className="label flex items-center gap-2"><Clock className="w-4 h-4 text-brand-500" /> Oras ng Appointment</label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {TIME_SLOTS.map(t => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={cn(
                  'py-2 px-2 rounded-xl border-2 text-xs font-medium transition-all',
                  time === t
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:border-brand-200'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="card p-6">
        <h2 className="text-xl font-bold font-display text-thunder-dark mb-1 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-500" /> Service Location
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Saan namin ipapadala ang aming team?</p>

        {/* Area selector */}
        <div className="mb-4">
          <label className="label">Barangay at Lungsod *</label>
          <select
            className="input"
            value={`${brgy}||${cityVal}`}
            onChange={e => {
              const [b, c] = e.target.value.split('||')
              const area = serviceAreas.find(a => a.barangay === b && a.city === c)
              if (area) handleAreaSelect(area)
              else { setBrgy(b); setCityVal(c) }
            }}
          >
            <option value="">-- Piliin ang barangay --</option>
            {Object.entries(groupedAreas).map(([c, areas]) => (
              <optgroup key={c} label={c}>
                {areas.map(a => (
                  <option key={a.id} value={`${a.barangay}||${a.city}`}>
                    {a.barangay}, {a.city}
                    {hasTravelFee && a.travel_fee > 0 ? ` (+₱${a.travel_fee} travel fee)` : hasTravelFee ? ' (FREE travel)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {selectedArea && hasTravelFee && (
          <div className={cn(
            'mb-4 p-3 rounded-xl text-sm',
            selectedArea.travel_fee === 0 ? 'bg-green-50 text-green-700' : 'bg-brand-50 text-brand-700'
          )}>
            {selectedArea.travel_fee === 0
              ? '✅ Libre ang travel fee sa inyong area!'
              : `🚗 Travel fee: ₱${selectedArea.travel_fee} (for wash services)`}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="label">Street Address / Purok *</label>
            <input className="input" placeholder="e.g. 123 Rizal St., Brgy. San Juan" value={addr} onChange={e => setAddr(e.target.value)} />
          </div>
          <div>
            <label className="label">Landmark (optional)</label>
            <input className="input" placeholder="e.g. Malapit sa simbahan, sa tabi ng Mercury Drug..." value={lmk} onChange={e => setLmk(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Next: Payment <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

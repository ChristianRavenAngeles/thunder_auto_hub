'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Check, Clock, Truck, Sparkles, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'

const STATUS_STEPS = [
  { key: 'pending',     icon: Clock,        label: 'Booking Received',  desc: 'Natanggap na ang inyong booking.' },
  { key: 'confirmed',   icon: Check,        label: 'Confirmed',          desc: 'Confirmed na! Abangan ang aming team.' },
  { key: 'rescheduled', icon: Clock,        label: 'Rescheduled',        desc: 'Na-update na ang schedule ng inyong booking.' },
  { key: 'assigned',    icon: Truck,        label: 'Team Assigned',      desc: 'May team na para sa inyong booking.' },
  { key: 'on_the_way',  icon: Truck,        label: 'On the Way',         desc: 'Papunta na ang aming team sa inyo.' },
  { key: 'in_progress', icon: Sparkles,     label: 'In Progress',        desc: 'Nagsimula na ang serbisyo.' },
  { key: 'completed',   icon: CheckCircle,  label: 'Completed!',         desc: 'Tapos na! Salamat sa tiwala. 🙏' },
]

export default function TrackingPage() {
  const { refNo } = useParams()
  const supabase  = createClient()
  const [booking, setBooking] = useState(null)
  const [photos,  setPhotos]  = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (refNo) loadBooking()
  }, [refNo])

  async function loadBooking() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles(full_name, phone), vehicles(make, model, tier), booking_services(service_name), payments(*)')
      .eq('reference_no', refNo.toUpperCase())
      .single()

    if (!data) { setNotFound(true); setLoading(false); return }
    setBooking(data)

    const { data: photoData } = await supabase.from('photos').select('*').eq('booking_id', data.id).eq('is_public', true)
    setPhotos(photoData || [])
    setLoading(false)

    // Subscribe to realtime updates
    supabase.channel(`booking-${data.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${data.id}` },
        payload => setBooking(prev => ({ ...prev, ...payload.new }))
      )
      .subscribe()
  }

  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === booking?.status)
  const isCancelled    = booking?.status === 'cancelled'
  const isCompleted    = booking?.status === 'completed'

  if (loading) return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading…</div>
      </main>
    </>
  )

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="page-container max-w-2xl py-8">

          {notFound ? (
            <div className="card p-8 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold font-display text-thunder-dark mb-1">Booking Not Found</h2>
              <p className="text-[var(--text-muted)] text-sm mb-4">Hindi mahanap ang reference number na &quot;{refNo}&quot;.</p>
              <Link href="/track" className="btn-primary inline-block">Try Again</Link>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header */}
              <div className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Reference Number</p>
                    <p className="text-xl font-bold font-display text-brand-600">{booking?.reference_no}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    isCompleted ? 'bg-green-100 text-green-700' :
                    isCancelled ? 'bg-red-100 text-red-700' :
                    'bg-brand-100 text-brand-700'
                  }`}>
                    {booking?.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Customer</p>
                    <p className="font-medium text-thunder-dark">{booking?.profiles?.full_name || 'Guest'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Vehicle</p>
                    <p className="font-medium text-thunder-dark">{booking?.vehicles ? `${booking.vehicles.make} ${booking.vehicles.model}` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Date & Time</p>
                    <p className="font-medium text-thunder-dark">{formatDate(booking?.scheduled_date)} {booking?.scheduled_time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Location</p>
                    <p className="font-medium text-thunder-dark">{booking?.barangay}, {booking?.city}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Total</p>
                    <p className="font-bold text-brand-600">{formatPrice(booking?.total_price || 0)}</p>
                  </div>
                  {booking?.eta_minutes && booking?.status === 'on_the_way' && (
                    <div className="bg-amber-50 rounded-xl px-3 py-2">
                      <p className="text-xs text-amber-700">🚗 ETA: ~{booking.eta_minutes} minuto</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="card p-5">
                <h3 className="font-bold font-display text-thunder-dark mb-3">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {booking?.booking_services?.map(s => (
                    <span key={s.service_name} className="badge-teal">{s.service_name}</span>
                  ))}
                </div>
              </div>

              {/* Status timeline */}
              {!isCancelled && (
                <div className="card p-5">
                  <h3 className="font-bold font-display text-thunder-dark mb-4">Service Status</h3>
                  <div className="space-y-3">
                    {STATUS_STEPS.map((step, idx) => {
                      const isDone    = idx < currentStepIdx
                      const isCurrent = idx === currentStepIdx
                      const isPending = idx > currentStepIdx
                      const Icon = step.icon
                      return (
                        <div key={step.key} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isDone    ? 'bg-green-100 text-green-600' :
                            isCurrent ? 'bg-brand-500 text-[var(--text)] animate-pulse-slow' :
                            'bg-gray-100 text-[var(--text-muted)]'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className={`flex-1 pt-1 ${isPending ? 'opacity-40' : ''}`}>
                            <p className={`text-sm font-semibold ${isCurrent ? 'text-brand-600' : isDone ? 'text-green-700' : 'text-[var(--text-2)]'}`}>
                              {step.label}
                            </p>
                            {isCurrent && <p className="text-xs text-[var(--text-muted)] mt-0.5">{step.desc}</p>}
                          </div>
                          {isDone && <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Before/after photos */}
              {photos.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold font-display text-thunder-dark mb-3">Photos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {photos.map(p => (
                      <div key={p.id}>
                        <p className="text-xs text-[var(--text-muted)] mb-1 capitalize">{p.type}</p>
                        <img src={p.url} alt={p.type} className="rounded-xl w-full object-cover aspect-[4/3]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              {isCompleted && (
                <div className="card p-5 bg-green-50 border-green-100 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <h3 className="font-bold font-display text-thunder-dark">Tapos na! 🎉</h3>
                  <p className="text-sm text-[var(--text-2)] mt-1 mb-3">Salamat sa pagpili ng Thunder Auto Hub. I-rate ang aming serbisyo!</p>
                  <Link href={`/review/${booking?.id}`} className="btn-primary inline-block">Leave a Review ⭐</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  )
}

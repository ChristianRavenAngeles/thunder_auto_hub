'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, MapPin, Car, CreditCard, User, ChevronDown } from 'lucide-react'
import { formatDate, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'
import toast from 'react-hot-toast'

const STATUS_ORDER = ['pending','confirmed','assigned','on_the_way','in_progress','completed','cancelled']

const STATUS_COLOR = {
  pending:    'badge-gray',
  confirmed:  'badge-teal',
  assigned:   'badge-teal',
  on_the_way: 'badge-teal',
  in_progress:'badge-gold',
  completed:  'badge-green',
  cancelled:  'badge-red',
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const supabase = createClient()

  const [booking,  setBooking]  = useState(null)
  const [riders,   setRiders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  // action state
  const [newStatus,   setNewStatus]   = useState('')
  const [newRider,    setNewRider]    = useState('')
  const [payAmount,   setPayAmount]   = useState('')
  const [payMethod,   setPayMethod]   = useState('gcash')
  const [payNote,     setPayNote]     = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(`*, profiles(full_name, phone, email), vehicles(make, model, year, plate_number, color, vehicle_type), booking_services(*), payments(*), booking_photos(*)`)
      .eq('id', id)
      .single()
    if (!data) { router.push('/admin/bookings'); return }
    setBooking(data)
    setNewStatus(data.status)
    setNewRider(data.rider_id || '')
    setLoading(false)

    const { data: riderList } = await supabase.from('profiles').select('id, full_name').eq('role', 'rider').order('full_name')
    setRiders(riderList || [])
  }

  async function saveStatus() {
    if (newStatus === booking.status && newRider === (booking.rider_id || '')) return
    setSaving(true)
    const updates = { status: newStatus, updated_at: new Date().toISOString() }
    if (newRider && newRider !== booking.rider_id) updates.rider_id = newRider

    const { error } = await supabase.from('bookings').update(updates).eq('id', id)
    if (error) { toast.error('Failed to update.'); setSaving(false); return }

    if (newRider && newRider !== booking.rider_id) {
      await supabase.from('notifications').insert({
        user_id: newRider, type: 'rider_assigned', channel: 'in_app',
        title: 'New Job Assigned!',
        body: `May bagong job: ${booking.reference_no}`,
        data: { booking_id: id },
      })
    }
    toast.success('Booking updated.')
    await load()
    setSaving(false)
  }

  async function recordPayment() {
    const amt = parseFloat(payAmount)
    if (!amt || amt <= 0) return toast.error('Enter a valid amount.')
    setSaving(true)
    const { error } = await supabase.from('payments').insert({
      booking_id: id,
      amount: amt,
      payment_method: payMethod,
      status: 'paid',
      notes: payNote || null,
      is_deposit: false,
    })
    if (error) { toast.error('Failed to record payment.'); setSaving(false); return }

    const totalPaid = (booking.payments || [])
      .filter(p => p.status === 'paid')
      .reduce((s, p) => s + p.amount, 0) + amt
    const isFull = totalPaid >= (booking.total_amount || booking.total_price || 0)
    if (isFull) {
      await supabase.from('bookings').update({ payment_status: 'paid' }).eq('id', id)
    }

    toast.success('Payment recorded.')
    setPayAmount('')
    setPayNote('')
    await load()
    setSaving(false)
  }

  if (loading) return (
    <div className="p-6 max-w-4xl">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-32 bg-[var(--bg-2)] rounded" />
        <div className="h-10 w-64 bg-[var(--bg-2)] rounded" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-[var(--bg-2)] rounded-xl" />)}
        </div>
      </div>
    </div>
  )

  const beforePhotos  = (booking.booking_photos || []).filter(p => p.photo_type === 'before')
  const afterPhotos   = (booking.booking_photos || []).filter(p => p.photo_type === 'after')
  const depositPhotos = (booking.booking_photos || []).filter(p => p.photo_type === 'deposit')
  const totalPaid     = (booking.payments || []).filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const balance       = (booking.total_amount || booking.total_price || 0) - totalPaid

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/admin/bookings" className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-brand-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark font-mono">{booking.reference_no}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{formatDate(booking.scheduled_date)} at {booking.scheduled_time}</p>
        </div>
        <span className={`${STATUS_COLOR[booking.status] || 'badge-gray'}`}>
          {BOOKING_STATUS_LABELS[booking.status]?.label || booking.status}
        </span>
      </div>

      {/* ── Actions panel ── */}
      <div className="card p-5 mb-6 border-brand-100">
        <h3 className="font-semibold text-thunder-dark mb-4">Admin Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input w-full text-sm">
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]?.label || s}</option>
              ))}
            </select>
          </div>

          {/* Assign rider */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Assign Rider</label>
            <select value={newRider} onChange={e => setNewRider(e.target.value)} className="input w-full text-sm">
              <option value="">— Unassigned —</option>
              {riders.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            <button onClick={saveStatus} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Record payment */}
        <div className="border-t border-[var(--border)] mt-4 pt-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Record Payment — Balance: <span className="text-amber-500">{formatPrice(Math.max(0, balance))}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              type="number" placeholder="Amount (₱)" value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="input col-span-1 text-sm"
            />
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="input text-sm">
              {['gcash','cash','maya','bank_transfer'].map(m => (
                <option key={m} value={m}>{m.replace('_',' ').toUpperCase()}</option>
              ))}
            </select>
            <input
              placeholder="Note (optional)" value={payNote}
              onChange={e => setPayNote(e.target.value)}
              className="input col-span-1 text-sm"
            />
            <button onClick={recordPayment} disabled={saving || !payAmount} className="btn-secondary text-sm">
              Record
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Customer */}
        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-3 flex items-center gap-2"><User className="w-4 h-4 text-brand-500" /> Customer</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Name</dt><dd className="font-medium">{booking.profiles?.full_name}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Phone</dt><dd>{booking.profiles?.phone}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Email</dt><dd>{booking.profiles?.email || '—'}</dd></div>
          </dl>
        </div>

        {/* Vehicle */}
        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-3 flex items-center gap-2"><Car className="w-4 h-4 text-brand-500" /> Vehicle</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Car</dt><dd className="font-medium">{booking.vehicles?.make} {booking.vehicles?.model} {booking.vehicles?.year}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Plate</dt><dd>{booking.vehicles?.plate_number || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Color</dt><dd>{booking.vehicles?.color || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Type</dt><dd>{booking.vehicles?.vehicle_type}</dd></div>
          </dl>
        </div>

        {/* Address */}
        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-500" /> Service Location</h3>
          <p className="text-sm text-[var(--text-2)]">{booking.address || '—'}</p>
          {booking.barangay && <p className="text-xs text-[var(--text-muted)] mt-1">{booking.barangay}, {booking.city}</p>}
          {booking.travel_fee > 0 && <p className="text-xs text-brand-600 mt-1">Travel fee: {formatPrice(booking.travel_fee)}</p>}
        </div>

        {/* Payment summary */}
        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand-500" /> Payment</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Subtotal</dt><dd>{formatPrice(booking.subtotal)}</dd></div>
            {booking.discount_amount > 0 && <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Discount</dt><dd className="text-green-600">-{formatPrice(booking.discount_amount)}</dd></div>}
            {booking.travel_fee > 0 && <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Travel</dt><dd>{formatPrice(booking.travel_fee)}</dd></div>}
            <div className="flex justify-between font-bold border-t border-[var(--border)] pt-1.5"><dt>Total</dt><dd className="text-brand-600">{formatPrice(booking.total_amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Paid</dt><dd className="text-green-600">{formatPrice(totalPaid)}</dd></div>
            <div className="flex justify-between font-semibold"><dt className="text-[var(--text-muted)]">Balance</dt><dd className={balance > 0 ? 'text-amber-500' : 'text-green-600'}>{formatPrice(Math.max(0, balance))}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Status</dt><dd><span className={`badge-${booking.payment_status === 'paid' ? 'green' : 'gray'} text-xs`}>{PAYMENT_STATUS_LABELS[booking.payment_status]?.label || booking.payment_status}</span></dd></div>
          </dl>
        </div>
      </div>

      {/* Services */}
      <div className="card p-5 mb-5">
        <h3 className="font-semibold text-thunder-dark mb-3">Services</h3>
        <div className="space-y-2">
          {(booking.booking_services || []).map(s => (
            <div key={s.id} className="flex justify-between text-sm">
              <span className="text-[var(--text)]">{s.service_name}</span>
              <span className="font-medium">{formatPrice(s.unit_price || s.price)}</span>
            </div>
          ))}
          {!(booking.booking_services?.length) && <p className="text-sm text-[var(--text-muted)]">No services recorded.</p>}
        </div>
      </div>

      {/* Payment history */}
      {booking.payments?.length > 0 && (
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-thunder-dark mb-3">Payment History</h3>
          <div className="space-y-2">
            {booking.payments.map(p => (
              <div key={p.id} className="flex justify-between items-center text-sm py-1 border-b border-[var(--border)] last:border-0">
                <div>
                  <span className="font-medium capitalize">{p.payment_method || '—'}</span>
                  {p.is_deposit && <span className="ml-2 text-xs text-amber-500 font-semibold">DEPOSIT</span>}
                  {p.notes && <span className="ml-2 text-xs text-[var(--text-muted)]">{p.notes}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge-${p.status === 'paid' ? 'green' : 'gray'} text-xs`}>{p.status}</span>
                  <span className="font-semibold">{formatPrice(p.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-thunder-dark mb-4">Photos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {beforePhotos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Before</p>
                <div className="grid grid-cols-2 gap-2">
                  {beforePhotos.map(p => (
                    <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                      <img src={p.url} alt="Before" className="rounded-xl object-cover w-full h-24" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {afterPhotos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">After</p>
                <div className="grid grid-cols-2 gap-2">
                  {afterPhotos.map(p => (
                    <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                      <img src={p.url} alt="After" className="rounded-xl object-cover w-full h-24" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {depositPhotos.length > 0 && (
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-thunder-dark mb-3">Deposit Screenshot</h3>
          <div className="flex flex-wrap gap-3">
            {depositPhotos.map(p => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                <img src={p.url} alt="Deposit" className="rounded-xl h-32 object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {booking.notes && (
        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-2">Notes</h3>
          <p className="text-sm text-[var(--text-2)]">{booking.notes}</p>
        </div>
      )}
    </div>
  )
}

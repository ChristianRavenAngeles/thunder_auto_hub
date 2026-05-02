'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Car, CreditCard, MapPin, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'
import { buildBookingTimeline } from '@/lib/bookingTimeline'
import { getBookingSlaAlerts } from '@/lib/sla'

const STATUS_ORDER = ['pending', 'confirmed', 'assigned', 'on_the_way', 'rescheduled', 'in_progress', 'completed', 'cancelled', 'no_show']
const SERVICE_FLAG_OPTIONS = [
  'Strict gate access',
  'Pet present',
  'Requires water source',
  'Requires power outlet',
  'Tight parking',
  'Call before arrival',
]

const STATUS_COLOR = {
  pending:     'badge-gray',
  confirmed:   'badge-teal',
  assigned:    'badge-teal',
  on_the_way:  'badge-gold',
  rescheduled: 'badge-gold',
  in_progress: 'badge-gold',
  completed:   'badge-green',
  cancelled:   'badge-red',
  no_show:      'badge-red',
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('gcash')
  const [payNote, setPayNote] = useState('')
  const [etaMinutes, setEtaMinutes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [serviceFlags, setServiceFlags] = useState([])
  const [savingInternal, setSavingInternal] = useState(false)
  const [workflow, setWorkflow] = useState(null)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(`*, profiles(full_name, phone, email), vehicles(make, model, year, plate, color, tier), booking_services(*), payments(*), photos(*), booking_status_history(*), reviews(id, rating, created_at)`)
      .eq('id', id)
      .single()

    if (!data) {
      router.push('/admin/bookings')
      return
    }

    setBooking(data)
    setNewStatus(data.status)
    setEtaMinutes(data.eta_minutes ? String(data.eta_minutes) : '')
    setInternalNotes(data.admin_notes || '')
    setServiceFlags(data.service_flags || [])
    const workflowResponse = await fetch(`/api/rider/bookings/${id}`, { cache: 'no-store' })
    const workflowPayload = await workflowResponse.json().catch(() => ({}))
    setWorkflow(workflowResponse.ok ? workflowPayload : null)
    setLoading(false)
  }

  async function saveStatus() {
    if (newStatus === booking.status) return
    setSaving(true)
    const response = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_status',
        status: newStatus,
        eta_minutes: newStatus === 'on_the_way' ? Number(etaMinutes || 0) : null,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      toast.error(payload.error || 'Failed to update.')
      setSaving(false)
      return
    }

    toast.success('Booking updated.')
    await load()
    setSaving(false)
  }

  async function recordPayment() {
    const amt = parseFloat(payAmount)
    if (!amt || amt <= 0) return toast.error('Enter a valid amount.')
    setSaving(true)
    const response = await fetch(`/api/admin/bookings/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt, method: payMethod, note: payNote }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      toast.error(payload.error || 'Failed to record payment.')
      setSaving(false)
      return
    }

    toast.success('Payment recorded.')
    setPayAmount('')
    setPayNote('')
    await load()
    setSaving(false)
  }

  async function saveInternalDetails() {
    setSavingInternal(true)
    const response = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_internal',
        admin_notes: internalNotes,
        service_flags: serviceFlags,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      toast.error(payload.error || 'Could not save internal details.')
      setSavingInternal(false)
      return
    }

    toast.success('Internal notes updated.')
    await load()
    setSavingInternal(false)
  }

  if (loading) return (
    <div className="p-6 max-w-4xl">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-32 bg-[var(--bg-2)] rounded" />
        <div className="h-10 w-64 bg-[var(--bg-2)] rounded" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[var(--bg-2)] rounded-xl" />)}
        </div>
      </div>
    </div>
  )

  const photos = booking.photos || []
  const beforePhotos = photos.filter(p => p.type === 'before')
  const afterPhotos = photos.filter(p => p.type === 'after')
  const totalPaid = (booking.payments || []).filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0)
  const balance = Number(booking.total_price || 0) - totalPaid
  const history = [...(booking.booking_status_history || [])].sort((a, z) => new Date(z.created_at) - new Date(a.created_at))
  const timeline = buildBookingTimeline(booking.status, { hasReview: Boolean(booking.reviews?.length) })
  const slaAlerts = getBookingSlaAlerts(booking)

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/admin/bookings" className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-brand-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark font-mono">{booking.reference_no}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{formatDate(booking.scheduled_date)} at {displayTime(booking.scheduled_time)}</p>
        </div>
        <span className={`${STATUS_COLOR[booking.status] || 'badge-gray'}`}>
          {BOOKING_STATUS_LABELS[booking.status]?.label || booking.status}
        </span>
      </div>

      <div className="card p-5 mb-6 border-brand-100">
        <h3 className="font-semibold text-thunder-dark mb-4">Admin Actions</h3>
        {slaAlerts.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">SLA Alerts</p>
            <div className="flex flex-wrap gap-2">
              {slaAlerts.map(alert => (
                <span key={alert.key} className={`${alert.severity === 'high' ? 'badge-red' : 'badge-gold'} text-xs`}>
                  {alert.label}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input w-full text-sm">
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]?.label || s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={saveStatus} disabled={saving || newStatus === booking.status} className="btn-primary w-full">
              {saving ? 'Saving...' : 'Save Status'}
            </button>
          </div>
        </div>
        {newStatus === 'on_the_way' && (
          <div className="mt-4">
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">ETA Minutes</label>
            <input value={etaMinutes} onChange={e => setEtaMinutes(e.target.value)} className="input w-full text-sm max-w-xs" placeholder="30" />
          </div>
        )}

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-3">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Timeline</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
            {timeline.map(step => (
              <div key={step.key} className={`rounded-lg border px-2 py-2 text-center ${
                step.state === 'done'
                  ? 'border-green-200 bg-green-50'
                  : step.state === 'current'
                    ? 'border-brand-200 bg-brand-50'
                    : 'border-[var(--border)] bg-white'
              }`}>
                <p className={`text-[11px] font-semibold ${
                  step.state === 'done' ? 'text-green-700' : step.state === 'current' ? 'text-brand-700' : 'text-[var(--text-muted)]'
                }`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] mt-4 pt-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Record Payment - Balance: <span className="text-amber-500">{formatPrice(Math.max(0, balance))}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              type="number" placeholder="Amount (PHP)" value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="input col-span-1 text-sm"
            />
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="input text-sm">
              {['gcash', 'cash', 'bank_transfer', 'paymongo'].map(m => (
                <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
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

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-thunder-dark mb-4">Internal Notes and Flags</h3>
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-5">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Admin Notes</label>
            <textarea
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              className="input resize-none text-sm"
              rows={5}
              placeholder="Arrival instructions, customer preferences, hazards, or team handoff notes"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Service Flags</p>
            <div className="space-y-2">
              {SERVICE_FLAG_OPTIONS.map(flag => {
                const checked = serviceFlags.includes(flag)
                return (
                  <label key={flag} className="flex items-center gap-2 text-sm text-thunder-dark">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setServiceFlags(prev => checked ? prev.filter(item => item !== flag) : [...prev, flag])}
                    />
                    <span>{flag}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button onClick={saveInternalDetails} disabled={savingInternal} className="btn-primary">
            {savingInternal ? 'Saving...' : 'Save Internal Details'}
          </button>
        </div>
      </div>

      {workflow && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-thunder-dark mb-4">Field Workflow</h3>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Checklist</p>
              <div className="space-y-2">
                {(workflow.checklist || []).map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={item.is_done} readOnly />
                    <span className={item.is_done ? 'line-through text-[var(--text-muted)]' : 'text-thunder-dark'}>{item.item}</span>
                  </div>
                ))}
                {!(workflow.checklist || []).length && <p className="text-sm text-[var(--text-muted)]">No checklist yet.</p>}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Supplies Used</p>
              <div className="space-y-2">
                {(workflow.usage || []).map(item => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-thunder-dark">{item.supply?.name || 'Supply'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.notes || 'Logged on booking'}</p>
                    </div>
                    <span className="text-brand-600 font-semibold">{item.quantity} {item.supply?.unit}</span>
                  </div>
                ))}
                {!(workflow.usage || []).length && <p className="text-sm text-[var(--text-muted)]">No supply usage recorded.</p>}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Technician Notes</p>
              <div className="space-y-2">
                {(workflow.notes || []).map(item => (
                  <div key={item.id} className="rounded-lg bg-[var(--bg-2)] p-3 text-sm">
                    <span className={`${item.severity === 'critical' ? 'badge-red' : item.severity === 'warning' ? 'badge-gold' : 'badge-teal'} text-[10px]`}>
                      {item.severity}
                    </span>
                    <p className="mt-2 text-[var(--text-2)]">{item.note}</p>
                  </div>
                ))}
                {!(workflow.notes || []).length && <p className="text-sm text-[var(--text-muted)]">No technician notes yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-3 flex items-center gap-2"><User className="w-4 h-4 text-brand-500" /> Customer</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Name</dt><dd className="font-medium">{booking.profiles?.full_name}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Phone</dt><dd>{booking.profiles?.phone}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Email</dt><dd>{booking.profiles?.email || '-'}</dd></div>
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-3 flex items-center gap-2"><Car className="w-4 h-4 text-brand-500" /> Vehicle</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Car</dt><dd className="font-medium">{booking.vehicles?.make} {booking.vehicles?.model} {booking.vehicles?.year}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Plate</dt><dd>{booking.vehicles?.plate || '-'}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Color</dt><dd>{booking.vehicles?.color || '-'}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20">Tier</dt><dd>{booking.vehicles?.tier || '-'}</dd></div>
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-500" /> Service Location</h3>
          <p className="text-sm text-[var(--text-2)]">{booking.address || '-'}</p>
          {booking.barangay && <p className="text-xs text-[var(--text-muted)] mt-1">{booking.barangay}, {booking.city}</p>}
          {booking.travel_fee > 0 && <p className="text-xs text-brand-600 mt-1">Travel fee: {formatPrice(booking.travel_fee)}</p>}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand-500" /> Payment</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Subtotal</dt><dd>{formatPrice(booking.subtotal || 0)}</dd></div>
            {booking.discount_amount > 0 && <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Discount</dt><dd className="text-green-600">-{formatPrice(booking.discount_amount)}</dd></div>}
            {booking.travel_fee > 0 && <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Travel</dt><dd>{formatPrice(booking.travel_fee)}</dd></div>}
            <div className="flex justify-between font-bold border-t border-[var(--border)] pt-1.5"><dt>Total</dt><dd className="text-brand-600">{formatPrice(booking.total_price || 0)}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Paid</dt><dd className="text-green-600">{formatPrice(totalPaid)}</dd></div>
            <div className="flex justify-between font-semibold"><dt className="text-[var(--text-muted)]">Balance</dt><dd className={balance > 0 ? 'text-amber-500' : 'text-green-600'}>{formatPrice(Math.max(0, balance))}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Status</dt><dd><span className={`badge-${booking.payment_status === 'paid' ? 'green' : 'gray'} text-xs`}>{PAYMENT_STATUS_LABELS[booking.payment_status]?.label || booking.payment_status}</span></dd></div>
          </dl>
        </div>
      </div>

      <div className="card p-5 mb-5">
        <h3 className="font-semibold text-thunder-dark mb-3">Services</h3>
        <div className="space-y-2">
          {(booking.booking_services || []).map(s => (
            <div key={s.id} className="flex justify-between text-sm">
              <span className="text-[var(--text)]">{s.service_name}</span>
              <span className="font-medium">{formatPrice(s.unit_price || s.subtotal || 0)}</span>
            </div>
          ))}
          {!(booking.booking_services?.length) && <p className="text-sm text-[var(--text-muted)]">No services recorded.</p>}
        </div>
      </div>

      {booking.payments?.length > 0 && (
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-thunder-dark mb-3">Payment History</h3>
          <div className="space-y-2">
            {booking.payments.map(p => (
              <div key={p.id} className="flex justify-between items-center text-sm py-1 border-b border-[var(--border)] last:border-0">
                <div>
                  <span className="font-medium capitalize">{p.method?.replace('_', ' ') || '-'}</span>
                  {p.is_deposit && <span className="ml-2 text-xs text-amber-500 font-semibold">DEPOSIT</span>}
                  {p.screenshot_url && <a className="ml-2 text-xs text-brand-600" href={p.screenshot_url} target="_blank" rel="noreferrer">screenshot</a>}
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

      {history.length > 0 && (
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-thunder-dark mb-3">Status History</h3>
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="border-l-2 border-brand-200 pl-3 text-sm">
                <p className="font-medium text-thunder-dark">{historyTitle(item)}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatDate(item.created_at)} by {item.actor_role || 'system'}</p>
                {item.to_scheduled_date && (
                  <p className="text-xs text-[var(--text-2)] mt-1">
                    New schedule: {formatDate(item.to_scheduled_date)} {displayTime(item.to_scheduled_time)}
                  </p>
                )}
                {item.reason && <p className="text-xs text-[var(--text-muted)] mt-1">Reason: {item.reason}</p>}
                {item.note && <p className="text-xs text-[var(--text-muted)] mt-1">{item.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-thunder-dark mb-4">Photos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <PhotoGroup title="Before" photos={beforePhotos} />
            <PhotoGroup title="After" photos={afterPhotos} />
          </div>
        </div>
      )}

      {booking.cancellation_reason && (
        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-2">Cancellation Reason</h3>
          <p className="text-sm text-[var(--text-2)]">{booking.cancellation_reason}</p>
        </div>
      )}

      {booking.notes && (
        <div className="card p-5 mt-5">
          <h3 className="font-semibold text-thunder-dark mb-2">Customer Notes</h3>
          <p className="text-sm text-[var(--text-2)]">{booking.notes}</p>
        </div>
      )}
    </div>
  )
}

function PhotoGroup({ title, photos }) {
  if (!photos.length) return null
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {photos.map(p => (
          <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
            <img src={p.url} alt={title} className="rounded-xl object-cover w-full h-24" />
          </a>
        ))}
      </div>
    </div>
  )
}

function displayTime(value) {
  if (!value) return '-'
  const normalized = String(value).slice(0, 5)
  const map = {
    '08:00': '8:00 AM',
    '09:00': '9:00 AM',
    '10:00': '10:00 AM',
    '11:00': '11:00 AM',
    '13:00': '1:00 PM',
    '14:00': '2:00 PM',
    '15:00': '3:00 PM',
    '16:00': '4:00 PM',
  }
  return map[normalized] || value
}

function historyTitle(item) {
  if (item.action === 'reschedule_requested') return 'Reschedule submitted'
  if (item.action === 'cancelled_by_customer') return 'Cancelled by customer'
  if (item.action === 'booking_created') return 'Booking created'
  if (item.action === 'payment_confirmed') return 'Payment confirmed'
  if (item.action === 'payment_recorded') return 'Payment recorded'
  if (item.action === 'status_updated_by_admin') return 'Status updated by admin'
  if (item.from_status || item.to_status) return `${item.from_status || 'status'} -> ${item.to_status || 'status'}`
  return item.action?.replace(/_/g, ' ') || 'Booking updated'
}

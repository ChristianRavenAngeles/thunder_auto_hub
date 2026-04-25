import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Car, CreditCard, Clock, User } from 'lucide-react'
import { formatDate, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

const STATUS_COLOR = {
  pending:    'badge-gray',
  confirmed:  'badge-teal',
  en_route:   'badge-teal',
  in_progress:'badge-gold',
  completed:  'badge-green',
  cancelled:  'badge-red',
}

export default async function BookingDetailPage({ params }) {
  const admin = createAdminClient()
  const { data: booking } = await admin
    .from('bookings')
    .select(`
      *,
      profiles(full_name, phone, email),
      vehicles(make, model, year, plate_number, color, vehicle_type),
      booking_services(*),
      payments(*),
      booking_photos(*)
    `)
    .eq('id', params.id)
    .single()

  if (!booking) notFound()

  const beforePhotos = (booking.booking_photos || []).filter(p => p.photo_type === 'before')
  const afterPhotos  = (booking.booking_photos || []).filter(p => p.photo_type === 'after')
  const depositPhotos= (booking.booking_photos || []).filter(p => p.photo_type === 'deposit')

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/admin/bookings" className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-brand-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark font-mono">{booking.ref_number}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{formatDate(booking.scheduled_date)} at {booking.scheduled_time}</p>
        </div>
        <span className={`${STATUS_COLOR[booking.status] || 'badge-gray'}`}>{BOOKING_STATUS_LABELS[booking.status]}</span>
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

        {/* Payment */}
        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand-500" /> Payment</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Subtotal</dt><dd>{formatPrice(booking.subtotal)}</dd></div>
            {booking.discount_amount > 0 && <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Discount</dt><dd className="text-green-600">-{formatPrice(booking.discount_amount)}</dd></div>}
            {booking.travel_fee > 0 && <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Travel</dt><dd>{formatPrice(booking.travel_fee)}</dd></div>}
            <div className="flex justify-between font-bold border-t border-[var(--border)] pt-1.5"><dt>Total</dt><dd className="text-brand-600">{formatPrice(booking.total_amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Status</dt><dd><span className={`badge-${booking.payment_status === 'paid' ? 'green' : 'gray'} text-xs`}>{PAYMENT_STATUS_LABELS[booking.payment_status]}</span></dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Method</dt><dd className="capitalize">{booking.payment_method || '—'}</dd></div>
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
              <span className="font-medium">{formatPrice(s.price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Photos */}
      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="card p-5">
          <h3 className="font-semibold text-thunder-dark mb-4">Photos</h3>
          <div className="grid grid-cols-2 gap-6">
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

      {/* Deposit screenshot */}
      {depositPhotos.length > 0 && (
        <div className="card p-5 mt-5">
          <h3 className="font-semibold text-thunder-dark mb-3">Deposit Screenshot</h3>
          <div className="flex gap-3">
            {depositPhotos.map(p => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                <img src={p.url} alt="Deposit" className="rounded-xl h-32 object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div className="card p-5 mt-5">
          <h3 className="font-semibold text-thunder-dark mb-2">Notes</h3>
          <p className="text-sm text-[var(--text-2)]">{booking.notes}</p>
        </div>
      )}
    </div>
  )
}

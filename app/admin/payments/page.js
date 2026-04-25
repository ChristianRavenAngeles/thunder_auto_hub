import { createAdminClient } from '@/lib/supabase/admin'
import { CreditCard, CheckCircle, Clock, XCircle, Download } from 'lucide-react'
import { formatDate, PAYMENT_STATUS_LABELS } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'

export const metadata = { title: 'Payments — Thunder Admin' }
export const dynamic = 'force-dynamic'

const STATUS_COLOR = {
  pending:   'badge-gray',
  paid:      'badge-green',
  partial:   'badge-gold',
  refunded:  'badge-red',
  waived:    'badge-purple',
}

export default async function PaymentsPage({ searchParams }) {
  const admin  = createAdminClient()
  const filter = searchParams?.status || 'all'

  let query = admin
    .from('payments')
    .select('*, bookings(ref_number, user_id, profiles(full_name, phone))')
    .order('created_at', { ascending: false })
    .limit(200)

  if (filter !== 'all') query = query.eq('status', filter)

  const { data: payments } = await query

  const totalPaid = (payments || []).filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0)
  const totalPending = (payments || []).filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">Payments</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Deposit tracking and payment records.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-[var(--text-muted)] mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(totalPaid)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-muted)] mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{formatPrice(totalPending)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-muted)] mb-1">Total Records</p>
          <p className="text-2xl font-bold text-thunder-dark">{payments?.length || 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all','pending','paid','partial','refunded'].map(s => (
          <a key={s} href={`?status=${s}`} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-brand-500 text-[var(--text)]' : 'bg-[var(--bg-2)] text-[var(--text-2)] hover:bg-gray-200'}`}>
            {s === 'all' ? 'All' : PAYMENT_STATUS_LABELS[s]?.label || s}
          </a>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="p-4 font-semibold text-[var(--text-muted)]">Booking</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Customer</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Type</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Amount</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Status</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Date</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Method</th>
            </tr>
          </thead>
          <tbody>
            {(payments || []).map(p => (
              <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-2)]/50 transition-colors">
                <td className="p-4 font-mono text-xs text-brand-600">{p.bookings?.ref_number || '—'}</td>
                <td className="p-4">
                  <p className="font-medium text-thunder-dark">{p.bookings?.profiles?.full_name || '—'}</p>
                  <p className="text-xs text-[var(--text-muted)]">{p.bookings?.profiles?.phone || ''}</p>
                </td>
                <td className="p-4 text-[var(--text-2)] capitalize">{p.payment_type || '—'}</td>
                <td className="p-4 font-semibold text-thunder-dark">{formatPrice(p.amount)}</td>
                <td className="p-4"><span className={`${STATUS_COLOR[p.status] || 'badge-gray'} text-xs`}>{PAYMENT_STATUS_LABELS[p.status]?.label || p.status}</span></td>
                <td className="p-4 text-[var(--text-muted)] text-xs">{formatDate(p.created_at)}</td>
                <td className="p-4 text-[var(--text-2)] capitalize text-xs">{p.payment_method || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!payments || payments.length === 0) && (
          <div className="p-12 text-center text-[var(--text-muted)]">
            <CreditCard className="w-8 h-8 mx-auto mb-2" /> No payment records.
          </div>
        )}
      </div>
    </div>
  )
}

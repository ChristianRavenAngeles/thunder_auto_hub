'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/pricing'

const STATUSES = ['all', 'pending', 'confirmed', 'rescheduled', 'in_progress', 'completed', 'cancelled', 'no_show']

const STATUS_MAP = {
  pending:     { label: 'Pending',     bg: 'rgba(251,191,36,.15)',  color: '#FCD34D' },
  confirmed:   { label: 'Confirmed',   bg: 'rgba(52,211,153,.15)',  color: '#34D399' },
  rescheduled: { label: 'Rescheduled', bg: 'rgba(167,139,250,.15)', color: '#A78BFA' },
  in_progress: { label: 'In Progress', bg: 'rgba(251,146,60,.15)',  color: '#FB923C' },
  completed:   { label: 'Completed',   bg: 'rgba(52,211,153,.15)',  color: '#34D399' },
  cancelled:   { label: 'Cancelled',   bg: 'rgba(248,113,113,.15)', color: '#F87171' },
  no_show:     { label: 'No Show',     bg: 'rgba(156,163,175,.15)', color: '#9CA3AF' },
}

function StatusBadge({ status }) {
  const m = STATUS_MAP[status] || { label: status, bg: 'rgba(156,163,175,.15)', color: '#9CA3AF' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      background: m.bg, color: m.color,
      fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '.06em',
      whiteSpace: 'nowrap',
    }}>{m.label.toUpperCase()}</span>
  )
}

function formatDate(str) {
  if (!str) return '-'
  return new Date(str + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminBookingsPage() {
  const [supabase] = useState(() => createClient())
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const searchTimerRef = useRef(null)

  const loadBookings = useCallback(async (searchVal) => {
    setLoading(true)
    let q = supabase
      .from('bookings')
      .select('id, reference_no, status, scheduled_date, scheduled_time, total_price, deposit_paid, created_at, barangay, city, profiles(full_name, phone), vehicles(make, model, tier), booking_services(service_name), payments(id, status, amount, is_deposit, screenshot_url)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (status !== 'all') q = q.eq('status', status)
    const s = searchVal ?? search
    if (s) q = q.or(`reference_no.ilike.%${s}%,barangay.ilike.%${s}%,city.ilike.%${s}%`)

    const { data } = await q
    setBookings(data || [])
    setLoading(false)
  }, [status, search, supabase])

  useEffect(() => { loadBookings() }, [loadBookings])

  function handleSearchChange(e) {
    const val = e.target.value
    setSearch(val)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => loadBookings(val), 400)
  }

  async function confirmDeposit(bookingId, paymentId) {
    await supabase.from('payments').update({ status: 'paid', confirmed_at: new Date().toISOString() }).eq('id', paymentId)
    await supabase.from('bookings').update({ deposit_paid: true, payment_status: 'deposit_paid', status: 'confirmed' }).eq('id', bookingId)
    await supabase.from('booking_status_history').insert({
      booking_id: bookingId,
      action: 'payment_confirmed',
      to_status: 'confirmed',
      note: 'Deposit payment confirmed by admin.',
    })
    toast.success('Deposit confirmed.')
    loadBookings()
  }

  const tabStyle = (s) => ({
    padding: '6px 14px', borderRadius: 20, cursor: 'pointer', border: 'none',
    fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '.08em',
    transition: 'all .15s',
    background: status === s ? '#FFD200' : '#1C1C1C',
    color: status === s ? '#0B0B0B' : '#666',
  })

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 28, letterSpacing: '.04em', color: '#FFFFFF', margin: 0 }}>BOOKINGS</h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{bookings.length} results</p>
        </div>
      </div>

      <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Search by reference, city, barangay..."
            value={search}
            onChange={handleSearchChange}
            style={{
              width: '100%', height: 38, background: '#1C1C1C', border: '1px solid #2A2A2A',
              borderRadius: 8, color: '#FFFFFF', paddingLeft: 36, paddingRight: 14,
              fontSize: 13, fontFamily: 'var(--font-barlow)', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.4)'}
            onBlur={e => e.target.style.borderColor = '#2A2A2A'}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {STATUSES.map(s => (
            <button key={s} style={tabStyle(s)} onClick={() => setStatus(s)}>
              {s === 'all' ? 'ALL' : (STATUS_MAP[s]?.label || s).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#666', fontSize: 13 }}>Loading...</div>
        ) : !bookings.length ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#666', fontSize: 13 }}>No bookings found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                  {['Reference', 'Customer', 'Services', 'Date', 'Location', 'Status', 'Payment', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10,
                      letterSpacing: '.12em', color: '#666', whiteSpace: 'nowrap',
                    }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const deposit = b.payments?.find(p => p.is_deposit)
                  const isPendingDeposit = deposit && deposit.status === 'pending'
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, color: '#FFD200' }}>{b.reference_no || '-'}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                          {b.created_at ? new Date(b.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '-'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{b.profiles?.full_name || 'Guest'}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>{b.profiles?.phone || '-'}</div>
                      </td>
                      <td style={{ padding: '14px 16px', maxWidth: 160 }}>
                        <div style={{ fontSize: 12, color: '#CFCFCF', lineHeight: 1.4 }}>
                          {b.booking_services?.map(s => s.service_name).join(', ') || '-'}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                          {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model} (${b.vehicles.tier})` : '-'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 13, color: '#CFCFCF' }}>{formatDate(b.scheduled_date)}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>{b.scheduled_time || '-'}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, color: '#CFCFCF' }}>{b.barangay}, {b.city}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#FFD200', marginTop: 2 }}>{formatPrice(b.total_price || 0)}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={b.status} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {isPendingDeposit ? (
                          <div>
                            <span style={{ fontSize: 11, color: '#FCD34D', fontFamily: 'var(--font-cond)', fontWeight: 700 }}>DEP. PENDING</span>
                            {deposit.screenshot_url && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <a href={deposit.screenshot_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#60A5FA' }}>View</a>
                                <button onClick={() => confirmDeposit(b.id, deposit.id)} style={{ fontSize: 11, color: '#34D399', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Confirm</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: b.deposit_paid ? '#34D399' : '#666', fontFamily: 'var(--font-cond)', fontWeight: 700 }}>
                            {b.deposit_paid ? 'PAID' : '-'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <Link href={`/admin/bookings/${b.id}`} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 6, background: '#1C1C1C', border: '1px solid #2A2A2A', color: '#666', textDecoration: 'none',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

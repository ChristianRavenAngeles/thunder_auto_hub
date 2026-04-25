export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatPrice, formatDate } from '@/lib/utils'

/* ── helpers ── */
const peso = (n) => '₱' + Number(n || 0).toLocaleString()

const STATUS_MAP = {
  pending:     { label: 'Pending',     bg: 'rgba(251,191,36,.1)',   color: '#FBB724', border: 'rgba(251,191,36,.2)',  dot: '#FBB724' },
  confirmed:   { label: 'Confirmed',   bg: 'rgba(96,165,250,.12)',  color: '#60A5FA', border: 'rgba(96,165,250,.25)', dot: '#60A5FA' },
  'in-progress':{ label: 'In Progress',bg: 'rgba(255,210,0,.12)',   color: '#FFD200', border: 'rgba(255,210,0,.25)',  dot: '#FFD200' },
  completed:   { label: 'Completed',   bg: 'rgba(34,197,94,.12)',   color: '#22C55E', border: 'rgba(34,197,94,.25)',  dot: '#22C55E' },
  cancelled:   { label: 'Cancelled',   bg: 'rgba(248,113,113,.1)',  color: '#F87171', border: 'rgba(248,113,113,.2)', dot: '#F87171' },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
      borderRadius: 40, background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

function Avatar({ name }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,210,0,.15)',
      border: '1.5px solid rgba(255,210,0,.3)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'var(--font-cond)', fontWeight: 700,
      fontSize: 12, color: '#FFD200', flexShrink: 0,
    }}>{initials}</div>
  )
}

const STAT_ICONS = {
  bookings: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  bell:     'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  car:      'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9h-1 M15 17H9 M18 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z M7 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  users:    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  trending: 'M18 20V10 M12 20V4 M6 20v-6',
  credit:   'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z',
}

function StatIcon({ name, color }) {
  const d = STAT_ICONS[name] || ''
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((seg, i) => <path key={i} d={(i === 0 ? '' : ' M') + seg} />)}
    </svg>
  )
}

export default async function AdminDashboard() {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // 3 parallel round-trips instead of 7+
  const [statsResult, bookingsResult, paymentsResult] = await Promise.all([
    // All 5 counts + revenue in one DB-side function
    admin.rpc('get_dashboard_stats').single(),
    admin.from('bookings')
      .select('id, reference_no, status, scheduled_date, total_amount, created_at, profiles(full_name), vehicles(make, model)')
      .order('created_at', { ascending: false })
      .limit(8),
    admin.from('payments')
      .select('id, amount, bookings(reference_no, profiles(full_name))')
      .eq('status', 'pending')
      .eq('is_deposit', true)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const s = statsResult.data || {}
  const totalBookings   = s.total_bookings   || 0
  const pendingBookings = s.pending_bookings  || 0
  const todayBookings   = s.today_bookings    || 0
  const totalCustomers  = s.total_customers   || 0
  const totalRevenue    = s.total_revenue     || 0
  const recentBookings  = bookingsResult.data || []
  const pendingPayments = paymentsResult.data || []

  const stats = [
    { label: 'Total Bookings',   value: totalBookings || 0,        icon: 'bookings', color: '#60A5FA', href: '/admin/bookings' },
    { label: 'Pending Review',   value: pendingBookings || 0,      icon: 'bell',     color: '#FFD200', href: '/admin/bookings?status=pending' },
    { label: "Today's Jobs",     value: todayBookings || 0,        icon: 'car',      color: '#A78BFA', href: '/admin/calendar' },
    { label: 'Total Customers',  value: totalCustomers || 0,       icon: 'users',    color: '#22C55E', href: '/admin/customers' },
    { label: 'Total Revenue',    value: peso(totalRevenue),        icon: 'trending', color: '#FFD200', href: '/admin/reports' },
    { label: 'Pending Payments', value: pendingPayments?.length || 0, icon: 'credit', color: '#F87171', href: '/admin/payments' },
  ]

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ animation: 'adm-fadeUp .35s ease both', maxWidth: 1400 }}>
      <style>{`@keyframes adm-fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, letterSpacing: '.02em', color: '#FFFFFF' }}>DASHBOARD</h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>Kamusta ang negosyo ngayon, {dateStr}.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Link key={i} href={s.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 12, padding: '20px 22px',
              transition: 'border-color .2s, transform .15s', cursor: 'pointer',
            }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,.05)', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StatIcon name={s.icon} color={s.color} />
                </div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, opacity: .7 }} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: typeof s.value === 'string' ? s.color : '#FFFFFF', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#CFCFCF', marginBottom: 2 }}>{s.label.toUpperCase()}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>
        {/* Recent bookings */}
        <div style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '.08em', color: '#FFFFFF' }}>RECENT BOOKINGS</span>
            <Link href="/admin/bookings" style={{ fontSize: 12, color: '#FFD200', textDecoration: 'none', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.06em' }}>View all →</Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['REF', 'CUSTOMER', 'VEHICLE', 'DATE', 'STATUS', 'AMOUNT'].map(h => (
                  <th key={h} style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: '#666', textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid #2A2A2A' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!recentBookings?.length ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#666', fontSize: 13 }}>No bookings yet.</td></tr>
              ) : recentBookings.map(b => (
                <tr key={b.id} style={{ transition: 'background .1s' }}>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(42,42,42,.7)', fontFamily: 'var(--font-cond)', fontWeight: 700, color: '#FFD200', fontSize: 12 }}>
                    <Link href={`/admin/bookings/${b.id}`} style={{ color: '#FFD200', textDecoration: 'none' }}>{b.reference_no || 'N/A'}</Link>
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(42,42,42,.7)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={b.profiles?.full_name} />
                      <div>
                        <div style={{ color: '#FFFFFF', fontWeight: 500, fontSize: 13 }}>{b.profiles?.full_name || 'Guest'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(42,42,42,.7)', fontSize: 12, color: '#CFCFCF' }}>
                    {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : '—'}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(42,42,42,.7)', fontSize: 12, color: '#CFCFCF' }}>
                    {b.scheduled_date ? new Date(b.scheduled_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(42,42,42,.7)' }}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(42,42,42,.7)', fontFamily: 'var(--font-display)', fontSize: 16, color: '#FFFFFF' }}>
                    {b.total_amount ? peso(b.total_amount) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Service mix */}
          <div style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, letterSpacing: '.16em', color: '#666', marginBottom: 16 }}>SERVICE MIX (REVENUE)</div>
            {[{ l: 'Coating', v: 60, c: '#22C55E' }, { l: 'Detailing', v: 25, c: '#A78BFA' }, { l: 'Wash', v: 15, c: '#FFD200' }].map(cat => (
              <div key={cat.l} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 12, letterSpacing: '.06em', color: '#CFCFCF' }}>{cat.l}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: cat.c }}>{cat.v}%</span>
                </div>
                <div style={{ height: 4, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.v}%`, background: cat.c, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Pending deposits */}
          <div style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em', color: '#FFFFFF' }}>PENDING DEPOSITS</span>
              <span style={{ fontFamily: 'var(--font-cond)', fontSize: 11, color: '#FFD200', fontWeight: 700 }}>{pendingPayments?.length || 0} items</span>
            </div>
            {!pendingPayments?.length ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#666', fontSize: 13 }}>All clear! ✓</div>
            ) : pendingPayments.map(p => (
              <Link key={p.id} href={`/admin/payments?id=${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2A2A2A' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, color: '#FFFFFF' }}>{p.bookings?.profiles?.full_name || 'Customer'}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>{p.bookings?.reference_no}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#FBB724' }}>{peso(p.amount)}</div>
                    <div style={{ fontSize: 10, color: '#666', fontFamily: 'var(--font-cond)' }}>DEPOSIT</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em', marginBottom: 12, color: '#FFFFFF' }}>QUICK ACTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'View Bookings',   href: '/admin/bookings' },
                { label: 'View Customers',  href: '/admin/customers' },
                { label: 'View Calendar',   href: '/admin/calendar' },
                { label: 'View Reports',    href: '/admin/reports' },
              ].map(a => (
                <Link key={a.label} href={a.href} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  background: 'transparent', border: '1px solid #2A2A2A',
                  color: '#CFCFCF', fontFamily: 'var(--font-cond)', fontWeight: 700,
                  fontSize: 12, letterSpacing: '.06em', textDecoration: 'none', transition: 'all .15s',
                }}
                >{a.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

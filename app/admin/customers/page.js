import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Customers — Thunder Admin' }
export const dynamic = 'force-dynamic'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function CustomersPage({ searchParams }) {
  const admin  = createAdminClient()
  const search = searchParams?.q || ''

  let query = admin
    .from('profiles')
    .select('*, bookings(count)')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(100)

  if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)

  const { data: customers } = await query

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 28, letterSpacing: '.04em', color: '#FFFFFF', margin: 0 }}>CUSTOMERS</h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{customers?.length || 0} registered customers</p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name or phone..."
            style={{
              width: '100%', height: 40, background: '#141414', border: '1px solid #2A2A2A',
              borderRadius: 8, color: '#FFFFFF', paddingLeft: 36, paddingRight: 14,
              fontSize: 13, fontFamily: 'var(--font-barlow)', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </form>

      {/* Table */}
      <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              {['Customer', 'Phone', 'Bookings', 'Points', 'Joined', 'Tags'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10,
                  letterSpacing: '.12em', color: '#666',
                }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(customers || []).map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #1C1C1C', background: 'transparent' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(255,210,0,.12)', border: '1.5px solid rgba(255,210,0,.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: 15, color: '#FFD200',
                    }}>{getInitials(c.full_name)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{c.full_name || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{c.email || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#CFCFCF' }}>{c.phone || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, color: '#FFD200' }}>
                    {c.bookings?.[0]?.count ?? 0}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#CFCFCF' }}>{c.loyalty_points || 0} pts</td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: '#666' }}>{formatDate(c.created_at)}</td>
                <td style={{ padding: '14px 16px' }}>
                  {c.tags && c.tags.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {c.tags.map(t => (
                        <span key={t} style={{
                          padding: '2px 8px', borderRadius: 20, background: '#2A2A2A',
                          color: '#CFCFCF', fontSize: 10, fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.06em',
                        }}>{t.toUpperCase()}</span>
                      ))}
                    </div>
                  ) : <span style={{ color: '#444', fontSize: 13 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!customers || customers.length === 0) && (
          <div style={{ padding: 48, textAlign: 'center', color: '#666', fontSize: 13 }}>No customers found.</div>
        )}
      </div>
    </div>
  )
}

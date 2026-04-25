import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Staff & Riders — Thunder Admin' }
export const dynamic = 'force-dynamic'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StarRating({ value }) {
  const n = parseFloat(value) || 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= Math.round(n) ? '#FFD200' : '#2A2A2A'} stroke={i <= Math.round(n) ? '#FFD200' : '#2A2A2A'} strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span style={{ fontSize: 11, color: '#FFD200', fontWeight: 700, marginLeft: 2 }}>{n > 0 ? n.toFixed(1) : '—'}</span>
    </div>
  )
}

export default async function StaffPage() {
  const admin = createAdminClient()

  const [{ data: staff }, { data: riders }] = await Promise.all([
    admin.from('profiles').select('*').in('role', ['admin','manager','staff', 'super_admin']).order('role'),
    admin.from('profiles').select('*, rider_stats(*)').eq('role', 'rider').order('full_name'),
  ])

  const ROLE_COLORS = {
    super_admin: { bg: 'rgba(167,139,250,.15)', color: '#A78BFA' },
    admin:       { bg: 'rgba(96,165,250,.15)',  color: '#60A5FA' },
    manager:     { bg: 'rgba(52,211,153,.15)',  color: '#34D399' },
    staff:       { bg: 'rgba(251,191,36,.15)',  color: '#FCD34D' },
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 28, letterSpacing: '.04em', color: '#FFFFFF', margin: 0 }}>STAFF & RIDERS</h1>
        <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Team management and rider performance.</p>
      </div>

      {/* Office Staff */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '.2em', color: '#666', marginBottom: 12 }}>
          OFFICE STAFF ({staff?.length || 0})
        </div>
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['Name', 'Role', 'Phone', 'Joined'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10, letterSpacing: '.12em', color: '#666',
                  }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(staff || []).map(s => {
                const rc = ROLE_COLORS[s.role] || { bg: '#2A2A2A', color: '#666' }
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #1C1C1C' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(255,210,0,.12)', border: '1.5px solid rgba(255,210,0,.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 15, color: '#FFD200',
                        }}>{getInitials(s.full_name)}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{s.full_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20,
                        background: rc.bg, color: rc.color,
                        fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '.06em',
                      }}>{s.role.toUpperCase().replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#CFCFCF' }}>{s.phone || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#666' }}>{formatDate(s.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(!staff || staff.length === 0) && (
            <div style={{ padding: 48, textAlign: 'center', color: '#666', fontSize: 13 }}>No staff found.</div>
          )}
        </div>
      </section>

      {/* Riders */}
      <section>
        <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '.2em', color: '#666', marginBottom: 12 }}>
          RIDERS ({riders?.length || 0})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {(riders || []).map(r => {
            const stats = r.rider_stats?.[0] || {}
            return (
              <div key={r.id} style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,210,0,.12)', border: '2px solid rgba(255,210,0,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 18, color: '#FFD200',
                  }}>{getInitials(r.full_name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.full_name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{r.phone || '—'}</div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                    background: r.is_available ? 'rgba(52,211,153,.15)' : 'rgba(156,163,175,.12)',
                    color: r.is_available ? '#34D399' : '#9CA3AF',
                    fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10, letterSpacing: '.08em',
                  }}>{r.is_available ? 'AVAILABLE' : 'BUSY'}</span>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: 'TOTAL JOBS', value: stats.total_jobs || 0, color: '#FFFFFF' },
                    { label: 'THIS MONTH', value: stats.jobs_this_month || 0, color: '#FFFFFF' },
                    { label: 'EARNINGS', value: stats.total_earnings ? `₱${Number(stats.total_earnings).toLocaleString()}` : '—', color: '#FFD200' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: '#1C1C1C', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-cond)', fontSize: 9, letterSpacing: '.12em', color: '#666', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 16, color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Rating */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-cond)', letterSpacing: '.08em' }}>RATING</span>
                  <StarRating value={stats.avg_rating} />
                </div>
              </div>
            )
          })}
          {(!riders || riders.length === 0) && (
            <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: '#666', fontSize: 13, background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12 }}>
              No riders registered.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

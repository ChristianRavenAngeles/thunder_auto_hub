import { createAdminClient } from '@/lib/supabase/admin'
import { Handshake, Phone, Building, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Partners — Thunder Admin' }
export const dynamic = 'force-dynamic'

const STATUS_COLOR = { pending: 'badge-gold', approved: 'badge-green', rejected: 'badge-red', active: 'badge-teal' }

export default async function PartnersPage({ searchParams }) {
  const admin  = createAdminClient()
  const filter = searchParams?.status || 'all'

  let query = admin.from('partner_applications').select('*').order('created_at', { ascending: false })
  if (filter !== 'all') query = query.eq('status', filter)

  const { data: applications } = await query

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">Partners</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">B2B partner applications and accounts.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {['all','pending','approved','active','rejected'].map(s => (
          <a key={s} href={`?status=${s}`} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-brand-500 text-[var(--text)]' : 'bg-[var(--bg-2)] text-[var(--text-2)] hover:bg-gray-200'}`}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(applications || []).map(p => (
          <div key={p.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Building className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <p className="font-bold text-thunder-dark">{p.business_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{p.business_type || '—'}</p>
                </div>
              </div>
              <span className={`${STATUS_COLOR[p.status] || 'badge-gray'} text-xs`}>{p.status}</span>
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20 flex-shrink-0">Contact</dt><dd className="text-[var(--text-2)]">{p.contact_name}</dd></div>
              <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20 flex-shrink-0">Phone</dt><dd className="text-[var(--text-2)] flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</dd></div>
              <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20 flex-shrink-0">Fleet</dt><dd className="text-[var(--text-2)]">{p.fleet_size || '—'} vehicles</dd></div>
              {p.notes && <div className="flex gap-2"><dt className="text-[var(--text-muted)] w-20 flex-shrink-0">Notes</dt><dd className="text-[var(--text-muted)] text-xs">{p.notes}</dd></div>}
            </dl>
            <p className="text-xs text-[var(--text-2)] mt-3">{formatDate(p.created_at)}</p>
            {p.status === 'pending' && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                <form method="POST" action="/api/admin/partners/approve" className="flex-1">
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn-primary w-full !py-1.5 !text-xs flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                </form>
                <form method="POST" action="/api/admin/partners/reject" className="flex-1">
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn-secondary w-full !py-1.5 !text-xs flex items-center justify-center gap-1 text-red-500 border-red-200 hover:bg-red-50">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
      {(!applications || applications.length === 0) && (
        <div className="card p-12 text-center text-[var(--text-muted)]">
          <Handshake className="w-8 h-8 mx-auto mb-2" /> No partner applications.
        </div>
      )}
    </div>
  )
}

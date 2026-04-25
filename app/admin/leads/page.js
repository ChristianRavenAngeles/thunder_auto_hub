import { createAdminClient } from '@/lib/supabase/admin'
import { UserPlus, Phone, Calendar } from 'lucide-react'
import { formatDate, LEAD_STATUS_LABELS } from '@/lib/utils'

export const metadata = { title: 'Leads — Thunder Admin' }
export const dynamic = 'force-dynamic'

const STATUS_COLOR = {
  new:        'badge-teal',
  contacted:  'badge-gold',
  converted:  'badge-green',
  lost:       'badge-red',
}

export default async function LeadsPage({ searchParams }) {
  const admin  = createAdminClient()
  const filter = searchParams?.status || 'all'

  let query = admin.from('leads').select('*').order('created_at', { ascending: false }).limit(200)
  if (filter !== 'all') query = query.eq('status', filter)

  const { data: leads } = await query

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">Leads</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Prospective customers and follow-ups.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['all','new','contacted','converted','lost'].map(s => (
          <a key={s} href={`?status=${s}`} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-brand-500 text-[var(--text)]' : 'bg-[var(--bg-2)] text-[var(--text-2)] hover:bg-gray-200'}`}>
            {s === 'all' ? 'All' : LEAD_STATUS_LABELS[s]?.label || s}
          </a>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="p-4 font-semibold text-[var(--text-muted)]">Name</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Phone</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Source</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Status</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Notes</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Date</th>
            </tr>
          </thead>
          <tbody>
            {(leads || []).map(l => (
              <tr key={l.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-2)]/50">
                <td className="p-4 font-medium text-thunder-dark">{l.name || '—'}</td>
                <td className="p-4 text-[var(--text-2)]">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {l.phone || '—'}</span>
                </td>
                <td className="p-4 text-[var(--text-muted)] capitalize text-xs">{l.source || '—'}</td>
                <td className="p-4"><span className={`${STATUS_COLOR[l.status] || 'badge-gray'} text-xs`}>{LEAD_STATUS_LABELS[l.status]?.label || l.status}</span></td>
                <td className="p-4 text-[var(--text-muted)] text-xs max-w-[200px] truncate">{l.notes || '—'}</td>
                <td className="p-4 text-[var(--text-muted)] text-xs">{formatDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!leads || leads.length === 0) && (
          <div className="p-12 text-center text-[var(--text-muted)]">
            <UserPlus className="w-8 h-8 mx-auto mb-2" /> No leads found.
          </div>
        )}
      </div>
    </div>
  )
}

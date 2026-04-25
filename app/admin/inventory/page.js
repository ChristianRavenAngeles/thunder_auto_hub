import { createAdminClient } from '@/lib/supabase/admin'
import { Package, Wrench, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Inventory — Thunder Admin' }
export const dynamic = 'force-dynamic'

export default async function InventoryPage({ searchParams }) {
  const admin = createAdminClient()
  const tab   = searchParams?.tab || 'supplies'

  const [{ data: supplies }, { data: equipment }] = await Promise.all([
    admin.from('supplies').select('*').order('name'),
    admin.from('equipment').select('*').order('name'),
  ])

  const lowSupplies = (supplies || []).filter(s => s.quantity <= (s.reorder_point || 5))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-thunder-dark">Inventory</h1>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">Supplies and equipment tracker.</p>
      </div>

      {lowSupplies.length > 0 && (
        <div className="card p-4 border-amber-200 bg-amber-50 mb-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {lowSupplies.length} item{lowSupplies.length > 1 ? 's' : ''} running low: {lowSupplies.map(s => s.name).join(', ')}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {[['supplies','Supplies'],['equipment','Equipment']].map(([key, label]) => (
          <a key={key} href={`?tab=${key}`} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-brand-500 text-[var(--text)]' : 'bg-[var(--bg-2)] text-[var(--text-2)] hover:bg-gray-200'}`}>{label}</a>
        ))}
      </div>

      {tab === 'supplies' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 font-semibold text-[var(--text-muted)]">Item</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Qty</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Unit</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Reorder At</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {(supplies || []).map(s => (
                <tr key={s.id} className={`border-b border-[var(--border)] ${s.quantity <= (s.reorder_point || 5) ? 'bg-amber-50/30' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="font-medium text-thunder-dark">{s.name}</span>
                      {s.quantity <= (s.reorder_point || 5) && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-thunder-dark">{s.quantity}</td>
                  <td className="p-4 text-[var(--text-muted)]">{s.unit || '—'}</td>
                  <td className="p-4 text-[var(--text-muted)]">{s.reorder_point || '5'}</td>
                  <td className="p-4 text-[var(--text-muted)] text-xs">{formatDate(s.updated_at || s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!supplies || supplies.length === 0) && <div className="p-8 text-center text-[var(--text-muted)]">No supplies recorded.</div>}
        </div>
      )}

      {tab === 'equipment' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 font-semibold text-[var(--text-muted)]">Equipment</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Condition</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Assigned To</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Last Maintenance</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Notes</th>
              </tr>
            </thead>
            <tbody>
              {(equipment || []).map(e => (
                <tr key={e.id} className="border-b border-[var(--border)]">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="font-medium text-thunder-dark">{e.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`badge-${e.condition === 'good' ? 'green' : e.condition === 'fair' ? 'gold' : 'red'} text-xs capitalize`}>
                      {e.condition || 'unknown'}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--text-muted)]">{e.assigned_to || '—'}</td>
                  <td className="p-4 text-[var(--text-muted)] text-xs">{e.last_maintenance ? formatDate(e.last_maintenance) : '—'}</td>
                  <td className="p-4 text-[var(--text-muted)] text-xs max-w-[200px] truncate">{e.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!equipment || equipment.length === 0) && <div className="p-8 text-center text-[var(--text-muted)]">No equipment recorded.</div>}
        </div>
      )}
    </div>
  )
}

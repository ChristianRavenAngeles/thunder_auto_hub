'use client'

import { useState, useEffect } from 'react'
import { Package, Wrench, AlertTriangle, Plus, Edit2, Minus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

export default function InventoryPage() {
  const supabase = createClient()
  const [tab,       setTab]       = useState('supplies')
  const [supplies,  setSupplies]  = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null) // { type: 'supply'|'equipment', item?: {} }
  const [adjusting, setAdjusting] = useState(null) // supply id
  const [adjDelta,  setAdjDelta]  = useState('')
  const [saving,    setSaving]    = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from('supplies').select('*').order('name'),
      supabase.from('equipment').select('*').order('name'),
    ])
    setSupplies(s || [])
    setEquipment(e || [])
    setLoading(false)
  }

  const lowSupplies = supplies.filter(s => s.quantity <= (s.reorder_point || 5))

  /* ── Adjust quantity ── */
  async function applyAdjust(supply) {
    const delta = parseInt(adjDelta)
    if (isNaN(delta) || delta === 0) { setAdjusting(null); setAdjDelta(''); return }
    const next = Math.max(0, supply.quantity + delta)
    setSaving(true)
    const { error } = await supabase.from('supplies').update({ quantity: next, updated_at: new Date().toISOString() }).eq('id', supply.id)
    if (error) toast.error('Failed to update quantity.')
    else { toast.success(`Updated to ${next}`); await load() }
    setSaving(false)
    setAdjusting(null)
    setAdjDelta('')
  }

  /* ── Save supply / equipment ── */
  async function saveModal(formData) {
    setSaving(true)
    const { type, item } = modal
    const table = type === 'supply' ? 'supplies' : 'equipment'
    let error
    if (item?.id) {
      ;({ error } = await supabase.from(table).update(formData).eq('id', item.id))
    } else {
      ;({ error } = await supabase.from(table).insert(formData))
    }
    if (error) toast.error('Save failed.')
    else { toast.success(item?.id ? 'Updated.' : 'Added.'); await load(); setModal(null) }
    setSaving(false)
  }

  if (loading) return <div className="p-6 text-[var(--text-muted)] text-sm">Loading...</div>

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">Inventory</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Supplies and equipment tracker.</p>
        </div>
        <button
          onClick={() => setModal({ type: tab === 'supplies' ? 'supply' : 'equipment' })}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Add {tab === 'supplies' ? 'Supply' : 'Equipment'}
        </button>
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
        {[['supplies', 'Supplies'], ['equipment', 'Equipment']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-brand-500 text-[var(--text)]' : 'bg-[var(--bg-2)] text-[var(--text-2)] hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Supplies table ── */}
      {tab === 'supplies' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-4 font-semibold text-[var(--text-muted)]">Item</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Qty</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Unit</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Reorder At</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Updated</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map(s => (
                <tr key={s.id} className={`border-b border-[var(--border)] ${s.quantity <= (s.reorder_point || 5) ? 'bg-amber-50/30' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="font-medium text-thunder-dark">{s.name}</span>
                      {s.quantity <= (s.reorder_point || 5) && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  </td>
                  <td className="p-4">
                    {adjusting === s.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={adjDelta}
                          onChange={e => setAdjDelta(e.target.value)}
                          placeholder="±qty"
                          className="w-16 h-7 text-xs border border-[var(--border)] rounded px-2 bg-[var(--bg-2)] text-thunder-dark"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') applyAdjust(s); if (e.key === 'Escape') { setAdjusting(null); setAdjDelta('') } }}
                        />
                        <button onClick={() => applyAdjust(s)} disabled={saving} className="p-1 text-green-600 hover:text-green-800"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setAdjusting(null); setAdjDelta('') }} className="p-1 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <span className="font-bold text-thunder-dark">{s.quantity}</span>
                    )}
                  </td>
                  <td className="p-4 text-[var(--text-muted)]">{s.unit || '—'}</td>
                  <td className="p-4 text-[var(--text-muted)]">{s.reorder_point || 5}</td>
                  <td className="p-4 text-[var(--text-muted)] text-xs">{formatDate(s.updated_at || s.created_at)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setAdjusting(s.id); setAdjDelta('') }}
                        className="text-xs text-[var(--text-muted)] hover:text-thunder-dark flex items-center gap-1 border border-[var(--border)] rounded px-2 py-1">
                        <Minus className="w-3 h-3" /> Adjust
                      </button>
                      <button onClick={() => setModal({ type: 'supply', item: s })}
                        className="text-xs text-[var(--text-muted)] hover:text-thunder-dark flex items-center gap-1 border border-[var(--border)] rounded px-2 py-1">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {supplies.length === 0 && <div className="p-8 text-center text-[var(--text-muted)]">No supplies recorded.</div>}
        </div>
      )}

      {/* ── Equipment table ── */}
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
                <th className="p-4 font-semibold text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(e => (
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
                  <td className="p-4">
                    <button onClick={() => setModal({ type: 'equipment', item: e })}
                      className="text-xs text-[var(--text-muted)] hover:text-thunder-dark flex items-center gap-1 border border-[var(--border)] rounded px-2 py-1">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {equipment.length === 0 && <div className="p-8 text-center text-[var(--text-muted)]">No equipment recorded.</div>}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <InventoryModal
          modal={modal}
          saving={saving}
          onSave={saveModal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function InventoryModal({ modal, saving, onSave, onClose }) {
  const isSupply = modal.type === 'supply'
  const item = modal.item || {}
  const [form, setForm] = useState(
    isSupply
      ? { name: item.name || '', unit: item.unit || '', quantity: item.quantity ?? 0, reorder_point: item.reorder_point ?? 5 }
      : { name: item.name || '', condition: item.condition || 'good', assigned_to: item.assigned_to || '', last_maintenance: item.last_maintenance || '', notes: item.notes || '' }
  )

  const f = (k) => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg)] rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-thunder-dark text-lg">
            {item.id ? 'Edit' : 'Add'} {isSupply ? 'Supply' : 'Equipment'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-thunder-dark"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Name</label>
            <input value={form.name} onChange={f('name')} className="input w-full" placeholder={isSupply ? 'Car shampoo, wax...' : 'Pressure washer...'} />
          </div>

          {isSupply && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Quantity</label>
                  <input type="number" value={form.quantity} onChange={f('quantity')} className="input w-full" min="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Unit</label>
                  <input value={form.unit} onChange={f('unit')} className="input w-full" placeholder="pcs, L, kg..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Reorder At</label>
                <input type="number" value={form.reorder_point} onChange={f('reorder_point')} className="input w-full" min="0" />
              </div>
            </>
          )}

          {!isSupply && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Condition</label>
                <select value={form.condition} onChange={f('condition')} className="input w-full">
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Assigned To</label>
                <input value={form.assigned_to} onChange={f('assigned_to')} className="input w-full" placeholder="Rider name..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Last Maintenance</label>
                <input type="date" value={form.last_maintenance} onChange={f('last_maintenance')} className="input w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Notes</label>
                <textarea value={form.notes} onChange={f('notes')} className="input w-full h-20 resize-none" placeholder="Any notes..." />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.name.trim()} className="btn-primary flex-1">
            {saving ? 'Saving…' : item.id ? 'Save Changes' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

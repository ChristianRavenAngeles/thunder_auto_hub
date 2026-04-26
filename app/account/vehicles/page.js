'use client'

import { useEffect, useState } from 'react'
import { Car, Check, Edit2, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const EMPTY_FORM = { make: '', model: '', year: '', plate: '', color: '', tier: 'M' }
const TIERS = [
  { value: 'S', label: 'Small' },
  { value: 'M', label: 'Medium' },
  { value: 'L', label: 'Large' },
  { value: 'XL', label: 'Extra Large' },
]

export default function VehiclesPage() {
  const [supabase] = useState(() => createClient())
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('vehicles').select('*').eq('user_id', user.id).order('created_at')
    setVehicles(data || [])
    setLoading(false)
  }

  function resetForm() {
    setAdding(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  async function save() {
    if (!form.make || !form.model || !form.tier) return toast.error('Make, model, and tier are required.')
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      make: form.make,
      model: form.model,
      year: form.year ? Number(form.year) : null,
      plate: form.plate || null,
      color: form.color || null,
      tier: form.tier,
    }

    if (editId) {
      await supabase.from('vehicles').update(payload).eq('id', editId)
      toast.success('Vehicle updated.')
    } else {
      await supabase.from('vehicles').insert({ ...payload, user_id: user.id })
      toast.success('Vehicle added.')
    }

    resetForm()
    load()
  }

  async function remove(id) {
    if (!confirm('Remove this vehicle?')) return
    await supabase.from('vehicles').delete().eq('id', id)
    toast.success('Vehicle removed.')
    load()
  }

  function startEdit(vehicle) {
    setForm({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      plate: vehicle.plate || '',
      color: vehicle.color || '',
      tier: vehicle.tier || 'M',
    })
    setEditId(vehicle.id)
    setAdding(true)
  }

  if (loading) return <div className="p-6 text-[var(--text-muted)] text-sm">Loading...</div>

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">My Vehicles</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Manage the cars you want serviced.</p>
        </div>
        <button onClick={() => { setAdding(true); setEditId(null); setForm(EMPTY_FORM) }} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {adding && (
        <div className="card p-5 mb-5 border-brand-200">
          <h3 className="font-semibold text-thunder-dark mb-4">{editId ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Make</label><input className="input" placeholder="Toyota" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} /></div>
            <div><label className="label">Model</label><input className="input" placeholder="Fortuner" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></div>
            <div><label className="label">Year</label><input className="input" placeholder="2022" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} /></div>
            <div><label className="label">Plate Number</label><input className="input" placeholder="ABC 1234" value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))} /></div>
            <div><label className="label">Color</label><input className="input" placeholder="White" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div>
            <div>
              <label className="label">Tier</label>
              <select className="input" value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
                {TIERS.map(t => <option key={t.value} value={t.value}>{t.value} - {t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={save} className="btn-primary flex items-center gap-1"><Check className="w-4 h-4" /> Save</button>
            <button onClick={resetForm} className="btn-secondary flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {vehicles.length === 0 && !adding ? (
        <div className="card p-12 text-center">
          <Car className="w-10 h-10 text-[var(--text-2)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)] font-medium">Walang sasakyan pa</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">Idagdag ang inyong sasakyan para mas mabilis ang booking.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-brand-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-thunder-dark">{v.make} {v.model} {v.year && `(${v.year})`}</p>
                <p className="text-sm text-[var(--text-muted)]">{v.plate || 'No plate'} - {v.color || '-'} - {v.tier || 'M'}</p>
              </div>
              <div className="flex gap-1 self-end sm:self-auto">
                <button onClick={() => startEdit(v)} className="p-2 text-[var(--text-muted)] hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => remove(v.id)} className="p-2 text-[var(--text-muted)] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

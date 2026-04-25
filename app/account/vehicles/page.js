'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Car, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Pickup', 'Van', 'Hatchback', 'Crossover', 'Coupe', 'Truck']

export default function VehiclesPage() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [editId, setEditId]     = useState(null)
  const [form, setForm]         = useState({ make: '', model: '', year: '', plate_number: '', color: '', vehicle_type: 'Sedan' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('vehicles').select('*').eq('user_id', user.id).order('created_at')
    setVehicles(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.make || !form.model) return toast.error('Make and model are required.')
    const { data: { user } } = await supabase.auth.getUser()
    if (editId) {
      await supabase.from('vehicles').update(form).eq('id', editId)
      toast.success('Vehicle updated.')
    } else {
      await supabase.from('vehicles').insert({ ...form, user_id: user.id })
      toast.success('Vehicle added.')
    }
    setAdding(false); setEditId(null); setForm({ make: '', model: '', year: '', plate_number: '', color: '', vehicle_type: 'Sedan' })
    load()
  }

  async function remove(id) {
    if (!confirm('Remove this vehicle?')) return
    await supabase.from('vehicles').delete().eq('id', id)
    toast.success('Vehicle removed.')
    load()
  }

  function startEdit(v) {
    setForm({ make: v.make, model: v.model, year: v.year || '', plate_number: v.plate_number || '', color: v.color || '', vehicle_type: v.vehicle_type || 'Sedan' })
    setEditId(v.id); setAdding(true)
  }

  if (loading) return <div className="p-6 text-[var(--text-muted)] text-sm">Loading...</div>

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">My Vehicles</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Manage the cars you want serviced.</p>
        </div>
        <button onClick={() => { setAdding(true); setEditId(null); setForm({ make: '', model: '', year: '', plate_number: '', color: '', vehicle_type: 'Sedan' }) }} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
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
            <div><label className="label">Plate Number</label><input className="input" placeholder="ABC 1234" value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} /></div>
            <div><label className="label">Color</label><input className="input" placeholder="White" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}>
                {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={save} className="btn-primary flex items-center gap-1"><Check className="w-4 h-4" /> Save</button>
            <button onClick={() => { setAdding(false); setEditId(null) }} className="btn-secondary flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
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
                <p className="text-sm text-[var(--text-muted)]">{v.plate_number || 'No plate'} · {v.color || '—'} · {v.vehicle_type}</p>
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

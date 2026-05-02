'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Car, Check, Edit2, Plus, RefreshCw, Star, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'
import { inferRecommendedService } from '@/lib/serviceRecommendations'

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
  const [historyByVehicle, setHistoryByVehicle] = useState({})
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('vehicles').select('*').eq('user_id', user.id).order('created_at')
    const vehicleRows = data || []
    setVehicles(vehicleRows)

    if (vehicleRows.length) {
      const vehicleIds = vehicleRows.map(vehicle => vehicle.id)
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, vehicle_id, reference_no, status, scheduled_date, total_price, booking_services(service_name, services(category, slug)), photos(id, url, type, is_public), reviews(id, rating, comment, created_at)')
        .eq('user_id', user.id)
        .in('vehicle_id', vehicleIds)
        .order('scheduled_date', { ascending: false })

      const grouped = (bookings || []).reduce((acc, booking) => {
        if (!acc[booking.vehicle_id]) acc[booking.vehicle_id] = []
        acc[booking.vehicle_id].push(booking)
        return acc
      }, {})
      setHistoryByVehicle(grouped)
    } else {
      setHistoryByVehicle({})
    }

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
            <div key={v.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Car className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-thunder-dark">{v.make} {v.model} {v.year && `(${v.year})`}</p>
                  <p className="text-sm text-[var(--text-muted)]">{v.plate || 'No plate'} - {v.color || '-'} - {v.tier || 'M'}</p>
                  <VehicleHistorySummary history={historyByVehicle[v.id] || []} />
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
              <VehicleHistoryPanel vehicle={v} history={historyByVehicle[v.id] || []} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VehicleHistorySummary({ history }) {
  const completed = history.filter(item => item.status === 'completed')
  const lastCompleted = completed[0]

  return (
    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
      <span>{completed.length} completed service{completed.length === 1 ? '' : 's'}</span>
      <span>{lastCompleted ? `Last serviced ${formatDate(lastCompleted.scheduled_date)}` : 'No completed history yet'}</span>
    </div>
  )
}

function VehicleHistoryPanel({ vehicle, history }) {
  const completed = history.filter(item => item.status === 'completed')
  const latest = completed[0]
  const recommendation = inferRecommendedService(latest?.booking_services?.map(service => ({
    service_name: service.service_name,
    category: service.services?.category,
  })) || [])
  const recent = completed.slice(0, 3)

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-4">
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-thunder-dark">Service History</h3>
            {latest && (
              <Link href={`/book?rebook=${latest.id}`} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Rebook
              </Link>
            )}
          </div>
          {!recent.length ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
              Completed services will appear here after your first finished booking.
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(item => {
                const beforePhotos = (item.photos || []).filter(photo => photo.is_public && photo.type === 'before')
                const afterPhotos = (item.photos || []).filter(photo => photo.is_public && photo.type === 'after')
                const review = item.reviews?.[0]
                return (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-thunder-dark">{item.booking_services?.map(service => service.service_name).join(', ') || 'Service completed'}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{formatDate(item.scheduled_date)} • {item.reference_no}</p>
                      </div>
                      <p className="text-sm font-semibold text-brand-600">{formatPrice(item.total_price || 0)}</p>
                    </div>
                    {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <PhotoStrip title="Before" photos={beforePhotos} />
                        <PhotoStrip title="After" photos={afterPhotos} />
                      </div>
                    )}
                    {review && (
                      <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-[var(--text-2)]">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-500"><Star className="w-3 h-3 fill-current" /> {review.rating}/5</span>
                        {review.comment ? <span className="ml-2">{review.comment}</span> : null}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 mb-2">Recommended Next Service</p>
          <p className="text-sm font-semibold text-thunder-dark">{recommendation.title}</p>
          <p className="text-xs text-[var(--text-2)] mt-2 leading-relaxed">{recommendation.description}</p>
          <Link href={`/book?service=${recommendation.slug}&rebook=${latest?.id || ''}`} className="btn-primary !py-2 !px-3 !text-xs inline-flex items-center gap-1 mt-4">
            Book Recommendation
          </Link>
        </div>
      </div>
    </div>
  )
}

function PhotoStrip({ title, photos }) {
  if (!photos.length) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-5 text-center text-[11px] text-[var(--text-muted)]">
        {title}: no photos
      </div>
    )
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {photos.slice(0, 2).map(photo => (
          <img key={photo.id} src={photo.url} alt={title} className="rounded-lg h-20 w-full object-cover" />
        ))}
      </div>
    </div>
  )
}

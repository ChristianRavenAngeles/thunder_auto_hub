import { revalidatePath } from 'next/cache'
import { MapPin, Plus, Save, Trash2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { safeInsertAuditLog } from '@/lib/audit'
import { formatDistanceLabel, formatTravelFeeLabel } from '@/lib/serviceAreas'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Service Areas - Admin' }

const STAFF_ROLES = ['admin', 'manager', 'staff', 'super_admin']

async function requireStaffUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!STAFF_ROLES.includes(profile?.role)) return null

  return user
}

function parseNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

async function saveServiceArea(formData) {
  'use server'

  const user = await requireStaffUser()
  if (!user) return

  const admin = createAdminClient()
  const id = String(formData.get('id') || '').trim()
  const barangay = String(formData.get('barangay') || '').trim()
  const city = String(formData.get('city') || '').trim()
  if (!barangay || !city) return

  const payload = {
    barangay,
    city,
    province: String(formData.get('province') || 'Pampanga').trim() || 'Pampanga',
    distance_km: parseNumber(formData.get('distance_km')),
    travel_fee: parseNumber(formData.get('travel_fee')),
    is_serviceable: formData.get('is_serviceable') === 'on',
  }

  if (id) {
    const { data: existing } = await admin.from('service_areas').select('*').eq('id', id).single()
    await admin.from('service_areas').update(payload).eq('id', id)
    await safeInsertAuditLog(admin, {
      user_id: user.id,
      action: 'service_area_updated',
      table_name: 'service_areas',
      record_id: id,
      old_data: existing || null,
      new_data: payload,
    })
  } else {
    const { data: inserted } = await admin.from('service_areas').insert(payload).select('*').single()
    await safeInsertAuditLog(admin, {
      user_id: user.id,
      action: 'service_area_created',
      table_name: 'service_areas',
      record_id: inserted?.id || null,
      new_data: payload,
    })
  }

  revalidatePath('/admin/service-areas')
  revalidatePath('/book')
}

async function deleteServiceArea(formData) {
  'use server'

  const user = await requireStaffUser()
  if (!user) return

  const id = String(formData.get('id') || '').trim()
  if (!id) return

  const admin = createAdminClient()
  const { data: existing } = await admin.from('service_areas').select('*').eq('id', id).single()
  if (!existing) return

  await admin.from('service_areas').delete().eq('id', id)
  await safeInsertAuditLog(admin, {
    user_id: user.id,
    action: 'service_area_deleted',
    table_name: 'service_areas',
    record_id: id,
    old_data: existing,
  })

  revalidatePath('/admin/service-areas')
  revalidatePath('/book')
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.12em', color: '#666', marginBottom: 5 }}>
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  )
}

const inputStyle = {
  width: '100%',
  minHeight: 40,
  background: '#1C1C1C',
  border: '1px solid #2A2A2A',
  borderRadius: 8,
  color: '#FFFFFF',
  padding: '9px 11px',
  fontSize: 13,
  outline: 'none',
}

function ServiceAreaForm({ area }) {
  const isNew = !area?.id

  return (
    <form action={saveServiceArea} style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: 18 }}>
      {area?.id && <input type="hidden" name="id" value={area.id} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 18, letterSpacing: '.06em', color: '#FFFFFF' }}>
            {isNew ? 'ADD SERVICE AREA' : `${area.barangay.toUpperCase()}, ${area.city.toUpperCase()}`}
          </div>
          {!isNew && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
              {formatDistanceLabel(area.distance_km)} · {formatTravelFeeLabel(area.travel_fee)} surcharge
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isNew && (
            <button type="submit" formAction={deleteServiceArea} title="Delete" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #2A2A2A', background: '#1C1C1C', color: '#F87171', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <Trash2 size={14} />
            </button>
          )}
          <button type="submit" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: '#FFD200',
            color: '#0B0B0B',
            border: 'none',
            borderRadius: 8,
            padding: '9px 14px',
            cursor: 'pointer',
            fontFamily: 'var(--font-cond)',
            fontWeight: 700,
            letterSpacing: '.08em',
            fontSize: 12,
          }}>
            <Save size={14} /> SAVE
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
        <Field label="Barangay">
          <input name="barangay" required defaultValue={area?.barangay || ''} style={inputStyle} />
        </Field>
        <Field label="City / Municipality">
          <input name="city" required defaultValue={area?.city || ''} style={inputStyle} />
        </Field>
        <Field label="Province">
          <input name="province" defaultValue={area?.province || 'Pampanga'} style={inputStyle} />
        </Field>
        <Field label="Distance KM">
          <input name="distance_km" type="number" min="0" step="0.5" defaultValue={area?.distance_km ?? 0} style={inputStyle} />
        </Field>
        <Field label="Travel Fee">
          <input name="travel_fee" type="number" min="0" step="1" defaultValue={area?.travel_fee ?? 0} style={inputStyle} />
        </Field>
      </div>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#CFCFCF', fontSize: 13, marginTop: 14 }}>
        <input type="checkbox" name="is_serviceable" defaultChecked={area?.is_serviceable ?? true} />
        Allow customer bookings in this area
      </label>
    </form>
  )
}

export default async function AdminServiceAreasPage() {
  const admin = createAdminClient()
  const { data: areas } = await admin
    .from('service_areas')
    .select('*')
    .order('city', { ascending: true })
    .order('barangay', { ascending: true })

  const rows = areas || []
  const serviceableCount = rows.filter(area => area.is_serviceable).length
  const blockedCount = rows.length - serviceableCount
  const totalSurcharge = rows.reduce((sum, area) => sum + Number(area.travel_fee || 0), 0)

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 28, letterSpacing: '.04em', color: '#FFFFFF', margin: 0 }}>
            SERVICE AREA CONTROL
          </h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            Control serviceable barangays, travel surcharges, and customer booking coverage.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#CFCFCF', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 12px' }}>
          <MapPin size={16} color="#FFD200" />
          <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.08em', fontSize: 12 }}>{serviceableCount} ACTIVE AREAS</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          ['Total Areas', rows.length],
          ['Serviceable', serviceableCount],
          ['Blocked', blockedCount],
          ['Total Surcharge', `PHP ${totalSurcharge.toLocaleString()}`],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#666', letterSpacing: '.08em', fontFamily: 'var(--font-cond)' }}>{label.toUpperCase()}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#FFFFFF', marginTop: 6 }}>{value}</div>
          </div>
        ))}
      </div>

      <details style={{ marginBottom: 18 }}>
        <summary style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFD200', color: '#0B0B0B', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.08em', fontSize: 13 }}>
          <Plus size={14} /> ADD NEW AREA
        </summary>
        <div style={{ marginTop: 12 }}>
          <ServiceAreaForm />
        </div>
      </details>

      <div style={{ display: 'grid', gap: 14 }}>
        {rows.map(area => <ServiceAreaForm key={area.id} area={area} />)}
        {!rows.length && (
          <div style={{ padding: 40, background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, color: '#666', textAlign: 'center' }}>
            No service areas yet.
          </div>
        )}
      </div>
    </div>
  )
}

import { revalidatePath } from 'next/cache'
import { Package, Plus, Save } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice } from '@/lib/pricing'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Services & Pricing - Admin' }

const CATEGORIES = [
  ['wash', 'Wash'],
  ['detailing', 'Detailing'],
  ['coating', 'Coating'],
  ['maintenance', 'Maintenance'],
]

const TIERS = ['S', 'M', 'L', 'XL']

function makeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function parseInclusions(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean)
}

async function saveService(formData) {
  'use server'

  const admin = createAdminClient()
  const id = formData.get('id')
  const name = String(formData.get('name') || '').trim()
  if (!name) return

  const payload = {
    name,
    slug: makeSlug(formData.get('slug') || name),
    category: formData.get('category') || 'wash',
    description: String(formData.get('description') || '').trim() || null,
    inclusions: parseInclusions(formData.get('inclusions')),
    duration_hours: parseNumber(formData.get('duration_hours')),
    price_s: parseNumber(formData.get('price_s')),
    price_m: parseNumber(formData.get('price_m')),
    price_l: parseNumber(formData.get('price_l')),
    price_xl: parseNumber(formData.get('price_xl')),
    has_travel_fee: formData.get('has_travel_fee') === 'on',
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') || 0),
    updated_at: new Date().toISOString(),
  }

  if (id) {
    await admin.from('services').update(payload).eq('id', id)
  } else {
    await admin.from('services').insert(payload)
  }

  revalidatePath('/admin/services')
  revalidatePath('/services')
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

function ServiceForm({ service }) {
  const isNew = !service?.id
  const inclusions = Array.isArray(service?.inclusions) ? service.inclusions.join('\n') : ''

  return (
    <form action={saveService} style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: 18 }}>
      {service?.id && <input type="hidden" name="id" value={service.id} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 18, letterSpacing: '.06em', color: '#FFFFFF' }}>
            {isNew ? 'ADD SERVICE' : service.name.toUpperCase()}
          </div>
          {!isNew && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
              {TIERS.map(tier => formatPrice(service[`price_${tier.toLowerCase()}`] || 0)).join(' / ')}
            </div>
          )}
        </div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
        <Field label="Name">
          <input name="name" required defaultValue={service?.name || ''} style={inputStyle} />
        </Field>
        <Field label="Slug">
          <input name="slug" defaultValue={service?.slug || ''} placeholder="auto from name" style={inputStyle} />
        </Field>
        <Field label="Category">
          <select name="category" defaultValue={service?.category || 'wash'} style={inputStyle}>
            {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Duration Hours">
          <input name="duration_hours" type="number" step="0.5" min="0" defaultValue={service?.duration_hours || ''} style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginTop: 12 }}>
        {TIERS.map(tier => (
          <Field key={tier} label={`${tier} Price`}>
            <input name={`price_${tier.toLowerCase()}`} type="number" min="0" step="1" defaultValue={service?.[`price_${tier.toLowerCase()}`] || ''} style={inputStyle} />
          </Field>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <Field label="Description">
          <textarea name="description" rows={2} defaultValue={service?.description || ''} style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>
      </div>

      <div style={{ marginTop: 12 }}>
        <Field label="Inclusions">
          <textarea name="inclusions" rows={4} defaultValue={inclusions} placeholder="One item per line" style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 14 }}>
        <Field label="Sort Order">
          <input name="sort_order" type="number" defaultValue={service?.sort_order ?? 0} style={{ ...inputStyle, width: 110 }} />
        </Field>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#CFCFCF', fontSize: 13, marginTop: 18 }}>
          <input type="checkbox" name="has_travel_fee" defaultChecked={service?.has_travel_fee ?? true} />
          Travel fee applies
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#CFCFCF', fontSize: 13, marginTop: 18 }}>
          <input type="checkbox" name="is_active" defaultChecked={service?.is_active ?? true} />
          Active
        </label>
      </div>
    </form>
  )
}

export default async function AdminServicesPage() {
  const admin = createAdminClient()
  const { data: services } = await admin.from('services').select('*').order('sort_order').order('name')
  const activeCount = (services || []).filter(service => service.is_active).length

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 28, letterSpacing: '.04em', color: '#FFFFFF', margin: 0 }}>
            SERVICES & PRICING
          </h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            Manage customer-facing services, tier prices, inclusions, duration, and travel fee rules.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#CFCFCF', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 12px' }}>
          <Package size={16} color="#FFD200" />
          <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.08em', fontSize: 12 }}>{activeCount} ACTIVE</span>
        </div>
      </div>

      <details style={{ marginBottom: 18 }}>
        <summary style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFD200', color: '#0B0B0B', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.08em', fontSize: 13 }}>
          <Plus size={14} /> ADD NEW SERVICE
        </summary>
        <div style={{ marginTop: 12 }}>
          <ServiceForm />
        </div>
      </details>

      <div style={{ display: 'grid', gap: 14 }}>
        {(services || []).map(service => <ServiceForm key={service.id} service={service} />)}
        {!services?.length && (
          <div style={{ padding: 40, background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, color: '#666', textAlign: 'center' }}>
            No services yet.
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { displayTime, normalizeTime } from '@/lib/availability'

/* ─── static data ─── */
const TIERS = [
  { id: 'S',  label: 'S',  name: 'Small',       sub: 'Subcompact sedan / hatchback' },
  { id: 'M',  label: 'M',  name: 'Medium',       sub: 'Compact sedan / small SUV / MPV' },
  { id: 'L',  label: 'L',  name: 'Large',        sub: 'Mid-size SUV / pickup truck' },
  { id: 'XL', label: 'XL', name: 'Extra Large',  sub: 'Full-size SUV / van' },
]

const SERVICES = {
  S: [
    { name: 'Basic Wash',           cat: 'Wash',    price: 299 },
    { name: 'Premium Wash',         cat: 'Wash',    price: 499 },
    { name: 'Interior Detailing',   cat: 'Detail',  price: 799 },
    { name: 'Exterior Detailing',   cat: 'Detail',  price: 899 },
    { name: 'Full Detailing',       cat: 'Detail',  price: 1499 },
    { name: 'Paint Correction',     cat: 'Detail',  price: 1999 },
    { name: 'Odor Removal',         cat: 'Detail',  price: 699 },
    { name: 'Headlight Restore',    cat: 'Detail',  price: 499 },
    { name: 'Ceramic Coating',      cat: 'Coating', price: 2999, orig: 3999 },
    { name: 'Graphene Coating',     cat: 'Coating', price: 4499, orig: 5999 },
  ],
  M: [
    { name: 'Basic Wash',           cat: 'Wash',    price: 399 },
    { name: 'Premium Wash',         cat: 'Wash',    price: 649 },
    { name: 'Interior Detailing',   cat: 'Detail',  price: 999 },
    { name: 'Exterior Detailing',   cat: 'Detail',  price: 1099 },
    { name: 'Full Detailing',       cat: 'Detail',  price: 1899 },
    { name: 'Paint Correction',     cat: 'Detail',  price: 2499 },
    { name: 'Odor Removal',         cat: 'Detail',  price: 799 },
    { name: 'Headlight Restore',    cat: 'Detail',  price: 499 },
    { name: 'Ceramic Coating',      cat: 'Coating', price: 3749, orig: 4999 },
    { name: 'Graphene Coating',     cat: 'Coating', price: 5624, orig: 7499 },
  ],
  L: [
    { name: 'Basic Wash',           cat: 'Wash',    price: 499 },
    { name: 'Premium Wash',         cat: 'Wash',    price: 799 },
    { name: 'Interior Detailing',   cat: 'Detail',  price: 1199 },
    { name: 'Exterior Detailing',   cat: 'Detail',  price: 1299 },
    { name: 'Full Detailing',       cat: 'Detail',  price: 2299 },
    { name: 'Paint Correction',     cat: 'Detail',  price: 2999 },
    { name: 'Odor Removal',         cat: 'Detail',  price: 899 },
    { name: 'Headlight Restore',    cat: 'Detail',  price: 499 },
    { name: 'Ceramic Coating',      cat: 'Coating', price: 4499, orig: 5999 },
    { name: 'Graphene Coating',     cat: 'Coating', price: 6749, orig: 8999 },
  ],
  XL: [
    { name: 'Basic Wash',           cat: 'Wash',    price: 599 },
    { name: 'Premium Wash',         cat: 'Wash',    price: 999 },
    { name: 'Interior Detailing',   cat: 'Detail',  price: 1499 },
    { name: 'Exterior Detailing',   cat: 'Detail',  price: 1599 },
    { name: 'Full Detailing',       cat: 'Detail',  price: 2799 },
    { name: 'Paint Correction',     cat: 'Detail',  price: 3499 },
    { name: 'Odor Removal',         cat: 'Detail',  price: 999 },
    { name: 'Headlight Restore',    cat: 'Detail',  price: 499 },
    { name: 'Ceramic Coating',      cat: 'Coating', price: 5249, orig: 6999 },
    { name: 'Graphene Coating',     cat: 'Coating', price: 7874, orig: 10499 },
  ],
}

const SERVICE_AREA = [
  { city: 'Arayat',      km: '0 km',   fee: 'FREE' },
  { city: 'San Luis',    km: '8 km',   fee: '₱150' },
  { city: 'Mexico',      km: '12 km',  fee: '₱200' },
  { city: 'Magalang',    km: '14 km',  fee: '₱200' },
  { city: 'Candaba',     km: '15 km',  fee: '₱200' },
  { city: 'Sta. Ana',    km: '16 km',  fee: '₱250' },
  { city: 'San Simon',   km: '18 km',  fee: '₱250' },
  { city: 'Minalin',     km: '20 km',  fee: '₱300' },
  { city: 'Guagua',      km: '22 km',  fee: '₱300' },
  { city: 'Bacolor',     km: '24 km',  fee: '₱350' },
  { city: 'Angeles',     km: '25 km',  fee: '₱350' },
]

const STEPS = [
  { id: 1, icon: '🚗', label: 'Sasakyan' },
  { id: 2, icon: '✦',  label: 'Serbisyo' },
  { id: 3, icon: '📍', label: 'Lokasyon' },
  { id: 4, icon: '📅', label: 'Iskedyul' },
  { id: 5, icon: '✓',  label: 'Kumpirmasyon' },
]

const CAT_COLORS = { Wash: '#FFD200', Detail: '#A78BFA', Detailing: '#A78BFA', Coating: '#22C55E', Maintenance: '#60A5FA' }
const DB_CATEGORY_LABELS = { wash: 'Wash', detailing: 'Detailing', coating: 'Coating', maintenance: 'Maintenance' }

function serviceCategory(svc) {
  return svc.cat || DB_CATEGORY_LABELS[svc.category] || 'Maintenance'
}

function serviceUsesTravelFee(svc) {
  if (typeof svc.has_travel_fee === 'boolean') return svc.has_travel_fee
  return serviceCategory(svc) === 'Wash'
}

function buildServiceCatalog(rows = []) {
  const catalog = { S: [], M: [], L: [], XL: [] }
  const tiers = ['S', 'M', 'L', 'XL']
  rows.forEach(svc => {
    tiers.forEach(tier => {
      const price = Number(svc[`price_${tier.toLowerCase()}`] || 0)
      if (price > 0) {
        catalog[tier].push({
          id: svc.id,
          slug: svc.slug,
          name: svc.name,
          category: svc.category,
          cat: DB_CATEGORY_LABELS[svc.category] || svc.category,
          price,
          description: svc.description,
          duration_hours: svc.duration_hours,
          has_travel_fee: svc.has_travel_fee,
        })
      }
    })
  })
  return catalog
}

/* ─── sub-components ─── */

function Arrow({ size = 18, dir = 'right' }) {
  const paths = {
    right: 'M5 12h14M12 5l7 7-7 7',
    left:  'M19 12H5M12 5l-7 7 7 7',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d={paths[dir]} />
    </svg>
  )
}

function StepBar({ step, onGoTo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 48, gap: 0 }}>
      {STEPS.map((s, i) => {
        const done   = step > s.id
        const active = step === s.id
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1 1 0' : '0 0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => done && onGoTo(s.id)}
                disabled={!done}
                title={done ? `Go back to ${s.label}` : undefined}
                style={{
                  width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done || active ? '#FFD200' : '#1A1A1A',
                  border: `2px solid ${done || active ? '#FFD200' : '#3A3A3A'}`,
                  fontSize: 16, color: done || active ? '#0B0B0B' : '#777',
                  fontFamily: 'var(--font-cond)', fontWeight: 700, transition: 'all .3s',
                  boxShadow: active ? '0 0 24px rgba(255,210,0,.3)' : 'none',
                  cursor: done ? 'pointer' : 'default',
                  padding: 0, flexShrink: 0,
                }}>
                {done
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                  : s.icon}
              </button>
              <span style={{
                fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 700, letterSpacing: '.06em',
                color: active ? '#FFD200' : done ? '#CFCFCF' : '#777', transition: 'color .3s',
                whiteSpace: 'nowrap',
                cursor: done ? 'pointer' : 'default',
              }}
                onClick={() => done && onGoTo(s.id)}
              >{s.label.toUpperCase()}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#FFD200' : '#3A3A3A', marginBottom: 22, transition: 'background .3s', minWidth: 16 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label style={{ fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: '.14em', color: '#CFCFCF', marginBottom: 8, display: 'block' }}>
      {children}{required && <span style={{ color: '#F87171', marginLeft: 2 }}>*</span>}
    </label>
  )
}

const inputStyle = (error) => ({
  width: '100%', height: 52, background: '#1A1A1A', border: `1.5px solid ${error ? 'rgba(248,113,113,.5)' : '#3A3A3A'}`,
  borderRadius: 10, color: '#FFFFFF', padding: '0 16px', fontSize: 15,
  fontFamily: 'var(--font-barlow)', transition: 'border-color .15s', outline: 'none',
})

/* ─── Step 1 ─── */
function Step1({ vehicle, setVehicle, errors, savedVehicles }) {
  return (
    <div style={{ animation: 'bk-pop .4s ease both' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, marginBottom: 6, color: '#FFFFFF' }}>SASAKYAN</h2>
        <p style={{ fontSize: 14, color: '#CFCFCF' }}>Ilagay ang detalye ng inyong sasakyan para makuha ang tamang presyo.</p>
      </div>

      {savedVehicles?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <FieldLabel>MY SAVED VEHICLES</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {savedVehicles.map(v => {
              const selected = vehicle.savedId === v.id
              return (
                <button key={v.id} type="button"
                  onClick={() => setVehicle({ brand: v.make, model: v.model, year: v.year || '', plate: v.plate || '', tier: v.tier || '', savedId: v.id })}
                  style={{
                    padding: '10px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    border: `1.5px solid ${selected ? '#FFD200' : '#3A3A3A'}`,
                    background: selected ? 'rgba(255,210,0,.1)' : '#1A1A1A',
                  }}>
                  <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, color: selected ? '#FFD200' : '#FFFFFF', letterSpacing: '.04em' }}>
                    {v.make} {v.model}
                  </div>
                  {v.plate && <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>{v.plate}</div>}
                </button>
              )
            })}
            <button type="button"
              onClick={() => setVehicle({ brand: '', model: '', year: '', plate: '', tier: '', savedId: null })}
              style={{
                padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                border: '1.5px dashed #3A3A3A', background: 'transparent',
                fontFamily: 'var(--font-cond)', fontSize: 12, color: '#777', letterSpacing: '.06em',
              }}>
              + DIFFERENT CAR
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        {[
          { key: 'brand', label: 'Car Brand / Make', placeholder: 'Toyota, Honda, Ford...', required: true },
          { key: 'model', label: 'Model',            placeholder: 'Fortuner, Vios, Ranger...', required: true },
          { key: 'year',  label: 'Year',             placeholder: '2020', maxLength: 4 },
          { key: 'plate', label: 'Plate Number',     placeholder: 'ABC 1234' },
        ].map(f => (
          <div key={f.key} style={{ flex: '1 1 240px' }}>
            <FieldLabel required={f.required}>{f.label}</FieldLabel>
            <input
              style={inputStyle(errors[f.key])}
              placeholder={f.placeholder}
              value={vehicle[f.key]}
              maxLength={f.maxLength}
              onChange={e => setVehicle({ ...vehicle, [f.key]: f.key === 'plate' ? e.target.value.toUpperCase() : e.target.value })}
              onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.5)'}
              onBlur={e => e.target.style.borderColor = errors[f.key] ? 'rgba(248,113,113,.5)' : '#3A3A3A'}
            />
            {errors[f.key] && <div style={{ fontSize: 12, color: '#F87171', marginTop: 5, fontFamily: 'var(--font-cond)', letterSpacing: '.06em' }}>{errors[f.key]}</div>}
          </div>
        ))}
      </div>

      <div>
        <FieldLabel required>Vehicle Size</FieldLabel>
        {errors.tier && <div style={{ fontSize: 12, color: '#F87171', marginBottom: 8, fontFamily: 'var(--font-cond)', letterSpacing: '.06em' }}>{errors.tier}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {TIERS.map(t => (
            <button key={t.id} onClick={() => setVehicle({ ...vehicle, tier: t.id })} type="button" style={{
              padding: '14px 12px', borderRadius: 10,
              border: `2px solid ${vehicle.tier === t.id ? '#FFD200' : '#3A3A3A'}`,
              background: vehicle.tier === t.id ? 'rgba(255,210,0,.1)' : '#1A1A1A',
              cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
              boxShadow: vehicle.tier === t.id ? '0 0 18px rgba(255,210,0,.15)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: vehicle.tier === t.id ? '#FFD200' : '#FFFFFF', lineHeight: 1, marginBottom: 4 }}>{t.label}</div>
              <div style={{ fontFamily: 'var(--font-cond)', fontSize: 13, fontWeight: 700, color: vehicle.tier === t.id ? '#FFD200' : '#CFCFCF', marginBottom: 3 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#777', lineHeight: 1.4 }}>{t.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Step 2 ─── */
function Step2({ vehicle, services, setServices, errors, serviceCatalog }) {
  const list = serviceCatalog[vehicle.tier] || []
  const wash        = list.filter(s => serviceCategory(s) === 'Wash')
  const detail      = list.filter(s => ['Detail', 'Detailing'].includes(serviceCategory(s)))
  const coating     = list.filter(s => serviceCategory(s) === 'Coating')
  const maintenance = list.filter(s => serviceCategory(s) === 'Maintenance')

  const toggle = (name) => {
    setServices(services.includes(name) ? services.filter(s => s !== name) : [...services, name])
  }
  const total = services.reduce((sum, name) => {
    const s = list.find(x => x.name === name)
    return sum + (s ? s.price : 0)
  }, 0)

  function ServiceCard({ s, accent }) {
    const on = services.includes(s.name)
    return (
      <button onClick={() => toggle(s.name)} type="button" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderRadius: 12,
        border: `1.5px solid ${on ? '#FFD200' : '#3A3A3A'}`,
        background: on ? 'rgba(255,210,0,.07)' : '#222',
        cursor: 'pointer', textAlign: 'left', transition: 'all .15s', width: '100%', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 5,
            border: `2px solid ${on ? '#FFD200' : '#3A3A3A'}`,
            background: on ? '#FFD200' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s',
          }}>
            {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 15, color: on ? '#FFFFFF' : '#CFCFCF', letterSpacing: '.04em' }}>{s.name}</div>
            {(s.note || s.description) && <div style={{ fontSize: 11, color: '#777', marginTop: 1 }}>{s.note || s.description}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {s.orig && <div style={{ fontSize: 11, color: '#777', textDecoration: 'line-through', fontFamily: 'var(--font-cond)' }}>₱{s.orig.toLocaleString()}</div>}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: on ? '#FFD200' : (accent || '#FFFFFF'), transition: 'color .15s' }}>₱{s.price.toLocaleString()}</div>
        </div>
      </button>
    )
  }

  function Cat({ title, items, accent, icon }) {
    if (!items.length) return null
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '.1em', color: '#CFCFCF' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(s => <ServiceCard key={s.name} s={s} accent={accent} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'bk-pop .4s ease both' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, marginBottom: 6, color: '#FFFFFF' }}>SERBISYO</h2>
        <p style={{ fontSize: 14, color: '#CFCFCF' }}>Pumili ng isa o higit pang serbisyo para sa inyong <span style={{ color: '#FFD200', fontWeight: 600 }}>{vehicle.brand} {vehicle.model}</span>.</p>
      </div>
      {errors.services && (
        <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#F87171', fontFamily: 'var(--font-cond)', fontWeight: 600, letterSpacing: '.06em' }}>
          Pumili ng kahit isang serbisyo.
        </div>
      )}
      <Cat title="WASH SERVICES"        icon="💧" items={wash} />
      <Cat title="DETAILING SERVICES"   icon="✨" items={detail}  accent="#A78BFA" />
      <Cat title="COATING SERVICES"     icon="🛡" items={coating} accent="#22C55E" />
      <Cat title="MAINTENANCE SERVICES" icon="⚙" items={maintenance} accent="#60A5FA" />
      {services.length > 0 && (
        <div style={{ background: 'rgba(255,210,0,.08)', border: '1px solid rgba(255,210,0,.25)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: 14, fontWeight: 700, letterSpacing: '.08em', color: '#CFCFCF' }}>{services.length} serbisyo napili</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: '#FFD200' }}>₱{total.toLocaleString()}</div>
        </div>
      )}
    </div>
  )
}

/* ─── Step 3 ─── */
function Step3({ location, setLocation, errors, vehicle, services, serviceCatalog }) {
  const [fee, setFee] = useState(null)

  const checkCity = (city) => {
    setLocation({ ...location, city })
    const found = SERVICE_AREA.find(a => a.city.toLowerCase() === city.toLowerCase())
    setFee(found || null)
  }

  const hasTravelFee = (serviceCatalog[vehicle.tier] || [])
    .some(s => services.includes(s.name) && serviceUsesTravelFee(s))

  return (
    <div style={{ animation: 'bk-pop .4s ease both' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, marginBottom: 6, color: '#FFFFFF' }}>LOKASYON</h2>
        <p style={{ fontSize: 14, color: '#CFCFCF' }}>Saang lugar namin dadalhan ang serbisyo? Ilagay ang eksaktong address.</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: '0 0 calc(50% - 8px)' }}>
          <FieldLabel required>Barangay</FieldLabel>
          <input
            style={inputStyle(errors.barangay)}
            placeholder="Inyong barangay..."
            value={location.barangay}
            onChange={e => setLocation({ ...location, barangay: e.target.value })}
            onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.5)'}
            onBlur={e => e.target.style.borderColor = errors.barangay ? 'rgba(248,113,113,.5)' : '#3A3A3A'}
          />
          {errors.barangay && <div style={{ fontSize: 12, color: '#F87171', marginTop: 5, fontFamily: 'var(--font-cond)', letterSpacing: '.06em' }}>{errors.barangay}</div>}
        </div>
        <div style={{ flex: '0 0 calc(50% - 8px)' }}>
          <FieldLabel required>City / Municipality</FieldLabel>
          <div style={{ position: 'relative' }}>
            <input
              style={inputStyle(errors.city)}
              placeholder="Arayat, San Luis, Mexico..."
              value={location.city}
              onChange={e => checkCity(e.target.value)}
              list="city-suggestions"
              onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.5)'}
              onBlur={e => e.target.style.borderColor = errors.city ? 'rgba(248,113,113,.5)' : '#3A3A3A'}
            />
            <datalist id="city-suggestions">
              {SERVICE_AREA.map(a => <option key={a.city} value={a.city} />)}
            </datalist>
            {fee && (
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
            )}
          </div>
          {errors.city && <div style={{ fontSize: 12, color: '#F87171', marginTop: 5, fontFamily: 'var(--font-cond)', letterSpacing: '.06em' }}>{errors.city}</div>}
        </div>
        <div style={{ flex: '1 1 100%' }}>
          <FieldLabel>Landmark (optional)</FieldLabel>
          <input
            style={inputStyle(false)}
            placeholder="Malapit sa simbahan, pulis, mall..."
            value={location.landmark || ''}
            onChange={e => setLocation({ ...location, landmark: e.target.value })}
            onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.5)'}
            onBlur={e => e.target.style.borderColor = '#3A3A3A'}
          />
        </div>
        <div style={{ flex: '1 1 100%' }}>
          <FieldLabel>Special Instructions (optional)</FieldLabel>
          <textarea
            style={{ ...inputStyle(false), height: 80, padding: '14px 16px', resize: 'none' }}
            placeholder="Gate code, preferred parking, alagang hayop..."
            value={location.instructions || ''}
            onChange={e => setLocation({ ...location, instructions: e.target.value })}
            onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.5)'}
            onBlur={e => e.target.style.borderColor = '#3A3A3A'}
          />
        </div>
      </div>
      {fee && hasTravelFee && (
        <div style={{ padding: '16px 20px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.1em', color: '#22C55E', marginBottom: 2 }}>TRAVEL FEE — {fee.city}</div>
            <div style={{ fontSize: 13, color: '#CFCFCF' }}>{fee.km} mula Arayat</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: fee.fee === 'FREE' ? '#22C55E' : '#FFD200' }}>{fee.fee}</div>
        </div>
      )}
      {!fee && location.city && (
        <div style={{ padding: '16px 20px', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 12 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.1em', color: '#F87171' }}>LOCATION NOT IN SERVICE AREA</div>
          <div style={{ fontSize: 13, color: '#CFCFCF', marginTop: 4 }}>Pasensya na, hindi pa namin ina-abot ang &quot;{location.city}&quot;. Service area namin ay 25km mula Arayat.</div>
        </div>
      )}
    </div>
  )
}

/* ─── Step 4 ─── */
function Step4({ schedule, setSchedule, errors, availableSlots, loadingAvailability }) {
  const selectedValue = schedule.date && schedule.time ? `${schedule.date}|${normalizeTime(schedule.time)}` : ''
  const grouped = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = []
    acc[slot.date].push(slot)
    return acc
  }, {})
  const dates = Object.entries(grouped).slice(0, 10)

  return (
    <div style={{ animation: 'bk-pop .4s ease both' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, marginBottom: 6, color: '#FFFFFF' }}>ISKEDYUL</h2>
        <p style={{ fontSize: 14, color: '#CFCFCF' }}>Pumili ng petsa at oras. Lunes hanggang Biyernes lamang, 8AM–4PM.</p>
      </div>
      {errors.date && (
        <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#F87171', fontFamily: 'var(--font-cond)', fontWeight: 600, letterSpacing: '.06em' }}>
          Pumili ng petsa at oras.
        </div>
      )}
      <FieldLabel required>AVAILABLE SLOTS</FieldLabel>
      <div style={{ background: '#1A1A1A', border: '1.5px solid #3A3A3A', borderRadius: 12, padding: 18 }}>
        {loadingAvailability ? (
          <div style={{ color: '#777', fontSize: 13, padding: '28px 0', textAlign: 'center' }}>Loading available slots...</div>
        ) : dates.length === 0 ? (
          <div style={{ color: '#F87171', fontSize: 13, padding: '28px 0', textAlign: 'center' }}>No available slots right now.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {dates.map(([date, slots]) => (
              <div key={date}>
                <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, letterSpacing: '.12em', color: '#777', marginBottom: 8 }}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 8 }}>
                  {slots.map(slot => {
                    const selected = selectedValue === slot.value
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setSchedule({ ...schedule, date: slot.date, time: slot.time })}
                        style={{
                          minHeight: 50,
                          borderRadius: 10,
                          border: `1.5px solid ${selected ? '#FFD200' : '#3A3A3A'}`,
                          background: selected ? 'rgba(255,210,0,.12)' : '#222',
                          color: selected ? '#FFD200' : '#CFCFCF',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: '10px 12px',
                          fontFamily: 'var(--font-cond)',
                          fontWeight: 700,
                          letterSpacing: '.06em',
                        }}
                      >
                        <span style={{ display: 'block', fontSize: 14 }}>{displayTime(slot.time)}</span>
                        {slot.remaining > 1 && <span style={{ display: 'block', fontSize: 10, color: '#777', marginTop: 2 }}>{slot.remaining} slots left</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        {/* Time — full width horizontal wrap */}
    </div>
  )
}

/* ─── Step 5 ─── */
function Step5({ vehicle, services, location, schedule, submitted, onSubmit, loading, refNo, submitError, serviceCatalog }) {
  const list = serviceCatalog[vehicle.tier] || []
  const selectedServices = services.map(name => {
    const s = list.find(x => x.name === name)
    return { name, price: s ? s.price : 0, cat: s ? serviceCategory(s) : '', has_travel_fee: s ? serviceUsesTravelFee(s) : false }
  })
  const serviceTotal = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const area         = SERVICE_AREA.find(a => a.city.toLowerCase() === location.city.toLowerCase())
  const hasTravelFee = selectedServices.some(s => s.has_travel_fee)
  const travelFee    = hasTravelFee && area && area.fee !== 'FREE' ? parseInt(area.fee.replace(/[^0-9]/g, '')) || 0 : 0
  const tierName     = TIERS.find(t => t.id === vehicle.tier)?.name || ''
  const fmtDate      = schedule.date ? new Date(schedule.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''

  if (submitted) return (
    <div style={{ textAlign: 'center', animation: 'bk-pop .5s ease both', padding: '40px 0' }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,210,0,.1)', border: '2px solid #FFD200', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 48px rgba(255,210,0,.2)' }}>
        <svg width="44" height="44" viewBox="0 0 60 60" fill="none">
          <path d="M12 30L25 43L48 17" stroke="#FFD200" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="80" strokeDashoffset="0" style={{ animation: 'bk-checkDraw .6s ease both .2s' }} />
        </svg>
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1, marginBottom: 12, color: '#FFFFFF' }}>BOOKING SENT!</h2>
      <p style={{ fontSize: 15, color: '#CFCFCF', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 36px' }}>
        Natanggap na namin ang inyong booking request. May magtatatawag sa inyo para sa final confirmation.
      </p>
      <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 16, padding: 24, textAlign: 'left', maxWidth: 480, margin: '0 auto 32px' }}>
        <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, color: '#777', letterSpacing: '.14em', marginBottom: 4 }}>BOOKING REFERENCE</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#FFD200', letterSpacing: '.1em' }}>
          {refNo || '—'}
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: '#CFCFCF' }}>{vehicle.brand} {vehicle.model} · {fmtDate} · {displayTime(schedule.time)}</div>
      </div>
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-display)',
        fontSize: 18, letterSpacing: '.1em', padding: '16px 32px', borderRadius: 10, textDecoration: 'none',
      }}>Back to Home <Arrow /></Link>
    </div>
  )

  return (
    <div style={{ animation: 'bk-pop .4s ease both' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, marginBottom: 6, color: '#FFFFFF' }}>KUMPIRMASYON</h2>
        <p style={{ fontSize: 14, color: '#CFCFCF' }}>I-review ang inyong booking bago ipadala.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Vehicle */}
        <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.16em', color: '#777', marginBottom: 10 }}>SASAKYAN</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 18, letterSpacing: '.04em', color: '#FFFFFF' }}>{vehicle.brand} {vehicle.model}{vehicle.year ? ` (${vehicle.year})` : ''}</div>
              {vehicle.plate && <div style={{ fontSize: 13, color: '#CFCFCF', marginTop: 2 }}>Plate: {vehicle.plate}</div>}
            </div>
            <span style={{ background: 'rgba(255,210,0,.15)', border: '1px solid rgba(255,210,0,.3)', color: '#FFD200', fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, letterSpacing: '.1em', padding: '5px 12px', borderRadius: 40 }}>{tierName}</span>
          </div>
        </div>
        {/* Services */}
        <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.16em', color: '#777', marginBottom: 12 }}>SERBISYO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedServices.map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: CAT_COLORS[s.cat] || '#FFD200', color: '#0B0B0B', fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-cond)', letterSpacing: '.1em', padding: '2px 7px', borderRadius: 40 }}>{s.cat}</span>
                  <span style={{ fontFamily: 'var(--font-cond)', fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{s.name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#FFFFFF' }}>₱{s.price.toLocaleString()}</span>
              </div>
            ))}
            {travelFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #3A3A3A', paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#CFCFCF', fontFamily: 'var(--font-cond)', letterSpacing: '.04em' }}>Travel fee ({location.city})</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#CFCFCF' }}>₱{travelFee.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #3A3A3A', paddingTop: 12, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '.08em', color: '#FFFFFF' }}>TOTAL</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: '#FFD200' }}>₱{(serviceTotal + travelFee).toLocaleString()}</span>
            </div>
          </div>
        </div>
        {/* Location + Schedule */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.16em', color: '#777', marginBottom: 8 }}>LOKASYON</div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 14, color: '#FFFFFF' }}>{location.barangay}, {location.city}</div>
            {location.landmark && <div style={{ fontSize: 12, color: '#CFCFCF', marginTop: 4 }}>{location.landmark}</div>}
          </div>
          <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.16em', color: '#777', marginBottom: 8 }}>ISKEDYUL</div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 14, color: '#FFFFFF' }}>{fmtDate}</div>
            <div style={{ fontSize: 12, color: '#FFD200', marginTop: 4, fontWeight: 700 }}>{displayTime(schedule.time)}</div>
          </div>
        </div>
        {submitError && (
          <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 10, color: '#F87171', fontSize: 13 }}>
            {submitError}
          </div>
        )}
        <button onClick={onSubmit} disabled={loading} style={{
          width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8,
          background: loading ? '#3A3A3A' : '#FFD200', color: loading ? '#777' : '#0B0B0B', border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '.1em',
          padding: '18px 0', borderRadius: 10, marginTop: 4,
          boxShadow: loading ? 'none' : '0 0 32px rgba(255,210,0,.25)',
          animation: loading ? 'none' : 'bk-glow 2s ease infinite',
          transition: 'background .15s',
        }}>
          {loading ? 'Nagpapadala…' : <> IPADALA ANG BOOKING <Arrow /></>}
        </button>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#777', lineHeight: 1.6 }}>
          Hindi automatic ang confirmation. May tatawag sa inyo para sa final na pagpapatunay ng booking.
        </p>
      </div>
    </div>
  )
}

/* ─── Main wizard ─── */
export default function BookingWizard() {
  const searchParams = useSearchParams()
  const [step,      setStep]      = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [errors,    setErrors]    = useState({})
  const [refNo,     setRefNo]     = useState('')
  const [submitError, setSubmitError] = useState('')
  const topRef = useRef(null)

  const [vehicle,       setVehicle]       = useState({ brand: '', model: '', year: '', plate: '', tier: '' })
  const [services,      setServices]      = useState([])
  const [location,      setLocation]      = useState({ barangay: '', city: '', landmark: '', instructions: '' })
  const [schedule,      setSchedule]      = useState({ date: '', time: '' })
  const [savedVehicles, setSavedVehicles] = useState([])
  const [serviceCatalog, setServiceCatalog] = useState(SERVICES)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingAvailability, setLoadingAvailability] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('vehicles').select('id, make, model, year, plate, tier').eq('user_id', user.id).order('created_at').then(({ data }) => {
        if (data?.length) setSavedVehicles(data)
      })
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data?.length) setServiceCatalog(buildServiceCatalog(data))
      })
  }, [])

  useEffect(() => {
    let alive = true
    setLoadingAvailability(true)
    fetch('/api/public/availability')
      .then(res => res.json())
      .then(data => {
        if (alive) setAvailableSlots(data.slots || [])
      })
      .catch(() => {
        if (alive) setAvailableSlots([])
      })
      .finally(() => {
        if (alive) setLoadingAvailability(false)
      })
    return () => { alive = false }
  }, [])

  // Pre-fill from ?rebook=<booking_id>
  useEffect(() => {
    const rebookId = searchParams.get('rebook')
    if (!rebookId) return
    const supabase = createClient()
    supabase
      .from('bookings')
      .select('*, vehicles(make, model, tier, plate), booking_services(service_name)')
      .eq('id', rebookId)
      .single()
      .then(({ data }) => {
        if (!data) return
        const v = data.vehicles
        if (v) setVehicle({ brand: v.make || '', model: v.model || '', year: '', plate: v.plate || '', tier: v.tier || '', savedId: data.vehicle_id })
        const svcNames = (data.booking_services || []).map(s => s.service_name)
        if (svcNames.length) setServices(svcNames)
        if (data.barangay || data.city) setLocation(l => ({ ...l, barangay: data.barangay || '', city: data.city || '' }))
      })
  }, [searchParams])

  useEffect(() => {
    const slug = searchParams.get('service')
    if (!slug || !vehicle.tier) return
    const svc = (serviceCatalog[vehicle.tier] || []).find(item => item.slug === slug)
    if (svc) setServices(prev => prev.includes(svc.name) ? prev : [svc.name])
  }, [searchParams, serviceCatalog, vehicle.tier])

  useEffect(() => {
    if (searchParams.get('nextMonth') !== '1' || schedule.date || !availableSlots.length) return
    const target = new Date()
    target.setMonth(target.getMonth() + 1)
    const targetIso = target.toISOString().slice(0, 10)
    const slot = availableSlots.find(item => item.date >= targetIso) || availableSlots[0]
    if (slot) setSchedule({ date: slot.date, time: slot.time })
  }, [availableSlots, schedule.date, searchParams])

  const scrollTop = () => topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })

  const validate = () => {
    const e = {}
    if (step === 1) {
      if (!vehicle.brand.trim()) e.brand = 'Ilagay ang brand ng kotse.'
      if (!vehicle.model.trim()) e.model = 'Ilagay ang modelo ng kotse.'
      if (!vehicle.tier)         e.tier  = 'Pumili ng vehicle size.'
    }
    if (step === 2 && !services.length) e.services = true
    if (step === 3) {
      if (!location.barangay.trim()) e.barangay = 'Ilagay ang barangay.'
      if (!location.city.trim())     e.city     = 'Ilagay ang city o municipality.'
    }
    if (step === 4 && (!schedule.date || !schedule.time)) e.date = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) { setStep(s => s + 1); scrollTop() } }
  const back = () => { setStep(s => s - 1); setErrors({}); scrollTop() }

  const submit = async () => {
    setLoading(true)
    setSubmitError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const list = serviceCatalog[vehicle.tier] || []
      const area = SERVICE_AREA.find(a => a.city.toLowerCase() === location.city.toLowerCase())
      const hasTravelFee = services.some(name => {
        const svc = list.find(x => x.name === name)
        return svc ? serviceUsesTravelFee(svc) : false
      })
      const travelFee = hasTravelFee && area && area.fee !== 'FREE' ? parseInt(area.fee.replace(/[^0-9]/g, '')) || 0 : 0
      const serviceTotal = services.reduce((sum, name) => {
        const s = list.find(x => x.name === name)
        return sum + (s ? s.price : 0)
      }, 0)
      const selectedServices = services.map(name => {
        const s = list.find(x => x.name === name)
        return { id: s?.id, name, price: s?.price ?? 0 }
      })

      const res  = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:        user?.id || null,
          vehicle_id:     vehicle.savedId || null,
          vehicle_make:   vehicle.brand,
          vehicle_model:  vehicle.model,
          vehicle_tier:   vehicle.tier,
          vehicle_plate:  vehicle.plate || null,
          services:       selectedServices,
          barangay:       location.barangay,
          city:           location.city,
          landmarks:      location.landmark || null,
          notes:          location.instructions || null,
          scheduled_date: schedule.date,
          scheduled_time: normalizeTime(schedule.time),
          travel_fee:     travelFee,
          subtotal:       serviceTotal,
          total:          serviceTotal + travelFee,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Booking could not be submitted.')
      if (data.reference_no) setRefNo(data.reference_no)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message || 'Booking could not be submitted.')
      setErrors({ submit: true })
    }
    setLoading(false)
    scrollTop()
  }

  const nextLabel = {
    1: 'Next: Choose Services',
    2: 'Next: Your Location',
    3: 'Next: Pick a Schedule',
    4: 'Review Booking',
  }

  const content = () => {
    switch (step) {
      case 1: return <Step1 vehicle={vehicle} setVehicle={setVehicle} errors={errors} savedVehicles={savedVehicles} />
      case 2: return <Step2 vehicle={vehicle} services={services} setServices={setServices} errors={errors} serviceCatalog={serviceCatalog} />
      case 3: return <Step3 location={location} setLocation={setLocation} errors={errors} vehicle={vehicle} services={services} serviceCatalog={serviceCatalog} />
      case 4: return <Step4 schedule={schedule} setSchedule={setSchedule} errors={errors} availableSlots={availableSlots} loadingAvailability={loadingAvailability} />
      case 5: return <Step5 vehicle={vehicle} services={services} location={location} schedule={schedule} submitted={submitted} onSubmit={submit} loading={loading} refNo={refNo} submitError={submitError} serviceCatalog={serviceCatalog} />
      default: return null
    }
  }

  return (
    <>
      <style>{`
        @keyframes bk-pop       { from { opacity:0; transform:scale(.94) } to { opacity:1; transform:none } }
        @keyframes bk-glow      { 0%,100% { box-shadow:0 0 0 0 rgba(255,210,0,0) } 50% { box-shadow:0 0 28px 4px rgba(255,210,0,.2) } }
        @keyframes bk-checkDraw { from { stroke-dashoffset:80 } to { stroke-dashoffset:0 } }
      `}</style>

      <div ref={topRef} style={{
        minHeight: '100vh',
        background: '#0B0B0B',
        backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px),repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px)',
        padding: 'clamp(96px, 16vw, 100px) 0 80px',
        position: 'relative',
      }}>
        {/* Yellow right accent bar */}
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom,#FFD200,rgba(255,178,0,.4),transparent)', pointerEvents: 'none', zIndex: 50 }} />

        <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '0 clamp(14px, 4vw, 24px)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,210,0,.3)', borderRadius: 40, padding: '5px 16px', marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD200', animation: 'bk-glow 2s ease infinite' }} />
              <span style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.2em', color: '#FFD200' }}>HOME-SERVICE BOOKING</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,8vw,72px)', lineHeight: .9, letterSpacing: '-.01em', color: '#FFFFFF' }}>
              BOOK A<br /><span style={{ color: '#FFD200' }}>SERVICE</span>
            </h1>
          </div>

          <StepBar step={step} onGoTo={(s) => { setStep(s); setErrors({}) }} />

          {/* Card */}
          <div style={{ background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 20, padding: 'clamp(22px, 5vw, 40px) clamp(16px, 5vw, 44px)', boxShadow: '0 24px 80px rgba(0,0,0,.5)' }}>
            {content()}

            {!submitted && step < 5 && (
              <div style={{ display: 'flex', justifyContent: step > 1 ? 'space-between' : 'flex-end', marginTop: 36, paddingTop: 28, borderTop: '1px solid #3A3A3A', gap: 12, flexWrap: 'wrap' }}>
                {step > 1 && (
                  <button onClick={back} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'transparent', color: '#CFCFCF', border: '1.5px solid #3A3A3A',
                    cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '.1em',
                    padding: '14px 28px', borderRadius: 10, transition: 'border-color .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#CFCFCF'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#3A3A3A'}
                  >
                    <Arrow dir="left" size={16} /> Back
                  </button>
                )}
                <button onClick={next} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#FFD200', color: '#0B0B0B', border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '.1em',
                  padding: '14px 28px', borderRadius: 10, transition: 'background .15s, transform .15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FFC800'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFD200'; e.currentTarget.style.transform = 'none' }}
                >
                  {nextLabel[step]} <Arrow size={16} />
                </button>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#777', fontFamily: 'var(--font-cond)', letterSpacing: '.08em' }}>
            OPERATING HOURS: MON–FRI · 8:00 AM – 6:00 PM · ARAYAT, PAMPANGA
          </p>
        </div>
      </div>
    </>
  )
}

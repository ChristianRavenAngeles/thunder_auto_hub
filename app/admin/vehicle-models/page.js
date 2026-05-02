'use client'

import { useState, useEffect, useRef } from 'react'

const TIERS = [
  { id: 'S',  label: 'Small',       color: '#60A5FA' },
  { id: 'M',  label: 'Medium',      color: '#34D399' },
  { id: 'L',  label: 'Large',       color: '#FFD200' },
  { id: 'XL', label: 'Extra Large', color: '#F87171' },
]

function TierBadge({ tier }) {
  const t = TIERS.find(x => x.id === tier)
  if (!t) return null
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-cond)', letterSpacing: '.08em', background: `${t.color}18`, border: `1px solid ${t.color}44`, color: t.color }}>
      {tier} · {t.label}
    </span>
  )
}

export default function VehicleModelsPage() {
  const [tab,      setTab]      = useState('models') // 'models' | 'unknown'
  const [models,   setModels]   = useState([])
  const [unknown,  setUnknown]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [loadingU, setLoadingU] = useState(false)
  const [search,   setSearch]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editRow,  setEditRow]  = useState(null)

  const [form, setForm] = useState({ model_name: '', brand: '', tier: 'M' })
  const searchTimer = useRef(null)

  async function load(q = '') {
    setLoading(true)
    const res  = await fetch(`/api/admin/vehicle-models${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json()
    setModels(data.models || [])
    setLoading(false)
  }

  async function loadUnknown() {
    setLoadingU(true)
    const res  = await fetch('/api/admin/vehicle-models/unknown')
    const data = await res.json()
    setUnknown(data.requests || [])
    setLoadingU(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (tab === 'unknown') loadUnknown() }, [tab])

  function handleSearchChange(val) {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(val), 350)
  }

  function openAdd(prefill = {}) {
    setEditRow(null)
    setForm({ model_name: prefill.model_name || '', brand: prefill.brand || '', tier: 'M' })
    setShowForm(true)
    setError('')
    setTab('models')
  }

  function openEdit(row) {
    setEditRow(row)
    setForm({ model_name: row.model_name, brand: row.brand || '', tier: row.tier })
    setShowForm(true)
    setError('')
  }

  async function handleSave() {
    if (!form.model_name.trim()) { setError('Model name is required.'); return }
    setSaving(true)
    setError('')
    try {
      const res  = await fetch('/api/admin/vehicle-models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editRow?.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(editRow ? 'Updated.' : 'Added.')
      setShowForm(false)
      load(search)
      if (tab === 'unknown') loadUnknown()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    setDeleting(id)
    await fetch('/api/admin/vehicle-models', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    load(search)
  }

  async function dismissUnknown(id) {
    setDeleting(id)
    await fetch('/api/admin/vehicle-models/unknown', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    loadUnknown()
  }

  const s = {
    page:   { padding: '32px 28px', maxWidth: 900 },
    card:   { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' },
    th:     { padding: '10px 16px', fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' },
    td:     { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', color: 'var(--text)' },
    input:  { width: '100%', height: 40, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' },
    label:  { display: 'block', fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', marginBottom: 6 },
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>VEHICLE MODELS</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Manage the model → size mapping used in the booking wizard. Unknown models are flagged here for admin review.
          </p>
        </div>
        <button onClick={() => openAdd()} style={{ padding: '10px 20px', background: '#FFD200', color: '#0B0B0B', border: 'none', borderRadius: 10, fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + ADD MODEL
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { id: 'models',  label: 'Models' },
          { id: 'unknown', label: `Unknown Requests${unknown.length ? ` (${unknown.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab === t.id ? '#FFD200' : 'transparent'}`,
            color: tab === t.id ? '#FFD200' : 'var(--text-muted)',
            fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em',
            cursor: 'pointer', marginBottom: -1, transition: 'color .15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {success && <div style={{ padding: '10px 16px', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 10, color: '#22C55E', fontSize: 13, marginBottom: 16 }}>{success}</div>}

      {/* Add/Edit form */}
      {showForm && (
        <div style={{ ...s.card, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '.08em', color: 'var(--text)', marginBottom: 16 }}>
            {editRow ? 'EDIT MODEL' : 'ADD MODEL'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={s.label}>MODEL NAME *</label>
              <input style={s.input} placeholder="e.g. montero sport" value={form.model_name}
                onChange={e => setForm(f => ({ ...f, model_name: e.target.value.toLowerCase() }))} />
            </div>
            <div>
              <label style={s.label}>BRAND (optional)</label>
              <input style={s.input} placeholder="e.g. mitsubishi" value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value.toLowerCase() }))} />
            </div>
            <div>
              <label style={s.label}>SIZE TIER *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TIERS.map(t => (
                  <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, tier: t.id }))} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${form.tier === t.id ? t.color : 'var(--border)'}`,
                    background: form.tier === t.id ? `${t.color}18` : 'var(--surface-2)',
                    color: form.tier === t.id ? t.color : 'var(--text-muted)',
                    fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                  }}>
                    {t.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#F87171', marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: '#FFD200', color: '#0B0B0B', border: 'none', borderRadius: 8, fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.06em', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'SAVE'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-cond)', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Models Tab ─── */}
      {tab === 'models' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input style={{ ...s.input, maxWidth: 320 }} placeholder="Search model name…" value={search}
              onChange={e => handleSearchChange(e.target.value)} />
          </div>
          <div style={s.card}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={s.th}>MODEL NAME</th>
                  <th style={s.th}>BRAND</th>
                  <th style={s.th}>TIER</th>
                  <th style={s.th}>ADDED</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>Loading…</td></tr>
                ) : models.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>No models found.</td></tr>
                ) : models.map(row => (
                  <tr key={row.id} style={{ transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...s.td, fontWeight: 600 }}>{row.model_name}</td>
                    <td style={{ ...s.td, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{row.brand || '—'}</td>
                    <td style={s.td}><TierBadge tier={row.tier} /></td>
                    <td style={{ ...s.td, color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(row.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(row)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-cond)', cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(row.id)} disabled={deleting === row.id} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(248,113,113,.3)', background: 'transparent', color: '#F87171', fontSize: 12, fontFamily: 'var(--font-cond)', cursor: 'pointer' }}>
                          {deleting === row.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-cond)' }}>
              {models.length} model{models.length !== 1 ? 's' : ''}
            </div>
          </div>
        </>
      )}

      {/* ─── Unknown Requests Tab ─── */}
      {tab === 'unknown' && (
        <div style={s.card}>
          {unknown.length > 0 && (
            <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,.06)', borderBottom: '1px solid var(--border)', fontSize: 13, color: '#FBbf24', fontFamily: 'var(--font-cond)', fontWeight: 600, letterSpacing: '.06em' }}>
              {unknown.length} unknown model{unknown.length !== 1 ? 's' : ''} need{unknown.length === 1 ? 's' : ''} to be classified. Click &quot;Add&quot; to assign a tier and add it to the database.
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={s.th}>MODEL NAME</th>
                <th style={s.th}>BRAND</th>
                <th style={s.th}>REQUESTS</th>
                <th style={s.th}>FIRST SEEN</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {loadingU ? (
                <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>Loading…</td></tr>
              ) : unknown.length === 0 ? (
                <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>No unknown models. All vehicles are classified.</td></tr>
              ) : unknown.map(row => (
                <tr key={row.id} style={{ transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...s.td, fontWeight: 600 }}>{row.model_name}</td>
                  <td style={{ ...s.td, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{row.brand || '—'}</td>
                  <td style={s.td}>
                    <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, color: row.request_count > 2 ? '#F87171' : 'var(--text-muted)' }}>
                      {row.request_count}×
                    </span>
                  </td>
                  <td style={{ ...s.td, color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(row.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openAdd({ model_name: row.model_name, brand: row.brand || '' })}
                        style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid rgba(255,210,0,.4)', background: 'rgba(255,210,0,.08)', color: '#FFD200', fontSize: 12, fontFamily: 'var(--font-cond)', fontWeight: 700, cursor: 'pointer' }}>
                        + Add
                      </button>
                      <button onClick={() => dismissUnknown(row.id)} disabled={deleting === row.id} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-cond)', cursor: 'pointer' }}>
                        {deleting === row.id ? '…' : 'Dismiss'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

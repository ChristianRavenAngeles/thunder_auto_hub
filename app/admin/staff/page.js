'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const STAFF_ROLES = ['admin', 'manager', 'staff', 'super_admin']

const ROLE_COLORS = {
  super_admin: { bg: 'rgba(167,139,250,.15)', color: '#A78BFA' },
  admin:       { bg: 'rgba(96,165,250,.15)',  color: '#60A5FA' },
  manager:     { bg: 'rgba(52,211,153,.15)',  color: '#34D399' },
  staff:       { bg: 'rgba(251,191,36,.15)',  color: '#FCD34D' },
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function StaffPage() {
  const supabase = createClient()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'staff', password: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', STAFF_ROLES)
      .order('role')
    setStaff(data || [])
    setLoading(false)
  }

  function openAdd() {
    setForm({ full_name: '', email: '', phone: '', role: 'staff', password: '' })
    setModal({ type: 'add' })
  }

  function openEdit(person) {
    setForm({
      full_name: person.full_name || '',
      email: person.email || '',
      phone: person.phone || '',
      role: STAFF_ROLES.includes(person.role) ? person.role : 'staff',
      password: '',
    })
    setModal({ type: 'edit', person })
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.email || !form.password || !form.full_name) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          phone: form.phone,
          role: form.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Staff member added.')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(e) {
    e.preventDefault()
    if (!modal?.person) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone,
        role: form.role,
      }).eq('id', modal.person.id)
      toast.success('Updated.')
      setModal(null)
      load()
    } catch {
      toast.error('Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', height: 44, background: '#1C1C1C',
    border: '1px solid #2A2A2A', borderRadius: 8,
    color: '#FFFFFF', padding: '0 12px',
    fontSize: 13, fontFamily: 'var(--font-cond)', outline: 'none',
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 28, letterSpacing: '.04em', color: '#FFFFFF', margin: 0 }}>STAFF</h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Team management for admin, manager, and staff accounts.</p>
        </div>
        <button onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#FFD200', color: '#0B0B0B', border: 'none', borderRadius: 8,
          padding: '10px 18px', cursor: 'pointer',
          fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ADD STAFF
        </button>
      </div>

      <section style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '.2em', color: '#666', marginBottom: 12 }}>
          OFFICE STAFF ({staff.length})
        </div>
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['Name', 'Role', 'Phone', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10, letterSpacing: '.12em', color: '#666' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map(s => {
                const rc = ROLE_COLORS[s.role] || { bg: '#2A2A2A', color: '#666' }
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #1C1C1C' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,210,0,.12)', border: '1.5px solid rgba(255,210,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 15, color: '#FFD200' }}>{getInitials(s.full_name)}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{s.full_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: rc.bg, color: rc.color, fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, letterSpacing: '.06em' }}>{s.role.toUpperCase().replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#CFCFCF' }}>{s.phone || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#666' }}>{formatDate(s.created_at)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => openEdit(s)} style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 6, color: '#CFCFCF', padding: '5px 12px', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-cond)', letterSpacing: '.06em' }}>EDIT</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {staff.length === 0 && !loading && (
            <div style={{ padding: 48, textAlign: 'center', color: '#666', fontSize: 13 }}>No staff found.</div>
          )}
        </div>
      </section>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 18, letterSpacing: '.08em', color: '#FFFFFF', marginBottom: 20 }}>
              {modal.type === 'add' ? 'ADD STAFF MEMBER' : 'EDIT PROFILE'}
            </h2>
            <form onSubmit={modal.type === 'add' ? handleAdd : handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.12em', color: '#666', marginBottom: 5 }}>FULL NAME</label>
                <input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Juan dela Cruz" required />
              </div>
              {modal.type === 'add' && (
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.12em', color: '#666', marginBottom: 5 }}>EMAIL</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@thunder.ph" required />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.12em', color: '#666', marginBottom: 5 }}>PHONE</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="09XX XXX XXXX" />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.12em', color: '#666', marginBottom: 5 }}>ROLE</label>
                <select style={{ ...inputStyle, height: 44 }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {STAFF_ROLES.map(r => (
                    <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              {modal.type === 'add' && (
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.12em', color: '#666', marginBottom: 5 }}>PASSWORD</label>
                  <input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" required minLength={8} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setModal(null)} style={{ flex: 1, height: 42, background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, color: '#CFCFCF', cursor: 'pointer', fontFamily: 'var(--font-cond)', fontSize: 13, letterSpacing: '.06em' }}>CANCEL</button>
                <button type="submit" disabled={saving} style={{ flex: 2, height: 42, background: '#FFD200', border: 'none', borderRadius: 8, color: '#0B0B0B', cursor: 'pointer', fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em' }}>
                  {saving ? 'SAVING...' : modal.type === 'add' ? 'CREATE' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

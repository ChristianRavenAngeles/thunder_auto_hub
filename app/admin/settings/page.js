'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Save, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [maintenance, setMaintenance] = useState(false)

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*')
    const map = {}
    data?.forEach(s => {
      try { map[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value }
      catch { map[s.key] = s.value }
    })
    setSettings(map)
    setMaintenance(map.maintenance_mode === true || map.maintenance_mode === 'true')
    setLoading(false)
  }

  async function saveSetting(key, value) {
    setSaving(true)
    await supabase.from('settings').upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() })
    setSaving(false)
    toast.success('Setting saved!')
  }

  async function toggleMaintenance() {
    const newVal = !maintenance
    setMaintenance(newVal)
    await saveSetting('maintenance_mode', newVal)
    toast(newVal ? '⚠️ Maintenance mode ON' : '✅ Maintenance mode OFF')
  }

  if (loading) return <div className="text-center py-10 text-[var(--text-muted)]">Loading settings…</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold font-display text-thunder-dark flex items-center gap-2">
        <Settings className="w-6 h-6 text-brand-500" /> System Settings
      </h1>

      {/* Maintenance mode */}
      <div className={`card p-5 ${maintenance ? 'border-red-200 bg-red-50' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-thunder-dark flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 ${maintenance ? 'text-red-500' : 'text-[var(--text-muted)]'}`} />
              Maintenance Mode
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">When ON, new bookings are paused. Existing customers unaffected.</p>
          </div>
          <button onClick={toggleMaintenance} className="flex-shrink-0">
            {maintenance
              ? <ToggleRight className="w-10 h-6 text-red-500" />
              : <ToggleLeft className="w-10 h-6 text-[var(--text-muted)]" />}
          </button>
        </div>
        {maintenance && (
          <div className="mt-3 bg-red-100 rounded-xl px-3 py-2 text-xs text-red-700">
            ⚠️ Maintenance mode is ON. Customers cannot book right now.
          </div>
        )}
      </div>

      {/* Business hours */}
      <div className="card p-5">
        <h2 className="font-bold text-thunder-dark mb-3">Business Hours</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Opening Time</label>
            <input type="time" className="input" defaultValue={settings.business_hours_start || '08:00'}
              onBlur={e => saveSetting('business_hours_start', e.target.value)} />
          </div>
          <div>
            <label className="label">Closing Time</label>
            <input type="time" className="input" defaultValue={settings.business_hours_end || '18:00'}
              onBlur={e => saveSetting('business_hours_end', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Deposit amount */}
      <div className="card p-5">
        <h2 className="font-bold text-thunder-dark mb-3">Deposit & Loyalty</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Reservation Deposit (₱)</label>
            <input type="number" className="input" defaultValue={settings.deposit_amount || 100}
              onBlur={e => saveSetting('deposit_amount', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Loyalty Rate (pts per ₱1)</label>
            <input type="number" className="input" defaultValue={settings.loyalty_rate || 1}
              onBlur={e => saveSetting('loyalty_rate', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Commission Rate (%)</label>
            <input type="number" className="input" defaultValue={settings.commission_rate || 10}
              onBlur={e => saveSetting('commission_rate', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Max Service Range (km)</label>
            <input type="number" className="input" defaultValue={settings.max_service_range_km || 25}
              onBlur={e => saveSetting('max_service_range_km', parseInt(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="card p-5">
        <h2 className="font-bold text-thunder-dark mb-3">Contact Information</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Business Phone</label>
            <input className="input" defaultValue={settings.contact_phone || ''}
              onBlur={e => saveSetting('contact_phone', e.target.value)} placeholder="+63XXXXXXXXXX" />
          </div>
          <div>
            <label className="label">Business Email</label>
            <input className="input" defaultValue={settings.contact_email || 'thunder.auto.hub@gmail.com'}
              onBlur={e => saveSetting('contact_email', e.target.value)} />
          </div>
        </div>
      </div>

      {/* SMS Templates */}
      <div className="card p-5">
        <h2 className="font-bold text-thunder-dark mb-1">SMS Templates</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">Use {`{{ref_no}}`}, {`{{rider_name}}`}, {`{{date}}`}, {`{{time}}`} as variables.</p>
        {['booking_confirmed', 'rider_assigned', 'service_completed', 'reminder'].map(key => {
          const templates = settings.sms_templates || {}
          return (
            <div key={key} className="mb-3">
              <label className="label capitalize">{key.replace(/_/g, ' ')}</label>
              <textarea className="input resize-none" rows={2}
                defaultValue={templates[key] || ''}
                onBlur={e => {
                  const updated = { ...(settings.sms_templates || {}), [key]: e.target.value }
                  saveSetting('sms_templates', updated)
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, Send, Users, Clock, Check } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const AUDIENCES = [
  { key: 'all',         label: 'All Customers'            },
  { key: 'members',     label: 'Active Members Only'      },
  { key: 'inactive_30', label: 'Inactive 30+ Days'        },
  { key: 'inactive_60', label: 'Inactive 60+ Days'        },
  { key: 'vip',         label: 'VIP Customers'            },
]

export default function BroadcastPage() {
  const supabase = createClient()
  const [broadcasts, setBroadcasts] = useState([])
  const [form, setForm] = useState({ title: '', body: '', channel: 'in_app', audience: 'all' })
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setBroadcasts(data || []))
  }, [])

  async function sendBroadcast() {
    if (!form.title || !form.body) return toast.error('Lagyan ng title at message.')
    setSending(true)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Broadcast sent to ${data.sent_count} users!`)
      setForm({ title: '', body: '', channel: 'in_app', audience: 'all' })
      // Reload
      const { data: updated } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(20)
      setBroadcasts(updated || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold font-display text-thunder-dark flex items-center gap-2">
        <Megaphone className="w-6 h-6 text-brand-500" /> Broadcast Messages
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="card p-5">
          <h2 className="font-bold font-display text-thunder-dark mb-4">Send a Broadcast</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="e.g. Summer Coating Promo!" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Kumusta! May espesyal na alok kami para sa inyo..."
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">{form.body.length} characters</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Channel</label>
                <select className="input" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                  <option value="in_app">In-App</option>
                  <option value="sms">SMS</option>
                  <option value="messenger">Messenger (placeholder)</option>
                </select>
              </div>
              <div>
                <label className="label">Audience</label>
                <select className="input" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}>
                  {AUDIENCES.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </div>
            </div>
            {form.channel === 'sms' && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ SMS broadcast requires Semaphore API key. Make sure SEMAPHORE_API_KEY is set in .env.
              </div>
            )}
            <button onClick={sendBroadcast} disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send Broadcast'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="card p-5">
          <h2 className="font-bold font-display text-thunder-dark mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" /> Broadcast History
          </h2>
          {!broadcasts.length ? (
            <p className="text-[var(--text-muted)] text-sm text-center py-6">No broadcasts yet.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {broadcasts.map(b => (
                <div key={b.id} className="p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--border)]">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <p className="font-semibold text-thunder-dark text-sm">{b.title}</p>
                    <span className={`badge flex-shrink-0 ${b.status === 'sent' ? 'badge-green' : b.status === 'sending' ? 'badge-gold' : 'badge-gray'}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{b.body}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.audience}</span>
                    <span>{b.channel}</span>
                    {b.sent_count > 0 && <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> {b.sent_count} sent</span>}
                    <span>{formatDateTime(b.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

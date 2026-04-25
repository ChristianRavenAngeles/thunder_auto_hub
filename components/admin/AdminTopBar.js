'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo, getInitials } from '@/lib/utils'

export default function AdminTopBar({ profile }) {
  const supabase = createClient()
  const [notifs, setNotifs]   = useState([])
  const [open,   setOpen]     = useState(false)
  const unread = notifs.filter(n => !n.is_read).length

  useEffect(() => {
    loadNotifs()
    const channel = supabase
      .channel('admin-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile?.id}` },
        payload => setNotifs(prev => [payload.new, ...prev])
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function loadNotifs() {
    if (!profile?.id) return
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20)
    setNotifs(data || [])
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile?.id).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <header style={{
      height: 56, background: '#141414', borderBottom: '1px solid #2A2A2A',
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0,
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          placeholder="Search bookings, customers..."
          style={{
            width: '100%', height: 36, background: '#1C1C1C', border: '1px solid #2A2A2A',
            borderRadius: 8, color: '#FFFFFF', paddingLeft: 36, paddingRight: 14,
            fontSize: 13, fontFamily: 'var(--font-barlow)', outline: 'none', transition: 'border-color .15s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.4)'}
          onBlur={e => e.target.style.borderColor = '#2A2A2A'}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4, color: unread > 0 ? '#FFD200' : '#666' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2, width: 7, height: 7, borderRadius: '50%',
                background: '#F87171', border: '1.5px solid #141414',
              }} />
            )}
          </button>

          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 44, width: 300, borderRadius: 12,
              background: '#1C1C1C', border: '1px solid #2A2A2A', boxShadow: '0 16px 40px rgba(0,0,0,.5)',
              zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em', color: '#FFFFFF' }}>
                NOTIFICATIONS
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: 13, padding: '24px 0', color: '#666' }}>Wala pang notifications.</p>
                ) : notifs.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid #2A2A2A', cursor: 'pointer',
                    background: !n.is_read ? 'rgba(255,210,0,.04)' : 'transparent',
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>{n.title}</p>
                    <p style={{ fontSize: 12, marginTop: 2, color: '#666' }}>{n.body}</p>
                    <p style={{ fontSize: 11, marginTop: 4, color: '#666' }}>{timeAgo(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: '#2A2A2A' }} />

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,210,0,.15)',
            border: '1.5px solid rgba(255,210,0,.3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, color: '#FFD200',
          }}>
            {getInitials(profile?.full_name || 'Admin')}
          </div>
          <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, letterSpacing: '.06em', color: '#CFCFCF' }}>
            {profile?.full_name || 'Admin'}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </header>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'

export default function CustomerTopBar({ profile }) {
  const supabase = createClient()
  const [notifs, setNotifs] = useState([])
  const [open, setOpen]     = useState(false)
  const unread = notifs.filter(n => !n.is_read).length

  useEffect(() => {
    loadNotifs()
    const channel = supabase
      .channel('customer-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile?.id}` },
        payload => setNotifs(prev => [payload.new, ...prev])
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [profile?.id])

  async function loadNotifs() {
    if (!profile?.id) return
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20)
    setNotifs(data || [])
  }

  async function markRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile?.id).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <header className="app-topbar" style={{
      height: 56, background: '#141414', borderBottom: '1px solid #2A2A2A',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ flex: 1 }}>
        <span className="topbar-title" style={{ display: 'block', fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 16, letterSpacing: '.04em', color: '#FFFFFF' }}>
          Kumusta, {profile?.full_name?.split(' ')[0] || 'Customer'}! 👋
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Book Now */}
        <Link href="/book" className="hide-sm" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#FFD200', color: '#0B0B0B', borderRadius: 8,
          padding: '6px 14px', textDecoration: 'none',
          fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, letterSpacing: '.08em',
        }}>
          + BOOK NOW
        </Link>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setOpen(!open); if (!open && unread > 0) markRead() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 6, color: unread > 0 ? '#FFD200' : '#666' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%',
                background: '#F87171', border: '1.5px solid #141414',
              }} />
            )}
          </button>

          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 44, width: 300, maxWidth: 'calc(100vw - 28px)', borderRadius: 12,
              background: '#1C1C1C', border: '1px solid #2A2A2A', boxShadow: '0 16px 40px rgba(0,0,0,.5)',
              zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>NOTIFICATIONS</span>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: 13, padding: '24px 0', color: '#666' }}>Wala pang notifications.</p>
                ) : notifs.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid #2A2A2A',
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
      </div>
    </header>
  )
}

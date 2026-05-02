'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { getInitials } from '@/lib/utils'

const NAV = [
  { href: '/account',            icon: 'dashboard', label: 'Dashboard'   },
  { href: '/account/bookings',   icon: 'bookings',  label: 'My Bookings' },
  { href: '/account/vehicles',   icon: 'car',       label: 'My Vehicles' },
  { href: '/account/membership', icon: 'crown',     label: 'Membership'  },
  { href: '/account/messages',   icon: 'messages',  label: 'Messages'    },
]

const ICON_PATHS = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  bookings:  'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  car:       'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9h-1 M15 17H9 M18 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z M7 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  crown:     'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z M5 20h14',
  messages:  'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  book:      'M12 5v14M5 12h14',
  logout:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
}

function NavIcon({ name, size = 14, color = 'currentColor' }) {
  const d = ICON_PATHS[name] || ''
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {d.split(' M').map((seg, i) => <path key={i} d={(i === 0 ? '' : ' M') + seg} />)}
    </svg>
  )
}

export default function CustomerSidebar({ profile }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function signOut() {
    sessionStorage.removeItem('thunder-session-active')
    await fetch('/api/auth/signout', { method: 'POST' })
    await supabase.auth.signOut()
    router.push('/')
  }

  function isActive(href) {
    if (href === '/account') return pathname === '/account'
    return pathname.startsWith(href)
  }

  const sidebar = (
    <aside style={{
      width: 220, background: '#141414', borderRight: '1px solid #2A2A2A',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, flexShrink: 0, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid #2A2A2A', flexShrink: 0 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#FFD200', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24"><path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13Z" fill="#0B0B0B" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, letterSpacing: '.1em', lineHeight: 1, color: '#FFFFFF' }}>THUNDER AUTO HUB</div>
            <div style={{ fontSize: 9, color: '#666', letterSpacing: '.16em', marginTop: 1 }}>MY ACCOUNT</div>
          </div>
        </Link>
      </div>

      {/* Profile chip */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,210,0,.15)',
          border: '1.5px solid rgba(255,210,0,.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16, color: '#FFD200', flexShrink: 0,
        }}>{getInitials(profile?.full_name || 'Me')}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.04em', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.full_name || 'Customer'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <NavIcon name="star" size={10} color="#FFD200" />
            <span style={{ fontSize: 10, color: '#666' }}>{(profile?.loyalty_points || 0).toLocaleString()} pts</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0 16px' }}>
        {NAV.map(({ href, icon, label }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
              cursor: 'pointer', transition: 'all .15s', position: 'relative',
              fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 13, letterSpacing: '.04em',
              color: active ? '#FFD200' : '#CFCFCF',
              background: active ? 'rgba(255,210,0,.1)' : 'transparent',
              textDecoration: 'none', whiteSpace: 'nowrap',
              borderLeft: active ? '3px solid #FFD200' : '3px solid transparent',
            }}
              onClick={() => setMobileOpen(false)}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#2A2A2A'; e.currentTarget.style.color = '#FFFFFF' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#CFCFCF' } }}
            >
              <NavIcon name={icon} size={14} color={active ? '#FFD200' : '#666'} />
              <span style={{ flex: 1 }}>{label}</span>
            </Link>
          )
        })}

        {/* Book CTA */}
        <div style={{ padding: '12px 12px 0' }}>
          <Link href="/book" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: 'rgba(255,210,0,.1)', border: '1px solid rgba(255,210,0,.2)',
            borderRadius: 10, textDecoration: 'none',
            fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13,
            letterSpacing: '.06em', color: '#FFD200',
          }} onClick={() => setMobileOpen(false)}>
            <NavIcon name="book" size={14} color="#FFD200" />
            Book New Service
          </Link>
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 8, color: '#666',
          textDecoration: 'none', fontFamily: 'var(--font-cond)', fontSize: 12,
          letterSpacing: '.06em', padding: '6px 2px',
        }} onClick={() => setMobileOpen(false)}>
          ← Back to Site
        </Link>
        <button onClick={signOut} style={{
          display: 'flex', alignItems: 'center', gap: 8, color: '#666', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '.06em',
          padding: '6px 2px', textAlign: 'left',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >
          <NavIcon name="logout" size={13} color="currentColor" />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        aria-label="Open account navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 60,
          width: 40, height: 40, borderRadius: 9, background: '#141414',
          border: '1px solid #2A2A2A', color: '#CFCFCF', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
        }}
        className="mobile-menu-btn"
      >
        ☰
      </button>

      {/* Desktop sidebar */}
      <div className="desktop-sidebar">
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="mobile-sidebar-backdrop" onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50 }} />
          <div className="mobile-sidebar-panel" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 55 }}>
            {sidebar}
          </div>
        </>
      )}
    </>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

const NAV_GROUPS = [
  {
    label: 'OPERATIONS',
    items: [
      { href: '/admin',           icon: 'home',      label: 'Dashboard'      },
      { href: '/admin/bookings',  icon: 'bookings',  label: 'Bookings',  badge: null },
      { href: '/admin/calendar',  icon: 'calendar',  label: 'Calendar'       },
      { href: '/admin/payments',  icon: 'payments',  label: 'Payments'       },
    ],
  },
  {
    label: 'PEOPLE',
    items: [
      { href: '/admin/customers', icon: 'users',     label: 'Customers'      },
      { href: '/admin/staff',     icon: 'staff',     label: 'Staff & Riders' },
      { href: '/admin/leads',     icon: 'leads',     label: 'Leads'          },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      { href: '/admin/inventory', icon: 'inventory', label: 'Inventory'      },
    ],
  },
  {
    label: 'COMMUNICATION',
    items: [
      { href: '/admin/messages',  icon: 'messages',  label: 'Messages'       },
      { href: '/admin/broadcast', icon: 'broadcast', label: 'Broadcast'      },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { href: '/admin/reports',   icon: 'reports',   label: 'Reports'        },
      { href: '/admin/partners',  icon: 'partners',  label: 'Partners'       },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { href: '/admin/blog',      icon: 'blog',      label: 'Blog'           },
      { href: '/admin/settings',  icon: 'settings',  label: 'Settings'       },
    ],
  },
]

const ICON_PATHS = {
  home:      'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  bookings:  'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  calendar:  'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4M8 2v4M3 10h18',
  payments:  'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14.93V18h-2v-1.07C9.39 16.57 8 15.4 8 14h2c0 .66.89 1 2 1s2-.34 2-1c0-.7-.74-1-2.27-1.12C9.67 12.73 8 12.04 8 10c0-1.4 1.39-2.57 3-2.93V6h2v1.07c1.61.36 3 1.53 3 2.93h-2c0-.66-.89-1-2-1s-2 .34-2 1c0 .7.74 1 2.27 1.12C14.33 11.27 16 11.96 16 14c0 1.4-1.39 2.57-3 1.93z',
  users:     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  staff:     'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  leads:     'M22 12h-4l-3 9L9 3l-3 9H2',
  inventory: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  messages:  'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  broadcast: 'M22 8.5c0 4.69-3.82 8.5-8.5 8.5a8.46 8.46 0 0 1-5.79-2.29L2 16l1.29-5.71A8.46 8.46 0 0 1 5 4.5',
  reports:   'M18 20V10 M12 20V4 M6 20v-6',
  partners:  'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  blog:      'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z M14 2v6h6',
  settings:  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  logout:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  arrow:     'M5 12h14M12 5l7 7-7 7',
}

function NavIcon({ name, size = 14, color = 'currentColor' }) {
  const d = ICON_PATHS[name] || ''
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {d.split(' M').map((seg, i) => <path key={i} d={(i === 0 ? '' : ' M') + seg} />)}
    </svg>
  )
}

export default function AdminSidebar({ profile }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  function isActive(href) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside style={{
      width: 220, background: '#141414', borderRight: '1px solid #2A2A2A',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid #2A2A2A', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, background: '#FFD200', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24"><path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13Z" fill="#0B0B0B" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, letterSpacing: '.1em', lineHeight: 1, color: '#FFFFFF' }}>THUNDER AUTO HUB</div>
            <div style={{ fontSize: 9, color: '#666', letterSpacing: '.16em', marginTop: 1 }}>ADMIN PANEL</div>
          </div>
        </div>
      </div>

      {/* Profile chip */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,210,0,.15)',
          border: '1.5px solid rgba(255,210,0,.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16, color: '#FFD200', flexShrink: 0,
        }}>
          {getInitials(profile?.full_name || 'Admin')}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.04em', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.full_name || 'Admin'}
          </div>
          <div style={{ fontSize: 10, color: '#666', letterSpacing: '.06em', textTransform: 'capitalize' }}>{profile?.role || 'admin'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ paddingTop: 16, paddingBottom: 4 }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 700, letterSpacing: '.2em', color: '#666', padding: '0 16px 6px' }}>
              {group.label}
            </div>
            {group.items.map(({ href, icon, label, badge }) => {
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
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#2A2A2A'; e.currentTarget.style.color = '#FFFFFF' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#CFCFCF' } }}
                >
                  <NavIcon name={icon} size={14} color={active ? '#FFD200' : '#666'} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span style={{
                      background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-cond)',
                      fontWeight: 700, fontSize: 10, minWidth: 18, height: 18, borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    }}>{badge}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 8, color: '#666',
          textDecoration: 'none', fontFamily: 'var(--font-cond)', fontSize: 12,
          letterSpacing: '.06em', padding: '6px 2px', transition: 'color .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#CFCFCF'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >
          <NavIcon name="arrow" size={13} color="currentColor" />
          View Website
        </Link>
        <button onClick={signOut} style={{
          display: 'flex', alignItems: 'center', gap: 8, color: '#666', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '.06em',
          padding: '6px 2px', transition: 'color .15s', textAlign: 'left',
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
}

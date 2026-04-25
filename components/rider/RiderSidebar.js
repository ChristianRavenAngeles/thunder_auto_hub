'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, LayoutDashboard, ClipboardList, MessageSquare, Star, LogOut, Menu } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

const NAV = [
  { href: '/rider',       icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/rider/jobs',  icon: ClipboardList,   label: 'My Jobs'   },
  { href: '/rider/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/rider/scorecard', icon: Star,         label: 'Scorecard'},
]

export default function RiderSidebar({ profile }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const sidebar = (
    <aside className="w-56 bg-[var(--bg)] flex flex-col h-screen sticky top-0 border-r border-[var(--border)]">
      <div className="flex items-center gap-2 p-4 border-b border-[var(--border)]">
        <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-[var(--text)]" />
        </div>
        <div>
          <span className="text-[var(--text)] font-display font-bold text-xs">Thunder</span>
          <span className="text-[var(--text-muted)] text-[10px] block">Rider Portal</span>
        </div>
      </div>
      <div className="mx-3 my-2 bg-white/5 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-[var(--text)] text-xs font-bold">
            {getInitials(profile?.full_name || 'Rider')}
          </div>
          <div>
            <p className="text-[var(--text)] text-xs font-medium">{profile?.full_name}</p>
            <p className="text-[var(--text-muted)] text-[10px]">Rider</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all text-xs font-medium',
              pathname === href || (href !== '/rider' && pathname.startsWith(href))
                ? 'bg-brand-500 text-[var(--text)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/10'
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-[var(--border)]">
        <button onClick={signOut} className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/10 transition-all text-xs">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <button
        type="button"
        aria-label="Open rider navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        className="mobile-menu-btn"
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 60,
          width: 40, height: 40, borderRadius: 9,
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text)', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="desktop-sidebar">
        {sidebar}
      </div>

      {mobileOpen && (
        <>
          <div className="mobile-sidebar-backdrop" onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 50 }} />
          <div className="mobile-sidebar-panel" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 55 }}>
            {sidebar}
          </div>
        </>
      )}
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PromosBanner from '@/components/public/PromosBanner'

const NAV_LINKS = [
  { href: '/#services',  label: 'Services' },
  { href: '/#pricing',   label: 'Pricing' },
  { href: '/#coverage',  label: 'Service Area' },
  { href: '/track',      label: 'Track Booking' },
  { href: '/faq',        label: 'FAQ' },
]

const Logo = () => (
  <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
    <div style={{
      width: 34, height: 34, background: '#FFD200', borderRadius: 7,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      animation: 'nav-bolt 3s ease-in-out infinite',
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13Z" fill="#0B0B0B" />
      </svg>
    </div>
    <div>
      <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '0.14em', color: '#FFFFFF', lineHeight: 1 }}>THUNDER AUTO HUB</div>
      <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 9, color: '#FFD200', letterSpacing: '0.22em', fontWeight: 500 }}>PREMIUM CAR CARE</div>
    </div>
    <style>{`@keyframes nav-bolt { 0%,100%{opacity:1} 50%{opacity:.5;filter:brightness(1.8)} }`}</style>
  </Link>
)

export default function PublicNav() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
      <PromosBanner />
      <div style={{
        transition: 'background 0.3s, border-color 0.3s',
        background: scrolled ? 'rgba(11,11,11,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #3A3A3A' : '1px solid transparent',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={{
                fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 14,
                letterSpacing: '0.08em', color: '#CFCFCF', textDecoration: 'none', transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#FFF'}
                onMouseLeave={e => e.currentTarget.style.color = '#CFCFCF'}
              >{l.label}</Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {user ? (
              <Link href="/account" style={{
                fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em',
                color: '#CFCFCF', textDecoration: 'none', padding: '8px 16px',
                border: '1px solid #3A3A3A', borderRadius: 8, transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#CFCFCF'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#3A3A3A'}
              >DASHBOARD</Link>
            ) : (
              <Link href="/auth" style={{
                fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em',
                color: '#CFCFCF', textDecoration: 'none', padding: '8px 16px',
                border: '1px solid #3A3A3A', borderRadius: 8, transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#CFCFCF'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#3A3A3A'}
              >LOGIN</Link>
            )}
            <Link href="/book" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#FFD200', color: '#0B0B0B', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.1em',
              padding: '9px 20px', borderRadius: 8, textDecoration: 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFC800'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFD200'}
            >
              BOOK NOW
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden" style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 8 }}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#0B0B0B', borderTop: '1px solid #3A3A3A' }}>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
                display: 'block', padding: '14px 0',
                fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 16, letterSpacing: '0.08em',
                color: '#CFCFCF', textDecoration: 'none', borderBottom: '1px solid #1F1F1F',
              }}>{l.label}</Link>
            ))}
            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {user ? (
                <>
                  <Link href="/account" onClick={() => setOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#1F1F1F', border: '1px solid #3A3A3A', borderRadius: 10, color: '#FFF', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '0.08em', textDecoration: 'none' }}>DASHBOARD</Link>
                  <button onClick={handleSignOut} style={{ padding: '12px', background: 'none', border: '1px solid #3A3A3A', borderRadius: 10, color: '#CFCFCF', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}>SIGN OUT</button>
                </>
              ) : (
                <>
                  <Link href="/auth" onClick={() => setOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#1F1F1F', border: '1px solid #3A3A3A', borderRadius: 10, color: '#FFF', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '0.08em', textDecoration: 'none' }}>LOGIN</Link>
                  <Link href="/book" onClick={() => setOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#FFD200', borderRadius: 10, color: '#0B0B0B', fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.1em', textDecoration: 'none' }}>BOOK NOW</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'
import { Search, Zap } from 'lucide-react'

export default function TrackPage() {
  const router = useRouter()
  const [ref, setRef] = useState('')

  function handleSearch(e) {
    e.preventDefault()
    if (ref.trim()) router.push(`/track/${ref.trim().toUpperCase()}`)
  }

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-[var(--text)]" />
            </div>
            <h1 className="text-3xl font-bold font-display text-thunder-dark">Track Your Booking</h1>
            <p className="text-[var(--text-muted)] mt-2">I-enter ang inyong reference number para makita ang status ng booking.</p>
          </div>

          <form onSubmit={handleSearch} className="card p-6">
            <label className="label">Reference Number</label>
            <input
              className="input text-center text-xl font-bold tracking-widest uppercase"
              placeholder="TAH-XXXXXXXX"
              value={ref}
              onChange={e => setRef(e.target.value.toUpperCase())}
              autoFocus
            />
            <button type="submit" className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              <Search className="w-4 h-4" /> Track Booking
            </button>
          </form>

          <p className="text-center text-xs text-[var(--text-muted)] mt-4">
            Makikita ang reference number sa SMS confirmation o sa inyong account dashboard.
          </p>
        </div>
      </main>
      <PublicFooter />
    </>
  )
}

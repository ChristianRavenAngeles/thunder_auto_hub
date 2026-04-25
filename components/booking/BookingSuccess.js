import Link from 'next/link'
import { CheckCircle, ArrowRight, Home, Search } from 'lucide-react'

export default function BookingSuccess({ refNo }) {
  return (
    <div className="page-container py-16 text-center animate-fade-in">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold font-display text-thunder-dark mb-2">Booking Submitted! 🎉</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Salamat sa pag-book! I-verify muna ng aming team ang inyong payment at mag-co-confirm kami within 1–2 hours.
          Matatanggap kayo ng SMS confirmation.
        </p>

        <div className="card p-5 mb-6 bg-brand-50 border-brand-100">
          <p className="text-sm text-[var(--text-muted)] mb-1">Reference Number</p>
          <p className="text-2xl font-bold font-display text-brand-600 tracking-wider">{refNo}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">I-save ito para ma-track ang inyong booking</p>
        </div>

        <div className="space-y-3">
          <Link href={`/track/${refNo}`} className="btn-primary w-full flex items-center justify-center gap-2">
            <Search className="w-4 h-4" /> Track Booking Status
          </Link>
          <Link href="/account" className="btn-secondary w-full flex items-center justify-center gap-2">
            Go to My Dashboard
          </Link>
          <Link href="/" className="flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-2)] text-sm">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'
import { Images } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Before & After Gallery — Thunder Auto Hub' }
export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const admin = createAdminClient()
  const { data: photos } = await admin
    .from('booking_photos')
    .select('*, bookings(booking_services(service_name))')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(60)

  const pairs = []
  const byBooking = (photos || []).reduce((acc, p) => {
    if (!acc[p.booking_id]) acc[p.booking_id] = { before: [], after: [], service: p.bookings?.booking_services?.[0]?.service_name }
    if (p.photo_type === 'before') acc[p.booking_id].before.push(p.url)
    if (p.photo_type === 'after')  acc[p.booking_id].after.push(p.url)
    return acc
  }, {})

  for (const [id, data] of Object.entries(byBooking)) {
    if (data.before.length && data.after.length) {
      pairs.push({ id, before: data.before[0], after: data.after[0], service: data.service })
    }
  }

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="page-container py-12">
          <div className="text-center mb-10">
            <div className="badge-gold mb-3">Before & After</div>
            <h1 className="section-title">Our Work</h1>
            <p className="section-subtitle">Tunay na resulta mula sa aming mga customers.</p>
          </div>

          {pairs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pairs.map(p => (
                <div key={p.id} className="card overflow-hidden">
                  <div className="grid grid-cols-2 h-48">
                    <div className="relative overflow-hidden">
                      <img src={p.before} alt="Before" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 bg-[var(--bg)]/60 text-[var(--text)] text-xs px-2 py-0.5 rounded-full">Before</span>
                    </div>
                    <div className="relative overflow-hidden">
                      <img src={p.after} alt="After" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 bg-brand-500/80 text-[var(--text)] text-xs px-2 py-0.5 rounded-full">After</span>
                    </div>
                  </div>
                  {p.service && (
                    <div className="p-3">
                      <span className="badge-teal text-xs">{p.service}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[var(--text-muted)]">
              <Images className="w-12 h-12 mx-auto mb-3" />
              <p className="text-lg font-medium mb-2">Gallery Coming Soon</p>
              <p className="text-sm mb-6">Magdadagdag na kami ng mga before/after photos soon!</p>
              <Link href="/book" className="btn-primary inline-block">Book Your First Service</Link>
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  )
}

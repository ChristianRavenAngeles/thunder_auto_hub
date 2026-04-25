import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Star, TrendingUp, CheckCircle, Clock, Award } from 'lucide-react'

export const metadata = { title: 'My Scorecard — Thunder Rider' }
export const dynamic = 'force-dynamic'

export default async function RiderScorecardPage() {
  const supabase = await createClient()
  const admin    = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: stats }, { data: reviews }] = await Promise.all([
    admin.from('rider_stats').select('*').eq('rider_id', user.id).single(),
    admin.from('reviews')
      .select('*, bookings(ref_number, scheduled_date)')
      .eq('rider_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const s = stats || {}
  const avgRating = s.avg_rating ? Number(s.avg_rating).toFixed(1) : '0.0'

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-thunder-dark">My Scorecard</h1>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">Your performance metrics and customer feedback.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Star, label: 'Avg Rating', value: avgRating, color: 'text-amber-500', sub: '/ 5.0' },
          { icon: CheckCircle, label: 'Total Jobs', value: s.total_jobs || 0, color: 'text-green-500', sub: 'completed' },
          { icon: TrendingUp, label: 'This Month', value: s.jobs_this_month || 0, color: 'text-brand-500', sub: 'jobs' },
          { icon: Award, label: 'On-Time Rate', value: s.on_time_rate ? `${s.on_time_rate}%` : '—', color: 'text-purple-500', sub: '' },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="card p-4 text-center">
            <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-thunder-dark">{value}<span className="text-xs text-[var(--text-muted)] font-normal ml-0.5">{sub}</span></p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent reviews */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Customer Reviews</h2>
      <div className="space-y-3">
        {(reviews || []).map(r => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
              <span className="text-xs text-[var(--text-muted)] ml-2">{r.bookings?.ref_number}</span>
            </div>
            {r.comment && <p className="text-sm text-[var(--text-2)]">&ldquo;{r.comment}&rdquo;</p>}
          </div>
        ))}
        {(!reviews || reviews.length === 0) && (
          <div className="card p-8 text-center text-[var(--text-muted)]">No reviews yet.</div>
        )}
      </div>
    </div>
  )
}

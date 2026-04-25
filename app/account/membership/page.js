import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Crown, Star, Zap, Check, Gift } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'

export const metadata = { title: 'Membership — Thunder Auto Hub' }
export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const supabase = await createClient()
  const admin    = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: membership }, { data: plans }, { data: profile }] = await Promise.all([
    admin.from('memberships').select('*, membership_plans(*)').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    admin.from('membership_plans').select('*').eq('is_active', true).order('price'),
    admin.from('profiles').select('loyalty_points').eq('id', user.id).single(),
  ])

  const points = profile?.loyalty_points || 0

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-thunder-dark">Membership & Loyalty</h1>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">Your Thunder membership status and rewards.</p>
      </div>

      {/* Loyalty Points */}
      <div className="card p-5 bg-gradient-to-br from-brand-500 to-brand-700 text-[var(--text)] mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--text-2)] text-sm">Thunder Points</p>
            <p className="text-4xl font-bold font-display mt-1">{points.toLocaleString()}</p>
            <p className="text-[var(--text-2)] text-xs mt-1">₱1 spent = 1 point · 100 pts = ₱10 discount</p>
          </div>
          <Star className="w-12 h-12 text-[var(--text)]/20" />
        </div>
        {points >= 100 && (
          <div className="mt-3 bg-[var(--surface)]/20 rounded-xl px-3 py-2 text-sm">
            🎉 You can redeem <strong>{Math.floor(points / 100) * 10} pesos</strong> on your next booking!
          </div>
        )}
      </div>

      {/* Active Membership */}
      {membership ? (
        <div className="card p-5 border-brand-200 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-thunder-gold/10 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-thunder-gold" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-thunder-dark">{membership.membership_plans?.name}</p>
                <span className="badge-gold text-xs">Active</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-3">{membership.membership_plans?.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="bg-[var(--bg-2)] rounded-lg p-2">
                  <p className="text-[var(--text-muted)] text-xs">Uses Remaining</p>
                  <p className="font-bold text-thunder-dark">{membership.uses_remaining ?? '—'}</p>
                </div>
                <div className="bg-[var(--bg-2)] rounded-lg p-2">
                  <p className="text-[var(--text-muted)] text-xs">Valid Until</p>
                  <p className="font-bold text-thunder-dark">{membership.expires_at ? formatDate(membership.expires_at) : 'No expiry'}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Member since {formatDate(membership.created_at)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5 border-dashed border-2 border-[var(--border)] text-center mb-6">
          <Crown className="w-8 h-8 text-[var(--text-2)] mx-auto mb-2" />
          <p className="font-semibold text-thunder-dark mb-1">No Active Membership</p>
          <p className="text-sm text-[var(--text-muted)] mb-3">I-avail ang membership para makatipid sa bawat booking.</p>
        </div>
      )}

      {/* Plans */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Available Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(plans || []).map(plan => (
          <div key={plan.id} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-brand-500" />
              <p className="font-bold text-thunder-dark">{plan.name}</p>
            </div>
            <p className="text-2xl font-bold text-brand-600 mb-1">{formatPrice(plan.price)}</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">{plan.description}</p>
            {plan.perks && (
              <ul className="space-y-1 mb-4">
                {(Array.isArray(plan.perks) ? plan.perks : JSON.parse(plan.perks || '[]')).map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {perk}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/book" className="btn-primary w-full text-center block !py-2 !text-sm">
              <Gift className="w-3.5 h-3.5 inline mr-1" /> Avail Plan
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

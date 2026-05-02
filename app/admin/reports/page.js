import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice } from '@/lib/pricing'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const RANGE_OPTIONS = ['7', '30', '90']

function startOfDay(days) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - days + 1)
  return date
}

function monthKey(date) {
  return new Date(date).toISOString().slice(0, 7)
}

function safeDate(value) {
  return value ? new Date(value) : null
}

function average(values = []) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export default async function ReportsPage({ searchParams }) {
  const range = RANGE_OPTIONS.includes(String(searchParams?.range || '30')) ? String(searchParams?.range || '30') : '30'
  const days = Number(range)
  const fromDate = startOfDay(days)
  const fromIso = fromDate.toISOString()
  const fromDay = fromIso.slice(0, 10)
  const admin = createAdminClient()

  const [
    { data: bookings },
    { data: payments },
    { data: expenses },
    { data: upcoming },
    { data: history },
    { data: staff },
  ] = await Promise.all([
    admin
      .from('bookings')
      .select('id, user_id, rider_id, status, total_price, subtotal, travel_fee, discount_amount, city, barangay, created_at, updated_at, booking_services(service_name)')
      .order('created_at', { ascending: false }),
    admin.from('payments').select('amount, created_at, status').eq('status', 'paid').gte('created_at', fromIso),
    admin.from('expenses').select('amount, date').gte('date', fromDay),
    admin.from('bookings').select('total_price').gte('scheduled_date', new Date().toISOString().slice(0, 10)).in('status', ['confirmed', 'assigned', 'on_the_way', 'rescheduled']),
    admin.from('booking_status_history').select('booking_id, to_status, created_at'),
    admin.from('staff').select('id, user_id, is_available, current_job_count, jobs_completed, on_time_count, late_count, no_show_count'),
  ])

  const allBookings = bookings || []
  const inRangeBookings = allBookings.filter(booking => new Date(booking.created_at) >= fromDate)
  const paidPayments = payments || []
  const expenseRows = expenses || []
  const historyRows = history || []
  const staffRows = staff || []

  const firstBookingByUser = new Map()
  for (const booking of [...allBookings].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))) {
    if (!firstBookingByUser.has(booking.user_id)) {
      firstBookingByUser.set(booking.user_id, booking.created_at)
    }
  }

  const repeatSegments = inRangeBookings.reduce((acc, booking) => {
    const firstBookingDate = firstBookingByUser.get(booking.user_id)
    if (firstBookingDate && new Date(firstBookingDate) >= fromDate) acc.firstTime += 1
    else acc.repeat += 1
    return acc
  }, { firstTime: 0, repeat: 0 })

  const serviceBreakdownMap = {}
  for (const booking of inRangeBookings) {
    for (const service of booking.booking_services || []) {
      serviceBreakdownMap[service.service_name] = (serviceBreakdownMap[service.service_name] || 0) + 1
    }
  }
  const serviceBreakdown = Object.entries(serviceBreakdownMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const revenueByDay = new Map()
  for (const payment of paidPayments) {
    const day = payment.created_at.slice(0, 10)
    revenueByDay.set(day, (revenueByDay.get(day) || 0) + Number(payment.amount || 0))
  }
  const dailyRevenue = [...revenueByDay.entries()]
    .map(([date, revenue]) => ({ date, label: formatDate(date, 'MMM dd'), revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
  const maxDailyRevenue = Math.max(...dailyRevenue.map(item => item.revenue), 1)

  const completionByBooking = new Map()
  for (const row of historyRows) {
    if (row.to_status === 'completed' && !completionByBooking.has(row.booking_id)) {
      completionByBooking.set(row.booking_id, row.created_at)
    }
  }

  const completionHours = inRangeBookings
    .filter(booking => booking.status === 'completed')
    .map(booking => {
      const completedAt = safeDate(completionByBooking.get(booking.id) || booking.updated_at)
      const createdAt = safeDate(booking.created_at)
      if (!completedAt || !createdAt) return null
      return (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    })
    .filter(value => Number.isFinite(value) && value >= 0)

  const lateCount = staffRows.reduce((sum, member) => sum + Number(member.late_count || 0), 0)
  const onTimeCount = staffRows.reduce((sum, member) => sum + Number(member.on_time_count || 0), 0)
  const lateArrivalRate = lateCount + onTimeCount > 0 ? (lateCount / (lateCount + onTimeCount)) * 100 : 0
  const availableStaff = staffRows.filter(member => member.is_available)
  const busyStaff = availableStaff.filter(member => Number(member.current_job_count || 0) > 0)
  const staffUtilization = availableStaff.length ? (busyStaff.length / availableStaff.length) * 100 : 0

  const cancelledCount = inRangeBookings.filter(booking => booking.status === 'cancelled').length
  const completedCount = inRangeBookings.filter(booking => booking.status === 'completed').length
  const totalRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalExpenses = expenseRows.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const avgRevenuePerBooking = inRangeBookings.length ? totalRevenue / inRangeBookings.length : 0
  const forecastNext7 = (upcoming || []).reduce((sum, booking) => sum + Number(booking.total_price || 0), 0)

  const areaDemandMap = new Map()
  for (const booking of inRangeBookings) {
    const key = `${booking.city || 'Unknown'}|${booking.barangay || 'Unknown'}`
    const existing = areaDemandMap.get(key) || {
      city: booking.city || 'Unknown',
      barangay: booking.barangay || 'Unknown',
      bookings: 0,
      revenue: 0,
    }
    existing.bookings += 1
    existing.revenue += Number(booking.total_price || 0)
    areaDemandMap.set(key, existing)
  }
  const areaDemand = [...areaDemandMap.values()].sort((a, b) => b.bookings - a.bookings).slice(0, 8)
  const maxAreaBookings = Math.max(...areaDemand.map(item => item.bookings), 1)

  const cohortMap = new Map()
  const bookingCountByUser = new Map()
  for (const booking of allBookings) {
    bookingCountByUser.set(booking.user_id, (bookingCountByUser.get(booking.user_id) || 0) + 1)
  }
  for (const [userId, firstDate] of firstBookingByUser.entries()) {
    const key = monthKey(firstDate)
    const existing = cohortMap.get(key) || { month: key, newCustomers: 0, repeatCustomers: 0 }
    existing.newCustomers += 1
    if ((bookingCountByUser.get(userId) || 0) > 1) existing.repeatCustomers += 1
    cohortMap.set(key, existing)
  }
  const cohorts = [...cohortMap.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-6)

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">Reports & Analytics</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Track growth, repeat behavior, operational health, and location demand.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map(option => (
            <Link
              key={option}
              href={`/admin/reports?range=${option}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${range === option ? 'bg-brand-500 text-[var(--text)]' : 'bg-[var(--bg-2)] text-[var(--text-2)] hover:bg-brand-50'}`}
            >
              {option}d
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Revenue', value: formatPrice(totalRevenue) },
          { label: 'Expenses', value: formatPrice(totalExpenses) },
          { label: 'Net Profit', value: formatPrice(totalRevenue - totalExpenses) },
          { label: 'Bookings', value: inRangeBookings.length },
          { label: 'Completed', value: completedCount },
          { label: 'Avg. Value', value: formatPrice(avgRevenuePerBooking) },
        ].map(item => (
          <div key={item.label} className="card p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</div>
            <div className="mt-2 text-xl font-display text-thunder-dark">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold font-display text-thunder-dark">Daily Revenue</h2>
              <p className="text-sm text-[var(--text-muted)]">Paid collections across the last 14 recorded days in this range.</p>
            </div>
            <div className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">
              Upcoming confirmed value: <strong>{formatPrice(forecastNext7)}</strong>
            </div>
          </div>
          <div className="space-y-3">
            {dailyRevenue.length === 0 && <div className="text-sm text-[var(--text-muted)]">No paid revenue in this period.</div>}
            {dailyRevenue.map(item => (
              <div key={item.date}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-thunder-dark">{item.label}</span>
                  <span className="text-[var(--text-muted)]">{formatPrice(item.revenue)}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-2)]">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.max((item.revenue / maxDailyRevenue) * 100, 6)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold font-display text-thunder-dark">Service Mix</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">Top services requested inside the selected window.</p>
          <div className="space-y-3">
            {serviceBreakdown.length === 0 && <div className="text-sm text-[var(--text-muted)]">No service data yet.</div>}
            {serviceBreakdown.map(item => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                <span className="text-sm text-thunder-dark">{item.name}</span>
                <span className="text-sm font-semibold text-[var(--text-muted)]">{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card p-5">
          <h2 className="font-bold font-display text-thunder-dark">Repeat Booking</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">First-time vs returning bookings in the selected range.</p>
          <div className="space-y-3">
            <div className="rounded-xl bg-[var(--bg-2)] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">First-Time</div>
              <div className="mt-1 text-2xl font-display text-thunder-dark">{repeatSegments.firstTime}</div>
            </div>
            <div className="rounded-xl bg-[var(--bg-2)] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Repeat</div>
              <div className="mt-1 text-2xl font-display text-thunder-dark">{repeatSegments.repeat}</div>
            </div>
          </div>
        </section>

        <section className="card p-5 xl:col-span-2">
          <h2 className="font-bold font-display text-thunder-dark">Customer Cohorts</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">How many customers started in each month and how many returned for another booking.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="pb-3 font-semibold text-[var(--text-muted)]">Cohort</th>
                  <th className="pb-3 font-semibold text-[var(--text-muted)]">New Customers</th>
                  <th className="pb-3 font-semibold text-[var(--text-muted)]">Returned Later</th>
                  <th className="pb-3 font-semibold text-[var(--text-muted)]">Repeat Rate</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map(cohort => {
                  const repeatRate = cohort.newCustomers ? (cohort.repeatCustomers / cohort.newCustomers) * 100 : 0
                  return (
                    <tr key={cohort.month} className="border-b border-[var(--border)]">
                      <td className="py-3 text-thunder-dark">{cohort.month}</td>
                      <td className="py-3 text-[var(--text-muted)]">{cohort.newCustomers}</td>
                      <td className="py-3 text-[var(--text-muted)]">{cohort.repeatCustomers}</td>
                      <td className="py-3 text-brand-600">{repeatRate.toFixed(1)}%</td>
                    </tr>
                  )
                })}
                {cohorts.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-[var(--text-muted)]">No cohort data yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className="card p-5">
          <h2 className="font-bold font-display text-thunder-dark">Operational KPIs</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">Snapshot of service delivery performance and staff load.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { label: 'Avg Completion Time', value: `${average(completionHours).toFixed(1)} hrs` },
              { label: 'Late Arrival Rate', value: `${lateArrivalRate.toFixed(1)}%` },
              { label: 'Cancellation Rate', value: `${inRangeBookings.length ? ((cancelledCount / inRangeBookings.length) * 100).toFixed(1) : '0.0'}%` },
              { label: 'Staff Utilization', value: `${staffUtilization.toFixed(1)}%` },
              { label: 'Busy Staff', value: `${busyStaff.length}/${availableStaff.length || 0}` },
              { label: 'Jobs Completed', value: staffRows.reduce((sum, member) => sum + Number(member.jobs_completed || 0), 0) },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-[var(--border)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</div>
                <div className="mt-2 text-xl font-display text-thunder-dark">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold font-display text-thunder-dark">Area Demand Heatmap</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">Top booking sources by city and barangay in the selected range.</p>
          <div className="space-y-3">
            {areaDemand.length === 0 && <div className="text-sm text-[var(--text-muted)]">No demand data in this period.</div>}
            {areaDemand.map(area => (
              <div key={`${area.city}-${area.barangay}`} className="rounded-2xl border border-[var(--border)] p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-thunder-dark">{area.barangay}</div>
                    <div className="text-xs text-[var(--text-muted)]">{area.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-thunder-dark">{area.bookings} bookings</div>
                    <div className="text-xs text-[var(--text-muted)]">{formatPrice(area.revenue)}</div>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-2)]">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.max((area.bookings / maxAreaBookings) * 100, 8)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

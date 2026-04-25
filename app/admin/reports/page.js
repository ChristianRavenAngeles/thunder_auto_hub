'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Calendar, Download, DollarSign } from 'lucide-react'
import { formatPrice } from '@/lib/pricing'
import { formatDate } from '@/lib/utils'

export default function ReportsPage() {
  const supabase = createClient()
  const [range, setRange]           = useState('30')
  const [bookingsByDay, setByDay]   = useState([])
  const [serviceBreakdown, setByService] = useState([])
  const [summary, setSummary]       = useState({})
  const [forecast, setForecast]     = useState({ next7: 0, next30: 0 })
  const [expenses, setExpenses]     = useState(0)
  const [loading, setLoading]       = useState(true)

  useEffect(() => { loadData() }, [range])

  async function loadData() {
    setLoading(true)
    const days = parseInt(range)
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [
      { data: bookings },
      { data: payments },
      { data: expenseData },
      { data: upcoming },
    ] = await Promise.all([
      supabase.from('bookings').select('*').gte('created_at', from).order('created_at'),
      supabase.from('payments').select('amount, created_at').eq('status', 'paid').gte('created_at', from),
      supabase.from('expenses').select('amount').gte('date', from.split('T')[0]),
      supabase.from('bookings').select('total_price').gte('scheduled_date', new Date().toISOString().split('T')[0]).in('status', ['confirmed', 'assigned']),
    ])

    // Daily revenue
    const dailyMap = {}
    payments?.forEach(p => {
      const day = p.created_at.split('T')[0]
      dailyMap[day] = (dailyMap[day] || 0) + p.amount
    })
    const dailyData = Object.entries(dailyMap).map(([date, revenue]) => ({
      date: formatDate(date, 'MMM dd'),
      revenue,
    })).slice(-14)
    setByDay(dailyData)

    // Service breakdown from bookings
    const svcMap = {}
    bookings?.forEach(b => {
      // Counted by reference — will be enhanced when booking_services joined
    })

    const totalRevenue = payments?.reduce((s, p) => s + p.amount, 0) || 0
    const totalExpenses = expenseData?.reduce((s, e) => s + e.amount, 0) || 0
    const forecastNext7 = upcoming?.filter(b => true).reduce((s, b) => s + b.total_price, 0) || 0

    setSummary({
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      totalBookings: bookings?.length || 0,
      completedBookings: bookings?.filter(b => b.status === 'completed').length || 0,
      avgBookingValue: bookings?.length ? totalRevenue / bookings.length : 0,
    })
    setForecast({ next7: forecastNext7 })
    setExpenses(totalExpenses)
    setLoading(false)
  }

  async function exportCSV() {
    const days = parseInt(range)
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('bookings')
      .select('reference_no, status, scheduled_date, barangay, city, total_price, payment_status, created_at, profiles(full_name, phone)')
      .gte('created_at', from)
      .order('created_at', { ascending: false })

    const rows = [
      ['Ref No', 'Customer', 'Phone', 'Date', 'Location', 'Total', 'Payment', 'Status', 'Created'],
      ...(data || []).map(b => [
        b.reference_no, b.profiles?.full_name, b.profiles?.phone,
        b.scheduled_date, `${b.barangay}, ${b.city}`, b.total_price,
        b.payment_status, b.status, b.created_at,
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `thunder-report-${range}d.csv`; a.click()
  }

  const COLORS = ['#0694a2', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444']

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold font-display text-thunder-dark">Reports & Analytics</h1>
        <div className="flex flex-wrap gap-2">
          {['7', '30', '90'].map(d => (
            <button key={d} onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${range === d ? 'bg-brand-500 text-[var(--text)]' : 'bg-[var(--bg-2)] text-[var(--text-2)] hover:bg-brand-50'}`}>
              {d}d
            </button>
          ))}
          <button onClick={exportCSV} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Revenue',       value: formatPrice(summary.totalRevenue || 0),    icon: TrendingUp, color: 'text-brand-500' },
          { label: 'Expenses',      value: formatPrice(summary.totalExpenses || 0),   icon: DollarSign, color: 'text-red-500'   },
          { label: 'Net Profit',    value: formatPrice(summary.profit || 0),          icon: TrendingUp, color: 'text-green-500' },
          { label: 'Bookings',      value: summary.totalBookings || 0,               icon: Calendar,   color: 'text-purple-500'},
          { label: 'Completed',     value: summary.completedBookings || 0,           icon: Calendar,   color: 'text-green-500' },
          { label: 'Avg. Value',    value: formatPrice(summary.avgBookingValue || 0), icon: Users,      color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <div className="text-lg font-bold font-display text-thunder-dark">{s.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue forecast */}
      <div className="card p-4 bg-brand-50 border-brand-100 flex items-center gap-4">
        <TrendingUp className="w-8 h-8 text-brand-500" />
        <div>
          <p className="font-bold text-thunder-dark">Revenue Forecast</p>
          <p className="text-sm text-[var(--text-2)]">Confirmed upcoming bookings: <strong className="text-brand-600">{formatPrice(forecast.next7)}</strong></p>
        </div>
      </div>

      {/* Daily revenue chart */}
      <div className="card p-5">
        <h2 className="font-bold font-display text-thunder-dark mb-4">Daily Revenue (last 14 days)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={bookingsByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₱${v.toLocaleString()}`} />
            <Tooltip formatter={v => formatPrice(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Bar dataKey="revenue" fill="#0694a2" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

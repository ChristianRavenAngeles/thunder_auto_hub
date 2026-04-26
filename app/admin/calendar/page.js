'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_DOT = {
  pending:    '#FCD34D',
  confirmed:  '#34D399',
  rescheduled:'#A78BFA',
  in_progress:'#FB923C',
  completed:  '#34D399',
  cancelled:  '#F87171',
  no_show:    '#9CA3AF',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function pad(n) { return String(n).padStart(2, '0') }

export default function AdminCalendarPage() {
  const supabase = createClient()
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth())
  const [bookings, setBookings] = useState([])
  const [selected, setSelected] = useState(null) // { date, list }
  const [detail, setDetail]   = useState(null)

  useEffect(() => {
    loadBookings()
  }, [year, month])

  async function loadBookings() {
    const firstDay = `${year}-${pad(month + 1)}-01`
    const lastDay  = `${year}-${pad(month + 1)}-${new Date(year, month + 1, 0).getDate()}`
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles(full_name, phone), vehicles(make, model), booking_services(service_name)')
      .gte('scheduled_date', firstDay)
      .lte('scheduled_date', lastDay)
      .not('status', 'in', '("cancelled")')
      .order('scheduled_time')
      .limit(500)
    setBookings(data || [])
  }

  // Group by date
  const byDate = bookings.reduce((acc, b) => {
    if (!b.scheduled_date) return acc
    if (!acc[b.scheduled_date]) acc[b.scheduled_date] = []
    acc[b.scheduled_date].push(b)
    return acc
  }, {})

  // Calendar grid
  const firstOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const cells = []
  for (let i = 0; i < firstOfMonth; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ maxWidth: 1100 }}>
      <style>{`@keyframes cal-fade { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 28, letterSpacing: '.04em', color: '#FFFFFF', margin: 0 }}>CALENDAR</h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Monthly booking overview.</p>
        </div>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 8, background: '#141414', border: '1px solid #2A2A2A', color: '#CFCFCF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 16, letterSpacing: '.08em', color: '#FFFFFF', minWidth: 160, textAlign: 'center' }}>
            {MONTHS[month].toUpperCase()} {year}
          </div>
          <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 8, background: '#141414', border: '1px solid #2A2A2A', color: '#CFCFCF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <div className={selected ? 'adm-cal-layout' : 'adm-cal-layout-single'}>
        {/* Calendar grid */}
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #2A2A2A' }}>
            {DAYS.map(d => (
              <div key={d} style={{
                padding: '12px 0', textAlign: 'center',
                fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10, letterSpacing: '.12em', color: '#666',
              }}>{d.toUpperCase()}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} style={{ minHeight: 88, borderRight: '1px solid #1C1C1C', borderBottom: '1px solid #1C1C1C' }} />
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
              const dayBookings = byDate[dateStr] || []
              const isToday = dateStr === todayStr
              const isSelected = selected?.date === dateStr
              return (
                <div
                  key={day}
                  onClick={() => setSelected(dayBookings.length > 0 || isSelected ? (isSelected ? null : { date: dateStr, list: dayBookings }) : null)}
                  style={{
                    minHeight: 88, padding: 8, borderRight: '1px solid #1C1C1C', borderBottom: '1px solid #1C1C1C',
                    cursor: dayBookings.length > 0 ? 'pointer' : 'default',
                    background: isSelected ? 'rgba(255,210,0,.06)' : 'transparent',
                    transition: 'background .1s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (dayBookings.length > 0 && !isSelected) e.currentTarget.style.background = '#1C1C1C' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 4,
                    background: isToday ? '#FFD200' : 'transparent',
                    fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13,
                    color: isToday ? '#0B0B0B' : isSelected ? '#FFD200' : '#CFCFCF',
                  }}>{day}</div>
                  {/* Booking dots / chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayBookings.slice(0, 3).map(b => (
                      <div key={b.id} style={{
                        height: 18, borderRadius: 4, padding: '0 5px',
                        background: `${STATUS_DOT[b.status] || '#666'}22`,
                        borderLeft: `2px solid ${STATUS_DOT[b.status] || '#666'}`,
                        fontSize: 10, color: STATUS_DOT[b.status] || '#666', fontFamily: 'var(--font-cond)',
                        fontWeight: 700, letterSpacing: '.02em',
                        display: 'flex', alignItems: 'center', overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}>
                        {b.scheduled_time?.slice(0, 5) || ''} {b.profiles?.full_name?.split(' ')[0] || ''}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div style={{ fontSize: 10, color: '#666', fontFamily: 'var(--font-cond)', paddingLeft: 4 }}>+{dayBookings.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Side panel */}
        {selected && (
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden', animation: 'cal-fade .2s ease' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em', color: '#FFD200' }}>
                  {new Date(selected.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{selected.list.length} booking{selected.list.length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {selected.list.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#666', fontSize: 13 }}>No bookings this day.</div>
              ) : selected.list.map(b => (
                <div
                  key={b.id}
                  onClick={() => setDetail(b)}
                  style={{ padding: '14px 16px', borderBottom: '1px solid #1C1C1C', cursor: 'pointer', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, color: '#CFCFCF' }}>
                      {b.scheduled_time || '—'}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20,
                      background: `${STATUS_DOT[b.status] || '#666'}22`, color: STATUS_DOT[b.status] || '#666',
                      fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 9, letterSpacing: '.08em',
                    }}>{b.status?.toUpperCase().replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginBottom: 2 }}>{b.profiles?.full_name || 'Guest'}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {b.booking_services?.map(s => s.service_name).join(', ') || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDetail(null)}>
          <div style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 16, padding: 28, maxWidth: 440, width: '100%', animation: 'cal-fade .2s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 18, letterSpacing: '.06em', color: '#FFFFFF' }}>
                {detail.reference_no || 'Booking Details'}
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {[
              { label: 'Customer', value: detail.profiles?.full_name || '—' },
              { label: 'Phone', value: detail.profiles?.phone || '—' },
              { label: 'Vehicle', value: detail.vehicles ? `${detail.vehicles.make} ${detail.vehicles.model}` : '—' },
              { label: 'Services', value: detail.booking_services?.map(s => s.service_name).join(', ') || '—' },
              { label: 'Date', value: detail.scheduled_date || '—' },
              { label: 'Time', value: detail.scheduled_time || '—' },
              { label: 'Location', value: [detail.barangay, detail.city].filter(Boolean).join(', ') || '—' },
              { label: 'Total', value: detail.total_price ? `₱${Number(detail.total_price).toLocaleString()}` : '—', gold: true },
              { label: 'Status', value: detail.status?.replace('_', ' ').toUpperCase() || '—' },
            ].map(({ label, value, gold }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2A2A2A' }}>
                <span style={{ fontSize: 12, color: '#666', fontFamily: 'var(--font-cond)', letterSpacing: '.06em' }}>{label.toUpperCase()}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: gold ? '#FFD200' : '#CFCFCF', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
              </div>
            ))}
            <button onClick={() => setDetail(null)} style={{
              width: '100%', marginTop: 20, height: 40, borderRadius: 8, background: '#2A2A2A', border: 'none',
              color: '#CFCFCF', cursor: 'pointer', fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: '.08em',
            }}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  )
}

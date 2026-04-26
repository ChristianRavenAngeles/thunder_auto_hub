import { revalidatePath } from 'next/cache'
import { CalendarClock, Plus, Save, Trash2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buildTimeSlots, displayTime, getBusinessDays, getSetting, settingsFromRows } from '@/lib/availability'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Availability - Admin' }

const DAYS = [
  [0, 'Sun'],
  [1, 'Mon'],
  [2, 'Tue'],
  [3, 'Wed'],
  [4, 'Thu'],
  [5, 'Fri'],
  [6, 'Sat'],
]

async function currentUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

async function saveScheduleSettings(formData) {
  'use server'

  const admin = createAdminClient()
  const userId = await currentUserId()
  const days = formData.getAll('business_days').map(Number)
  const rows = [
    ['business_hours_start', formData.get('business_hours_start') || '08:00', 'Business opening time'],
    ['business_hours_end', formData.get('business_hours_end') || '18:00', 'Business closing time'],
    ['business_days', days, 'Operating days (0=Sun, 6=Sat)'],
    ['slot_interval_minutes', Number(formData.get('slot_interval_minutes') || 60), 'Minutes between booking slots'],
    ['max_bookings_per_slot', Number(formData.get('max_bookings_per_slot') || 1), 'Maximum active bookings allowed in the same slot'],
  ].map(([key, value, description]) => ({
    key,
    value,
    description,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }))

  await admin.from('settings').upsert(rows)
  revalidatePath('/admin/availability')
}

async function addBlackoutDate(formData) {
  'use server'

  const date = String(formData.get('date') || '')
  if (!date) return
  const admin = createAdminClient()
  await admin.from('blackout_dates').upsert({
    date,
    reason: String(formData.get('reason') || '').trim() || null,
    created_by: await currentUserId(),
  }, { onConflict: 'date' })
  revalidatePath('/admin/availability')
}

async function deleteBlackoutDate(formData) {
  'use server'

  const id = formData.get('id')
  if (!id) return
  await createAdminClient().from('blackout_dates').delete().eq('id', id)
  revalidatePath('/admin/availability')
}

async function addSlotBlock(formData) {
  'use server'

  const date = String(formData.get('date') || '')
  if (!date) return

  const isFullDay = formData.get('is_full_day') === 'on'
  const start = String(formData.get('start_time') || '')
  const end = String(formData.get('end_time') || '')
  if (!isFullDay && (!start || !end)) return

  await createAdminClient().from('booking_slot_blocks').insert({
    date,
    start_time: isFullDay ? null : start,
    end_time: isFullDay ? null : end,
    is_full_day: isFullDay,
    reason: String(formData.get('reason') || '').trim() || null,
    created_by: await currentUserId(),
  })
  revalidatePath('/admin/availability')
}

async function deleteSlotBlock(formData) {
  'use server'

  const id = formData.get('id')
  if (!id) return
  await createAdminClient().from('booking_slot_blocks').delete().eq('id', id)
  revalidatePath('/admin/availability')
}

const inputStyle = {
  width: '100%',
  minHeight: 40,
  background: '#1C1C1C',
  border: '1px solid #2A2A2A',
  borderRadius: 8,
  color: '#FFFFFF',
  padding: '9px 11px',
  fontSize: 13,
  outline: 'none',
}

function Label({ children }) {
  return (
    <span style={{ display: 'block', fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: '.12em', color: '#666', marginBottom: 5 }}>
      {children}
    </span>
  )
}

function DeleteButton({ action, id }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" title="Delete" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #2A2A2A', background: '#1C1C1C', color: '#F87171', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
        <Trash2 size={14} />
      </button>
    </form>
  )
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminAvailabilityPage() {
  const admin = createAdminClient()
  const [settingsResult, blackoutsResult, blocksResult] = await Promise.all([
    admin.from('settings').select('key, value'),
    admin.from('blackout_dates').select('*').order('date', { ascending: true }).limit(100),
    admin.from('booking_slot_blocks').select('*').order('date', { ascending: true }).order('start_time', { ascending: true }).limit(100),
  ])

  const settings = settingsFromRows(settingsResult.data || [])
  const businessDays = getBusinessDays(settings)
  const slots = buildTimeSlots(settings)
  const blackouts = blackoutsResult.data || []
  const blocks = blocksResult.data || []

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 28, letterSpacing: '.04em', color: '#FFFFFF', margin: 0 }}>
            SLOT & CAPACITY
          </h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            Set service hours, blackout dates, per-slot capacity, and manual blocks for booking and rescheduling.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#CFCFCF', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 12px' }}>
          <CalendarClock size={16} color="#FFD200" />
          <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.08em', fontSize: 12 }}>{slots.length} SLOTS/DAY</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
        <section style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: 18 }}>
          <h2 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 17, letterSpacing: '.08em', color: '#FFFFFF', marginBottom: 14 }}>SCHEDULE RULES</h2>
          <form action={saveScheduleSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <label>
                <Label>OPEN</Label>
                <input type="time" name="business_hours_start" defaultValue={getSetting(settings, 'business_hours_start', '08:00')} style={inputStyle} />
              </label>
              <label>
                <Label>CLOSE</Label>
                <input type="time" name="business_hours_end" defaultValue={getSetting(settings, 'business_hours_end', '18:00')} style={inputStyle} />
              </label>
              <label>
                <Label>INTERVAL MINUTES</Label>
                <input type="number" min="15" step="15" name="slot_interval_minutes" defaultValue={getSetting(settings, 'slot_interval_minutes', 60)} style={inputStyle} />
              </label>
              <label>
                <Label>MAX PER SLOT</Label>
                <input type="number" min="1" name="max_bookings_per_slot" defaultValue={getSetting(settings, 'max_bookings_per_slot', 1)} style={inputStyle} />
              </label>
            </div>

            <div style={{ marginTop: 14 }}>
              <Label>OPERATING DAYS</Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DAYS.map(([value, label]) => (
                  <label key={value} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 72, background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 10px', color: '#CFCFCF', fontSize: 13 }}>
                    <input type="checkbox" name="business_days" value={value} defaultChecked={businessDays.includes(value)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {slots.slice(0, 16).map(slot => (
                <span key={slot.value} style={{ border: '1px solid #2A2A2A', background: '#1C1C1C', borderRadius: 20, padding: '5px 10px', color: '#CFCFCF', fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: '.06em' }}>
                  {displayTime(slot.value)}
                </span>
              ))}
              {slots.length > 16 && <span style={{ color: '#666', fontSize: 12, padding: '5px 0' }}>+{slots.length - 16} more</span>}
            </div>

            <button type="submit" style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFD200', color: '#0B0B0B', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.08em', fontSize: 13 }}>
              <Save size={14} /> SAVE RULES
            </button>
          </form>
        </section>

        <section style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: 18 }}>
          <h2 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 17, letterSpacing: '.08em', color: '#FFFFFF', marginBottom: 14 }}>BLACKOUT DATES</h2>
          <form action={addBlackoutDate} style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
            <input type="date" name="date" required style={inputStyle} />
            <input name="reason" placeholder="Reason" style={inputStyle} />
            <button type="submit" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 7, background: '#FFD200', color: '#0B0B0B', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.08em', fontSize: 12 }}>
              <Plus size={14} /> ADD BLACKOUT
            </button>
          </form>
          <div style={{ display: 'grid', gap: 8 }}>
            {blackouts.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 9, padding: 10 }}>
                <div>
                  <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600 }}>{formatDate(item.date)}</div>
                  <div style={{ color: '#666', fontSize: 12 }}>{item.reason || 'No reason'}</div>
                </div>
                <DeleteButton action={deleteBlackoutDate} id={item.id} />
              </div>
            ))}
            {!blackouts.length && <div style={{ color: '#666', fontSize: 13 }}>No blackout dates.</div>}
          </div>
        </section>
      </div>

      <section style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: 18, marginTop: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 17, letterSpacing: '.08em', color: '#FFFFFF', marginBottom: 14 }}>MANUAL BLOCKS</h2>
        <form action={addSlotBlock} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, alignItems: 'end', marginBottom: 16 }}>
          <label>
            <Label>DATE</Label>
            <input type="date" name="date" required style={inputStyle} />
          </label>
          <label>
            <Label>START</Label>
            <input type="time" name="start_time" style={inputStyle} />
          </label>
          <label>
            <Label>END</Label>
            <input type="time" name="end_time" style={inputStyle} />
          </label>
          <label>
            <Label>REASON</Label>
            <input name="reason" placeholder="Team meeting, weather, etc." style={inputStyle} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#CFCFCF', fontSize: 13, minHeight: 40 }}>
            <input type="checkbox" name="is_full_day" />
            Full day
          </label>
          <button type="submit" style={{ minHeight: 40, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 7, background: '#FFD200', color: '#0B0B0B', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontFamily: 'var(--font-cond)', fontWeight: 700, letterSpacing: '.08em', fontSize: 12 }}>
            <Plus size={14} /> ADD BLOCK
          </button>
        </form>

        <div style={{ display: 'grid', gap: 8 }}>
          {blocks.map(block => (
            <div key={block.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 9, padding: 10 }}>
              <div>
                <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600 }}>
                  {formatDate(block.date)} - {block.is_full_day ? 'Full day' : `${displayTime(block.start_time)} to ${displayTime(block.end_time)}`}
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>{block.reason || 'Manual block'}</div>
              </div>
              <DeleteButton action={deleteSlotBlock} id={block.id} />
            </div>
          ))}
          {!blocks.length && <div style={{ color: '#666', fontSize: 13 }}>No manual blocks.</div>}
        </div>
      </section>
    </div>
  )
}

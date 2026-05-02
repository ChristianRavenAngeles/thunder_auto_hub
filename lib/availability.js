export const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'rescheduled', 'in_progress']

const DEFAULT_SETTINGS = {
  business_hours_start: '08:00',
  business_hours_end: '18:00',
  business_days: [1, 2, 3, 4, 5],
  max_bookings_per_slot: 1,
  slot_interval_minutes: 60,
}

export function settingsFromRows(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.key] = decodeSettingValue(row.value)
    return acc
  }, {})
}

export function decodeSettingValue(value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function getSetting(settings = {}, key, fallback = DEFAULT_SETTINGS[key]) {
  const value = settings[key]
  return value === undefined || value === null || value === '' ? fallback : value
}

export function getBusinessDays(settings = {}) {
  const days = getSetting(settings, 'business_days', DEFAULT_SETTINGS.business_days)
  if (Array.isArray(days)) return days.map(Number)
  if (typeof days === 'string') {
    try {
      const parsed = JSON.parse(days)
      if (Array.isArray(parsed)) return parsed.map(Number)
    } catch {}
  }
  return DEFAULT_SETTINGS.business_days
}

export function getSlotCapacity(settings = {}) {
  return Math.max(1, Number(getSetting(settings, 'max_bookings_per_slot', 1)) || 1)
}

export function normalizeTime(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const ampm = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
  if (ampm) {
    let hour = Number(ampm[1])
    const minute = Number(ampm[2] || 0)
    const marker = ampm[3].toUpperCase()
    if (marker === 'PM' && hour < 12) hour += 12
    if (marker === 'AM' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  return raw.slice(0, 5)
}

export function displayTime(value) {
  const normalized = normalizeTime(value)
  if (!normalized) return '-'
  const [hourRaw, minute] = normalized.split(':')
  let hour = Number(hourRaw)
  const marker = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  return `${hour}:${minute} ${marker}`
}

function timeToMinutes(value) {
  const [hour, minute] = normalizeTime(value).split(':').map(Number)
  return (hour || 0) * 60 + (minute || 0)
}

function minutesToTime(value) {
  const hour = Math.floor(value / 60)
  const minute = value % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function isoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatSlotDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function buildTimeSlots(settings = {}) {
  const start = timeToMinutes(getSetting(settings, 'business_hours_start', DEFAULT_SETTINGS.business_hours_start))
  const end = timeToMinutes(getSetting(settings, 'business_hours_end', DEFAULT_SETTINGS.business_hours_end))
  const interval = Math.max(15, Number(getSetting(settings, 'slot_interval_minutes', 60)) || 60)
  const slots = []

  for (let cursor = start; cursor < end; cursor += interval) {
    slots.push({ value: minutesToTime(cursor), label: displayTime(minutesToTime(cursor)) })
  }

  return slots
}

export function isAllowedDate(dateStr, settings = {}, blackoutDates = []) {
  if (!dateStr) return false
  const candidate = new Date(`${dateStr}T00:00:00`)
  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const blocked = new Set(blackoutDates.map(row => typeof row === 'string' ? row : row.date))
  return candidate >= tomorrow
    && getBusinessDays(settings).includes(candidate.getDay())
    && !blocked.has(dateStr)
}

export function isSlotBlocked(dateStr, time, slotBlocks = [], blackoutDates = []) {
  const blockedDates = new Set(blackoutDates.map(row => typeof row === 'string' ? row : row.date))
  if (blockedDates.has(dateStr)) return true

  const slotMinutes = timeToMinutes(time)
  return slotBlocks.some(block => {
    if (block.date !== dateStr) return false
    if (block.is_full_day || !block.start_time || !block.end_time) return true
    return slotMinutes >= timeToMinutes(block.start_time) && slotMinutes < timeToMinutes(block.end_time)
  })
}

// Expands each booking across all hourly slots it occupies based on estimated_duration_hours.
// e.g. Interior Detailing (2 hrs) at 8AM blocks 8AM and 9AM.
export function buildOccupiedMap(bookings = [], excludeBookingId = null, settings = {}) {
  const map = new Map()
  const interval = Math.max(15, Number(getSetting(settings, 'slot_interval_minutes', 60)) || 60)

  bookings.forEach(booking => {
    if (excludeBookingId && booking.id === excludeBookingId) return
    if (!booking.scheduled_date || !booking.scheduled_time) return

    const startMins = timeToMinutes(normalizeTime(booking.scheduled_time))
    const durationMins = Math.max(interval, Math.round((Number(booking.estimated_duration_hours) || 1) * 60))
    const slotsSpanned = Math.ceil(durationMins / interval)

    for (let i = 0; i < slotsSpanned; i++) {
      const slotTime = minutesToTime(startMins + i * interval)
      const key = `${booking.scheduled_date}|${slotTime}`
      map.set(key, (map.get(key) || 0) + 1)
    }
  })
  return map
}

export function isSlotAvailable({ date, time, settings = {}, blackoutDates = [], slotBlocks = [], occupiedBookings = [], excludeBookingId = null, durationHours = 1 }) {
  const normalized = normalizeTime(time)
  if (!isAllowedDate(date, settings, blackoutDates)) return false
  if (!buildTimeSlots(settings).some(slot => slot.value === normalized)) return false

  const interval = Math.max(15, Number(getSetting(settings, 'slot_interval_minutes', 60)) || 60)
  const durationMins = Math.max(interval, Math.round(durationHours * 60))
  const slotsNeeded = Math.ceil(durationMins / interval)
  const startMins = timeToMinutes(normalized)
  const capacity = getSlotCapacity(settings)
  const occupied = buildOccupiedMap(occupiedBookings, excludeBookingId, settings)

  // Every slot the new booking would occupy must be free
  for (let i = 0; i < slotsNeeded; i++) {
    const slotTime = minutesToTime(startMins + i * interval)
    if (isSlotBlocked(date, slotTime, slotBlocks, blackoutDates)) return false
    if ((occupied.get(`${date}|${slotTime}`) || 0) >= capacity) return false
  }
  return true
}

export function buildAvailableSlotOptions({
  settings = {},
  blackoutDates = [],
  slotBlocks = [],
  occupiedBookings = [],
  excludeBookingId = null,
  days = 45,
  limit = 60,
} = {}) {
  const occupied = buildOccupiedMap(occupiedBookings, excludeBookingId, settings)
  const slots = buildTimeSlots(settings)
  const capacity = getSlotCapacity(settings)
  const options = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)

  for (let i = 0; i < days && options.length < limit; i += 1) {
    const date = isoDate(cursor)
    if (isAllowedDate(date, settings, blackoutDates)) {
      slots.forEach(slot => {
        if (options.length >= limit) return
        const used = occupied.get(`${date}|${slot.value}`) || 0
        if (used < capacity && !isSlotBlocked(date, slot.value, slotBlocks, blackoutDates)) {
          options.push({
            value: `${date}|${slot.value}`,
            date,
            time: slot.value,
            label: `${formatSlotDate(date)} - ${slot.label}`,
            remaining: capacity - used,
          })
        }
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return options
}

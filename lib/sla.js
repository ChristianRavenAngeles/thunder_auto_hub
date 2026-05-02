function bookingDateTime(booking) {
  if (!booking?.scheduled_date) return null
  const time = String(booking.scheduled_time || '08:00').slice(0, 5)
  return new Date(`${booking.scheduled_date}T${time}:00`)
}

function minutesBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 60000)
}

export function getBookingSlaAlerts(booking, options = {}) {
  const now = options.now ? new Date(options.now) : new Date()
  const scheduledAt = bookingDateTime(booking)
  const createdAt = booking?.created_at ? new Date(booking.created_at) : null
  const updatedAt = booking?.updated_at ? new Date(booking.updated_at) : createdAt
  const alerts = []

  if (booking?.status === 'pending' && createdAt) {
    const pendingMinutes = minutesBetween(now, createdAt)
    if (pendingMinutes >= 30) {
      alerts.push({
        key: 'overdue_confirmation',
        severity: pendingMinutes >= 120 ? 'high' : 'medium',
        label: 'Overdue confirmation',
        detail: `Pending for ${pendingMinutes} minutes without confirmation.`,
      })
    }
  }

  if (scheduledAt && ['confirmed', 'assigned', 'rescheduled'].includes(booking?.status)) {
    const minsToSchedule = minutesBetween(scheduledAt, now)
    if (minsToSchedule <= 0) {
      alerts.push({
        key: 'late_departure',
        severity: minsToSchedule <= -30 ? 'high' : 'medium',
        label: 'Late departure',
        detail: `Booking time passed ${Math.abs(minsToSchedule)} minutes ago and the team is not en route yet.`,
      })
    }
  }

  if (scheduledAt && booking?.status === 'on_the_way') {
    const minsPastSchedule = minutesBetween(now, scheduledAt)
    if (minsPastSchedule > 15) {
      alerts.push({
        key: 'delayed_arrival',
        severity: minsPastSchedule > 45 ? 'high' : 'medium',
        label: 'Delayed arrival',
        detail: `Team is still en route ${minsPastSchedule} minutes after the scheduled start.`,
      })
    }
  }

  if (booking?.status === 'in_progress' && updatedAt) {
    const activeMinutes = minutesBetween(now, updatedAt)
    if (activeMinutes >= 240) {
      alerts.push({
        key: 'long_running_job',
        severity: activeMinutes >= 360 ? 'high' : 'medium',
        label: 'Long-running job',
        detail: `Service has been active for ${Math.round(activeMinutes / 60)} hours.`,
      })
    }
  }

  return alerts
}

export function getSlaSeverityColor(severity = 'medium') {
  if (severity === 'high') return 'badge-red'
  if (severity === 'medium') return 'badge-gold'
  return 'badge-gray'
}

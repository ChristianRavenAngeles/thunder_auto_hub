export function buildDefaultChecklist(booking) {
  const serviceItems = (booking?.booking_services || [])
    .map(service => service.service_name)
    .filter(Boolean)
    .map(name => `Complete ${name}`)

  return [
    'Arrive and confirm customer details',
    'Inspect vehicle condition before service',
    ...serviceItems,
    'Capture before and after photos',
    'Walk through results with customer',
  ]
}

export function getNextRiderStatusOptions(status) {
  if (status === 'confirmed' || status === 'assigned' || status === 'rescheduled') {
    return ['on_the_way']
  }
  if (status === 'on_the_way') return ['in_progress']
  if (status === 'in_progress') return ['completed']
  return []
}

export function countdownFromEta(booking) {
  if (!booking?.eta_minutes || booking?.status !== 'on_the_way' || !booking?.updated_at) return null
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(booking.updated_at).getTime()) / 60000)
  )
  return Math.max(0, Number(booking.eta_minutes || 0) - elapsedMinutes)
}

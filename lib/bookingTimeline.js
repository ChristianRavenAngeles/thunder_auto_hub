export const BOOKING_TIMELINE_STEPS = [
  { key: 'pending', label: 'Booked', description: 'Your booking has been received.' },
  { key: 'confirmed', label: 'Confirmed', description: 'Your schedule has been confirmed.' },
  { key: 'assigned', label: 'Assigned', description: 'A team has been assigned to your booking.' },
  { key: 'on_the_way', label: 'En Route', description: 'Our team is on the way to your location.' },
  { key: 'in_progress', label: 'In Service', description: 'Your vehicle is currently being serviced.' },
  { key: 'completed', label: 'Completed', description: 'The booked service has been completed.' },
  { key: 'reviewed', label: 'Reviewed', description: 'Customer feedback has been submitted.' },
]

export function getTimelineStatusKey(status, hasReview = false) {
  if (hasReview) return 'reviewed'
  if (status === 'rescheduled') return 'confirmed'
  if (status === 'cancelled' || status === 'no_show') return status
  return status || 'pending'
}

export function buildBookingTimeline(status, options = {}) {
  const hasReview = Boolean(options.hasReview)
  const currentKey = getTimelineStatusKey(status, hasReview)
  const currentIndex = BOOKING_TIMELINE_STEPS.findIndex(step => step.key === currentKey)

  return BOOKING_TIMELINE_STEPS.map((step, index) => ({
    ...step,
    state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming',
  }))
}

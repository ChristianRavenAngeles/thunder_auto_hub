import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date, fmt = 'MMM dd, yyyy') {
  if (!date) return ''
  return format(new Date(date), fmt)
}

export function formatDateTime(date) {
  if (!date) return ''
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

export function timeAgo(date) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatPhilTime(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(str, length = 60) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const BOOKING_STATUS_LABELS = {
  pending:     { label: 'Pending',      color: 'badge-gray'   },
  confirmed:   { label: 'Confirmed',    color: 'badge-teal'   },
  assigned:    { label: 'Rider Assigned', color: 'badge-teal' },
  on_the_way:  { label: 'On the Way',   color: 'badge-gold'   },
  in_progress: { label: 'In Progress',  color: 'badge-gold'   },
  completed:   { label: 'Completed',    color: 'badge-green'  },
  cancelled:   { label: 'Cancelled',    color: 'badge-red'    },
  rescheduled: { label: 'Rescheduled',  color: 'badge-purple' },
  no_show:     { label: 'No Show',      color: 'badge-red'    },
}

export const PAYMENT_STATUS_LABELS = {
  pending:      { label: 'Pending',       color: 'badge-gray'  },
  deposit_paid: { label: 'Deposit Paid',  color: 'badge-gold'  },
  partial:      { label: 'Partial',       color: 'badge-gold'  },
  paid:         { label: 'Paid',          color: 'badge-green' },
  refunded:     { label: 'Refunded',      color: 'badge-purple'},
  failed:       { label: 'Failed',        color: 'badge-red'   },
}

export const LEAD_STATUS_LABELS = {
  new:       { label: 'New',       color: 'badge-teal'   },
  contacted: { label: 'Contacted', color: 'badge-gold'   },
  booked:    { label: 'Booked',    color: 'badge-green'  },
  lost:      { label: 'Lost',      color: 'badge-red'    },
  nurture:   { label: 'Nurture',   color: 'badge-purple' },
}

export function generateReferralLink(code) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/ref/${code}`
}

export function generateBookingStatusLink(refNo) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/track/${refNo}`
}

export function generateReviewLink(bookingId) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/review/${bookingId}`
}

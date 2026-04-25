'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star, Send, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ReviewPage() {
  const { bookingId } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [booking, setBooking] = useState(null)
  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [comment, setComment] = useState('')
  const [done, setDone]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId]   = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id))
    supabase.from('bookings').select('*, booking_services(service_name), vehicles(make, model)').eq('id', bookingId).single()
      .then(({ data }) => setBooking(data))
  }, [bookingId])

  async function submitReview() {
    if (rating === 0) return toast.error('Pumili ng rating.')
    setLoading(true)
    await supabase.from('reviews').insert({
      booking_id: bookingId,
      user_id:    userId,
      rating,
      comment,
      is_public:  true,
    })
    // Update booking as reviewed
    await supabase.from('bookings').update({ notes: booking?.notes }).eq('id', bookingId)
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-8 max-w-sm text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold font-display text-thunder-dark mb-1">Salamat sa Review! 🙏</h2>
        <p className="text-[var(--text-muted)] text-sm mb-4">Malaki ang tulong ng inyong feedback para mapabuti namin ang serbisyo.</p>
        <Link href="/" className="btn-primary inline-block">Back to Home</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold font-display text-thunder-dark mb-1">I-rate ang Aming Serbisyo</h2>
          {booking && (
            <p className="text-sm text-[var(--text-muted)]">
              {booking.booking_services?.map(s => s.service_name).join(', ')} —
              {booking.vehicles ? ` ${booking.vehicles.make} ${booking.vehicles.model}` : ''}
            </p>
          )}
        </div>

        {/* Star rating */}
        <div className="flex justify-center gap-2 mb-5">
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star className={cn('w-10 h-10 transition-colors', (hover || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-2)]')} />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm font-medium text-brand-600 mb-4">
            {['', 'Hindi OK', 'Pwede na', 'Maganda', 'Napakaganda', 'Perpekto! 🔥'][rating]}
          </p>
        )}

        <div>
          <label className="label">Additional Comments (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Ano ang pinaka-nagustuhan ninyo? May improvements na gustong i-suggest?"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        <button onClick={submitReview} disabled={loading || rating === 0} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> {loading ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'
import ChatWindow from '@/components/ui/ChatWindow'
import { useState, useEffect } from 'react'

export default function RiderMessagesPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeBookingId, setActiveBookingId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      supabase
        .from('bookings')
        .select('id, ref_number, profiles(full_name)')
        .eq('rider_id', data.user.id)
        .in('status', ['confirmed','en_route','in_progress'])
        .then(({ data: bks }) => {
          setConversations(bks || [])
          if (bks?.length) setActiveBookingId(bks[0].id)
        })
    })
  }, [])

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold font-display text-thunder-dark mb-4">Messages</h1>
      {conversations.length === 0 ? (
        <div className="card p-12 text-center text-[var(--text-muted)]">No active job conversations.</div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="w-64 flex-shrink-0 space-y-2">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveBookingId(c.id)}
                className={`w-full card p-3 text-left transition-colors ${activeBookingId === c.id ? 'border-brand-300 bg-brand-50' : 'hover:bg-[var(--bg-2)]'}`}
              >
                <p className="font-medium text-sm text-thunder-dark">{c.profiles?.full_name}</p>
                <p className="text-xs text-[var(--text-muted)]">{c.ref_number}</p>
              </button>
            ))}
          </div>
          <div className="flex-1">
            {activeBookingId && userId && (
              <ChatWindow bookingId={activeBookingId} userId={userId} role="rider" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

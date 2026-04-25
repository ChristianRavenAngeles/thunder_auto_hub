'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChatWindow from '@/components/ui/ChatWindow'
import { MessageSquare, Plus, Search, Users } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

export default function AdminMessagesPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState([])
  const [selected, setSelected]           = useState(null)
  const [userId, setUserId]               = useState(null)
  const [search, setSearch]               = useState('')
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
      loadAll()
    })
  }, [])

  async function loadAll() {
    const { data } = await supabase
      .from('conversations')
      .select('*, bookings(reference_no, status, profiles(full_name, phone)), messages(body, created_at, sender_id)')
      .order('created_at', { ascending: false })
    setConversations(data || [])
    setLoading(false)
  }

  const filtered = conversations.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.bookings?.reference_no?.toLowerCase().includes(q) ||
      c.bookings?.profiles?.full_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-6xl h-[calc(100dvh-9rem)] md:h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold font-display text-thunder-dark mb-4">Messages</h1>
      <div className="flex flex-col md:flex-row h-[calc(100%-3rem)] gap-4 min-h-0">
        <div className="w-full md:w-80 md:flex-shrink-0 h-52 md:h-auto card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input className="input !py-1.5 pl-8 text-xs" placeholder="Search conversations…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading…</p> :
            !filtered.length ? <p className="text-center text-[var(--text-muted)] text-sm py-8">No conversations.</p> :
            filtered.map(convo => {
              const last = convo.messages?.[convo.messages.length - 1]
              return (
                <button
                  key={convo.id}
                  onClick={() => setSelected(convo)}
                  className={`w-full p-3 text-left border-b border-[var(--border)] hover:bg-brand-50 transition-colors ${selected?.id === convo.id ? 'bg-brand-50' : ''}`}
                >
                  <p className="text-xs font-semibold text-thunder-dark">{convo.bookings?.profiles?.full_name || 'Guest'}</p>
                  <p className="text-[10px] text-brand-500">{convo.bookings?.reference_no}</p>
                  {last && <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{last.body}</p>}
                  {last && <p className="text-[10px] text-[var(--text-muted)]">{timeAgo(last.created_at)}</p>}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex-1 min-w-0 min-h-0">
          {selected && userId ? (
            <ChatWindow conversationId={selected.id} currentUserId={userId} currentUserName="Thunder Team" />
          ) : (
            <div className="h-full card flex items-center justify-center">
              <div className="text-center text-[var(--text-muted)]">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

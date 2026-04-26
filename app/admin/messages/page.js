'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import ChatWindow from '@/components/ui/ChatWindow'
import { MessageSquare, Search, StickyNote } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

function sortedMessages(convo) {
  return [...(convo.messages || [])].sort((a, z) => new Date(a.created_at) - new Date(z.created_at))
}

function lastMessage(convo) {
  const list = sortedMessages(convo)
  return list[list.length - 1]
}

function unreadCount(convo, userId) {
  const participant = convo.conversation_participants?.find(row => row.user_id === userId)
  const lastRead = participant?.last_read_at ? new Date(participant.last_read_at) : new Date(0)
  return sortedMessages(convo).filter(msg => msg.sender_id !== userId && new Date(msg.created_at) > lastRead).length
}

function statusColor(status) {
  if (status === 'completed') return 'badge-green'
  if (status === 'cancelled' || status === 'no_show') return 'badge-red'
  if (status === 'rescheduled' || status === 'in_progress') return 'badge-gold'
  return 'badge-teal'
}

export default function AdminMessagesPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [userId, setUserId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
      loadAll()
    })
  }, [])

  useEffect(() => {
    setNotesDraft(selected?.bookings?.admin_notes || '')
  }, [selected?.id])

  async function loadAll() {
    const { data } = await supabase
      .from('conversations')
      .select('*, bookings(id, reference_no, status, admin_notes, profiles(full_name, phone)), conversation_participants(user_id, last_read_at), messages(body, created_at, sender_id)')
      .order('created_at', { ascending: false })

    const rows = data || []
    setConversations(rows)
    setSelected(prev => prev ? rows.find(row => row.id === prev.id) || prev : prev)
    setLoading(false)
  }

  function markRead(conversationId) {
    const stamp = new Date().toISOString()
    setConversations(prev => prev.map(convo => {
      if (convo.id !== conversationId) return convo
      const participants = convo.conversation_participants || []
      const hasParticipant = participants.some(row => row.user_id === userId)
      return {
        ...convo,
        conversation_participants: hasParticipant
          ? participants.map(row => row.user_id === userId ? { ...row, last_read_at: stamp } : row)
          : [...participants, { user_id: userId, last_read_at: stamp }],
      }
    }))
  }

  async function saveNotes() {
    if (!selected?.bookings?.id) return
    setSavingNotes(true)
    const { error } = await supabase
      .from('bookings')
      .update({ admin_notes: notesDraft, updated_at: new Date().toISOString() })
      .eq('id', selected.bookings.id)

    if (error) {
      toast.error('Could not save notes.')
    } else {
      toast.success('Admin notes saved.')
      setConversations(prev => prev.map(convo => convo.id === selected.id
        ? { ...convo, bookings: { ...convo.bookings, admin_notes: notesDraft } }
        : convo
      ))
      setSelected(prev => prev ? { ...prev, bookings: { ...prev.bookings, admin_notes: notesDraft } } : prev)
    }
    setSavingNotes(false)
  }

  const filtered = conversations.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.bookings?.reference_no?.toLowerCase().includes(q) ||
      c.bookings?.profiles?.full_name?.toLowerCase().includes(q) ||
      c.bookings?.profiles?.phone?.toLowerCase().includes(q)
    )
  })

  const totalUnread = userId ? conversations.reduce((sum, convo) => sum + unreadCount(convo, userId), 0) : 0

  return (
    <div className="max-w-7xl h-[calc(100dvh-9rem)] md:h-[calc(100vh-8rem)]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">Support Inbox</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{totalUnread} unread message{totalUnread === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_300px] h-[calc(100%-4rem)] gap-4 min-h-0">
        <div className="card overflow-hidden flex flex-col min-h-0">
          <div className="p-3 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input className="input !py-1.5 pl-8 text-xs" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading...</p> :
            !filtered.length ? <p className="text-center text-[var(--text-muted)] text-sm py-8">No conversations.</p> :
            filtered.map(convo => {
              const last = lastMessage(convo)
              const unread = userId ? unreadCount(convo, userId) : 0
              return (
                <button
                  key={convo.id}
                  onClick={() => setSelected(convo)}
                  className={`w-full p-3 text-left border-b border-[var(--border)] hover:bg-brand-50 transition-colors ${selected?.id === convo.id ? 'bg-brand-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-thunder-dark truncate">{convo.bookings?.profiles?.full_name || 'Guest'}</p>
                      <p className="text-[10px] text-brand-500">{convo.bookings?.reference_no || 'General'}</p>
                    </div>
                    {unread > 0 && <span className="badge-red text-[10px]">{unread}</span>}
                  </div>
                  {last && <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{last.body}</p>}
                  {last && <p className="text-[10px] text-[var(--text-muted)]">{timeAgo(last.created_at)}</p>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-w-0 min-h-0">
          {selected && userId ? (
            <ChatWindow
              conversationId={selected.id}
              currentUserId={userId}
              currentUserName="Thunder Team"
              enableCannedResponses
              onRead={markRead}
            />
          ) : (
            <div className="h-full card flex items-center justify-center">
              <div className="text-center text-[var(--text-muted)]">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>

        <aside className="card p-4 overflow-y-auto min-h-0">
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Booking</p>
                <p className="font-semibold text-thunder-dark">{selected.bookings?.reference_no || 'General'}</p>
                {selected.bookings?.status && (
                  <span className={`${statusColor(selected.bookings.status)} text-xs mt-2`}>{selected.bookings.status.replace('_', ' ')}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Customer</p>
                <p className="text-sm text-thunder-dark">{selected.bookings?.profiles?.full_name || '-'}</p>
                <p className="text-xs text-[var(--text-muted)]">{selected.bookings?.profiles?.phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1">
                  <StickyNote className="w-3.5 h-3.5" /> Admin Notes
                </p>
                <textarea
                  className="input resize-none text-sm"
                  rows={7}
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  placeholder="Internal notes for the team"
                />
                <button onClick={saveNotes} disabled={savingNotes} className="btn-primary w-full !py-2 !text-sm mt-2">
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-[var(--text-muted)] text-sm py-8">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Booking details and notes appear here.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

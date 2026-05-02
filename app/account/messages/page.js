'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ChatWindow from '@/components/ui/ChatWindow'
import { Bell, CheckCheck, MessageSquare } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

function sortedMessages(convo) {
  return [...(convo.messages || [])].sort((a, z) => new Date(a.created_at) - new Date(z.created_at))
}

function unreadCount(convo, userId) {
  const lastRead = convo.last_read_at ? new Date(convo.last_read_at) : new Date(0)
  return sortedMessages(convo).filter(msg => msg.sender_id !== userId && new Date(msg.created_at) > lastRead).length
}

export default function CustomerMessagesPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [selected, setSelected]           = useState(null)
  const [userId, setUserId]               = useState(null)
  const [userName, setUserName]           = useState('')
  const [loading, setLoading]             = useState(true)
  const [loadingNotifications, setLoadingNotifications] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.user.id).single()
      setUserName(profile?.full_name || '')
      loadConversations(data.user.id)
      loadNotifications(data.user.id)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('account-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        if (payload.new.user_id === userId) {
          setNotifications(prev => [payload.new, ...prev])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [supabase, userId])

  async function loadConversations(uid) {
    const { data: participantRows } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', uid)

    if (!participantRows?.length) { setLoading(false); return }

    const ids = participantRows.map(p => p.conversation_id)
    const readMap = participantRows.reduce((acc, row) => ({ ...acc, [row.conversation_id]: row.last_read_at }), {})
    const { data } = await supabase
      .from('conversations')
      .select('*, bookings(reference_no, status), messages(body, created_at, sender_id, profiles(full_name))')
      .in('id', ids)
      .order('created_at', { ascending: false })

    setConversations((data || []).map(convo => ({ ...convo, last_read_at: readMap[convo.id] || null })))
    setLoading(false)
  }

  async function loadNotifications(uid) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(30)

    setNotifications(data || [])
    setLoadingNotifications(false)
  }

  function markRead(conversationId) {
    const stamp = new Date().toISOString()
    setConversations(prev => prev.map(convo => convo.id === conversationId ? { ...convo, last_read_at: stamp } : convo))
  }

  async function markAllNotificationsRead() {
    if (!userId) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(item => ({ ...item, is_read: true })))
  }

  const unreadNotifications = notifications.filter(item => !item.is_read).length

  return (
    <div className="max-w-7xl h-[calc(100dvh-9rem)] md:h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold font-display text-thunder-dark mb-4">Messages</h1>
      <div className="grid grid-cols-1 xl:grid-cols-[300px_280px_minmax(0,1fr)] h-[calc(100%-3rem)] gap-4 min-h-0">
        <div className="card overflow-hidden flex flex-col min-h-0">
          <div className="p-3 border-b border-[var(--border)] flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-thunder-dark text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-500" /> Notifications
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">{unreadNotifications} unread</p>
            </div>
            <button onClick={markAllNotificationsRead} className="btn-secondary !py-1.5 !px-2 !text-[11px] flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Mark all
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingNotifications ? (
              <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading…</p>
            ) : !notifications.length ? (
              <div className="text-center py-8 px-4">
                <Bell className="w-8 h-8 text-[var(--text-2)] mx-auto mb-2" />
                <p className="text-[var(--text-muted)] text-sm">No notifications yet.</p>
              </div>
            ) : notifications.map(item => (
              <Link
                key={item.id}
                href={item.data?.booking_id ? '/account/bookings' : '/account/messages'}
                className={`block p-3 border-b border-[var(--border)] hover:bg-brand-50 transition-colors ${item.is_read ? '' : 'bg-brand-50/60'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-thunder-dark">{item.title}</p>
                  {!item.is_read && <span className="badge-red text-[10px]">New</span>}
                </div>
                <p className="text-xs text-[var(--text-2)] mt-1">{item.body}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{timeAgo(item.created_at)}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="w-full xl:w-auto h-48 xl:h-auto card overflow-hidden flex flex-col min-h-0">
          <div className="p-3 border-b border-[var(--border)]">
            <h2 className="font-semibold text-thunder-dark text-sm">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-center text-[var(--text-muted)] text-sm py-8">Loading…</p>
            ) : !conversations.length ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-8 h-8 text-[var(--text-2)] mx-auto mb-2" />
                <p className="text-[var(--text-muted)] text-sm">No conversations yet.</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Messages will appear here after you book a service.</p>
              </div>
            ) : conversations.map(convo => {
              const lastMsg = sortedMessages(convo).at(-1)
              const unread = userId ? unreadCount(convo, userId) : 0
              return (
                <button
                  key={convo.id}
                  onClick={() => setSelected(convo)}
                  className={`w-full p-3 text-left border-b border-[var(--border)] hover:bg-brand-50 transition-colors ${selected?.id === convo.id ? 'bg-brand-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-brand-600">{convo.bookings?.reference_no || 'General'}</p>
                    {unread > 0 && <span className="badge-red text-[10px]">{unread}</span>}
                  </div>
                  {lastMsg && (
                    <>
                      <p className="text-xs text-[var(--text-2)] mt-0.5 truncate">{lastMsg.body}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{timeAgo(lastMsg.created_at)}</p>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 min-w-0 min-h-0">
          {selected && userId ? (
            <ChatWindow
              conversationId={selected.id}
              currentUserId={userId}
              currentUserName={userName}
              enableCannedResponses={false}
              onRead={markRead}
            />
          ) : (
            <div className="h-full card flex items-center justify-center">
              <div className="text-center text-[var(--text-muted)]">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

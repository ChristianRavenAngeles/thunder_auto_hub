'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, FileText, MessageSquare } from 'lucide-react'
import { timeAgo, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ChatWindow({ conversationId, currentUserId, currentUserName, enableCannedResponses = true, onRead }) {
  const supabase = createClient()
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [cannedResponses, setCanned] = useState([])
  const [showCanned, setShowCanned] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadMessages()
    if (enableCannedResponses) loadCannedResponses()

    const channel = supabase.channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => setMessages(prev => [...prev, payload.new]))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(full_name, role)')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // Mark read
    await supabase.from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId)
    onRead?.(conversationId)
  }

  async function loadCannedResponses() {
    if (!enableCannedResponses) return
    const { data } = await supabase.from('canned_responses').select('*').order('title')
    setCanned(data || [])
  }

  async function sendMessage(body = input, isCanned = false) {
    if (!body.trim() || sending) return
    setSending(true)
    setInput('')
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: body.trim(),
      is_canned: isCanned,
    })
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] rounded-2xl border border-gray-100 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-[var(--text-muted)] text-sm py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Walang mensahe pa. Magsimula ng conversation!
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
              {!isOwn && (
                <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0 mt-auto">
                  {getInitials(msg.profiles?.full_name || '?')}
                </div>
              )}
              <div className={cn('max-w-[75%] space-y-1', isOwn ? 'items-end' : 'items-start', 'flex flex-col')}>
                {!isOwn && (
                  <span className="text-xs text-[var(--text-muted)] px-1">{msg.profiles?.full_name}</span>
                )}
                <div className={cn(
                  'px-3 py-2 rounded-2xl text-sm',
                  isOwn
                    ? 'bg-brand-500 text-[var(--text)] rounded-tr-sm'
                    : 'bg-gray-100 text-thunder-dark rounded-tl-sm'
                )}>
                  {msg.body}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] px-1">{timeAgo(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Canned responses */}
      {enableCannedResponses && showCanned && (
        <div className="border-t border-gray-100 p-2 max-h-32 overflow-y-auto bg-gray-50">
          {cannedResponses.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] px-2 py-1">No canned responses yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {cannedResponses.map(c => (
              <button
                key={c.id}
                onClick={() => { sendMessage(c.body, true); setShowCanned(false) }}
                className="text-xs px-2 py-1 bg-[var(--surface)] border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors"
              >
                {c.title}
              </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex gap-2 items-end">
        {enableCannedResponses && (
          <button
            onClick={() => setShowCanned(!showCanned)}
            className="p-2 text-[var(--text-muted)] hover:text-brand-500 rounded-xl hover:bg-brand-50 transition-colors flex-shrink-0"
            title="Canned responses"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}
        <textarea
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-400 max-h-24"
          placeholder="Type a message…"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          className="p-2 bg-brand-500 text-[var(--text)] rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

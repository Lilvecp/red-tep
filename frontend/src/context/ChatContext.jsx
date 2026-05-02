import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { chatService } from '../services'
import useAuthStore from '../store/authStore'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { user } = useAuthStore()

  const [conversations, setConversations] = useState([])
  const [activeConvId,  setActiveConvId]  = useState(null)
  const [messages,      setMessages]      = useState({})   // { [convId]: Message[] }
  const [widgetOpen,    setWidgetOpen]    = useState(false)
  const [loadingMsgs,   setLoadingMsgs]   = useState(false)

  const loadedConvs     = useRef(new Set())
  const activeConvIdRef = useRef(activeConvId)
  const channelRef      = useRef(null)

  useEffect(() => { activeConvIdRef.current = activeConvId }, [activeConvId])

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  // ── Cargar lista de conversaciones ───────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!user) return
    try {
      const res = await chatService.getConversations()
      setConversations(res.data)
    } catch {}
  }, [user])

  // ── Suscripción Supabase Realtime a tabla messages ────────────────────────────
  useEffect(() => {
    if (!user) return

    loadConversations()

    // Suscribirse a INSERT en tabla messages
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new
          const cid = Number(message.conversation_id)
          // Mapear snake_case de Supabase a camelCase del frontend
          const msg = {
            id:             message.id,
            conversationId: cid,
            senderId:       message.sender_id,
            contenido:      message.contenido,
            mediaUrl:       message.media_url,
            eliminado:      message.eliminado,
            creadoEn:       message.creado_en,
          }
          setMessages(prev => ({ ...prev, [cid]: [...(prev[cid] || []), msg] }))
          setConversations(prev => prev.map(c => {
            if (c.id !== cid) return c
            return {
              ...c,
              lastMessage: msg,
              unreadCount: activeConvIdRef.current === cid ? 0 : (c.unreadCount || 0) + 1,
            }
          }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new
          const cid = Number(message.conversation_id)
          setMessages(prev => ({
            ...prev,
            [cid]: (prev[cid] || []).map(m =>
              m.id === message.id
                ? { ...m, eliminado: message.eliminado, contenido: message.contenido, mediaUrl: message.media_url }
                : m
            ),
          }))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      loadedConvs.current.clear()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cargar mensajes de una conversación ──────────────────────────────────────
  const loadMessages = useCallback(async (convId) => {
    if (loadedConvs.current.has(convId)) return
    setLoadingMsgs(true)
    try {
      const res = await chatService.getMessages(convId)
      setMessages(prev => ({ ...prev, [convId]: res.data }))
      loadedConvs.current.add(convId)
    } catch {} finally { setLoadingMsgs(false) }
  }, [])

  // ── Cargar más mensajes ───────────────────────────────────────────────────────
  const loadMoreMessages = useCallback(async (convId) => {
    const current = messages[convId] || []
    if (current.length === 0) return
    const oldest = current[0].id
    try {
      const res = await chatService.getMessages(convId, oldest)
      if (res.data.length > 0)
        setMessages(prev => ({ ...prev, [convId]: [...res.data, ...(prev[convId] || [])] }))
    } catch {}
  }, [messages])

  // ── Abrir chat 1:1 ────────────────────────────────────────────────────────────
  const openConversation = useCallback(async (targetUserId) => {
    try {
      const res  = await chatService.createConversation({ userIds: [targetUserId] })
      const conv = res.data
      setConversations(prev => {
        if (prev.find(c => c.id === conv.id)) return prev
        return [{ ...conv, unreadCount: 0 }, ...prev]
      })
      setActiveConvId(conv.id)
      setWidgetOpen(true)
      if (!loadedConvs.current.has(conv.id)) {
        const msgs = await chatService.getMessages(conv.id)
        setMessages(prev => ({ ...prev, [conv.id]: msgs.data }))
        loadedConvs.current.add(conv.id)
      }
    } catch {}
  }, [])

  // ── Crear grupo ───────────────────────────────────────────────────────────────
  const createGroup = useCallback(async (userIds, nombre) => {
    try {
      const res  = await chatService.createConversation({ userIds, nombre })
      const conv = res.data
      setConversations(prev => [{ ...conv, unreadCount: 0 }, ...prev])
      setActiveConvId(conv.id)
      setWidgetOpen(true)
      setMessages(prev => ({ ...prev, [conv.id]: [] }))
      loadedConvs.current.add(conv.id)
    } catch {}
  }, [])

  // ── Seleccionar conversación ──────────────────────────────────────────────────
  const selectConv = useCallback(async (convId) => {
    setActiveConvId(convId)
    chatService.markRead(convId).catch(() => {})
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c))
    await loadMessages(convId)
  }, [loadMessages])

  // ── Enviar mensaje — vía HTTP, Supabase Realtime lo empujará de vuelta ────────
  const sendMessage = useCallback(async (convId, contenido, mediaUrl) => {
    try {
      await chatService.sendMessage(convId, { contenido, mediaUrl })
    } catch {}
  }, [])

  // ── Eliminar mensaje ──────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId, convId) => {
    try {
      await chatService.deleteMessage(messageId)
    } catch {}
  }, [])

  const value = {
    conversations,
    activeConvId,
    messages,
    totalUnread,
    widgetOpen,
    setWidgetOpen,
    loadingMsgs,
    openConversation,
    createGroup,
    selectConv,
    sendMessage,
    deleteMessage,
    loadMoreMessages,
    setActiveConvId,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>')
  return ctx
}

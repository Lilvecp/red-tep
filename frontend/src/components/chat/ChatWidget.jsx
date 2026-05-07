import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import ConversationList from './ConversationList'
import ChatView from './ChatView'
import { useChat } from '../../hooks/useChat'
import useAuthStore from '../../store/authStore'

// ── Modal crear grupo ──────────────────────────────────────────────────────────
function NewGroupModal({ allUsers, onClose, onCreate }) {
  const { user }  = useAuthStore()
  const [q,        setQ]       = useState('')
  const [nombre,   setNombre]  = useState('')
  const [selected, setSelected] = useState([])

  const candidates = allUsers.filter(u =>
    u.id !== user?.id &&
    (!q.trim() || u.nombre.toLowerCase().includes(q.toLowerCase()))
  )

  const toggle = (u) =>
    setSelected(prev =>
      prev.find(x => x.id === u.id)
        ? prev.filter(x => x.id !== u.id)
        : [...prev, u]
    )

  const handleCreate = () => {
    if (selected.length === 0 || !nombre.trim()) return
    onCreate(selected.map(u => u.id), nombre.trim())
    onClose()
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '1.25rem', width: '100%', maxWidth: 360,
      }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', marginBottom: '1rem' }}>
          Nuevo grupo
        </div>

        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Nombre del grupo *"
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'Figtree',sans-serif", fontSize: '.82rem', outline: 'none', marginBottom: 8 }}
        />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar usuarios..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'Figtree',sans-serif", fontSize: '.82rem', outline: 'none', marginBottom: 8 }}
        />

        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {candidates.length === 0 && (
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', padding: '0.5rem', textAlign: 'center' }}>
              {q ? 'Sin resultados' : 'No hay otros usuarios disponibles aún'}
            </div>
          )}
          {candidates.map(u => {
            const isSel = !!selected.find(x => x.id === u.id)
            return (
              <div
                key={u.id}
                onClick={() => toggle(u)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                  background: isSel ? 'var(--green-glo)' : 'var(--surface2)',
                  border: isSel ? '1px solid rgba(77,160,232,.3)' : '1px solid transparent',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, color: 'var(--text2)' }}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.8rem', color: 'var(--text)', fontWeight: 500 }}>{u.nombre}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{u.role}</div>
                </div>
                {isSel && <span style={{ color: 'var(--green-lit)', fontSize: '.85rem' }}>✓</span>}
              </div>
            )
          })}
        </div>

        {selected.length > 0 && (
          <div style={{ fontSize: '.73rem', color: 'var(--text2)', marginBottom: 10 }}>
            {selected.length} seleccionado(s): {selected.map(u => u.nombre.split(' ')[0]).join(', ')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text2)', fontFamily: "'Figtree',sans-serif", fontSize: '.8rem', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={selected.length === 0 || !nombre.trim()}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--green-mid)', color: '#fff', fontFamily: "'Figtree',sans-serif", fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', opacity: (selected.length === 0 || !nombre.trim()) ? .5 : 1 }}
          >
            Crear grupo
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ChatWidget ─────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { isAuthenticated } = useAuthStore()
  const {
    conversations, activeConvId, messages, totalUnread,
    widgetOpen, setWidgetOpen, loadingMsgs,
    openConversation, createGroup, selectConv,
    sendMessage, deleteMessage, loadMoreMessages,
    setActiveConvId,
  } = useChat()

  const [showGroupModal, setShowGroupModal] = useState(false)

  if (!isAuthenticated) return null

  const activeConv     = conversations.find(c => c.id === activeConvId)
  const activeMessages = activeConvId ? (messages[activeConvId] || []) : []

  // Usuarios únicos de todas las conversaciones (para modal de grupo)
  const allUsers = []
  const seen = new Set()
  conversations.forEach(c => (c.members || []).forEach(m => {
    if (!seen.has(m.id)) { seen.add(m.id); allUsers.push(m) }
  }))

  return (
    <>
      {showGroupModal && (
        <NewGroupModal
          allUsers={allUsers}
          onClose={() => setShowGroupModal(false)}
          onCreate={(userIds, nombre) => createGroup(userIds, nombre)}
        />
      )}

      {/* Panel del widget */}
      {widgetOpen && (
        <div style={{
          position: 'fixed', bottom: 82, right: 24,
          width: 310, height: 430,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.18)',
          zIndex: 999, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header del panel */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.85rem', color: 'var(--text)' }}>
                Mensajes
              </span>
              {totalUnread > 0 && !activeConvId && (
                <span style={{ background: 'var(--green-mid)', color: '#fff', fontSize: '.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 8 }}>
                  {totalUnread}
                </span>
              )}
            </div>
            <button
              onClick={() => setWidgetOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeConvId ? (
              <ChatView
                conv={activeConv}
                messages={activeMessages}
                loadingMsgs={loadingMsgs}
                onBack={() => setActiveConvId(null)}
                onSend={(text, mediaUrl) => sendMessage(activeConvId, text, mediaUrl)}
                onDelete={deleteMessage}
                onLoadMore={() => loadMoreMessages(activeConvId)}
              />
            ) : (
              <ConversationList
                conversations={conversations}
                onSelect={selectConv}
                onNewGroup={() => setShowGroupModal(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => {
          if (widgetOpen) { setWidgetOpen(false) }
          else { setActiveConvId(null); setWidgetOpen(true) }
        }}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 50, height: 50, borderRadius: '50%',
          background: 'var(--green-mid)', border: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,.22)',
          cursor: 'pointer', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <MessageCircle size={22} color="#fff" />
        {totalUnread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 18, borderRadius: 9,
            background: '#ef4444', color: '#fff',
            fontSize: '.6rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '2px solid var(--bg)',
          }}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    </>
  )
}

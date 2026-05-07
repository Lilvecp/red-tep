import { useState } from 'react'
import useAuthStore from '../../store/authStore'

function formatTime(iso) {
  if (!iso) return ''
  const d   = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

function getConvName(conv, userId) {
  if (conv.nombre) return conv.nombre
  const other = (conv.members || []).find(m => m.id !== userId)
  return other?.nombre || 'Conversación'
}

export default function ConversationList({ conversations, onSelect, onNewGroup }) {
  const { user } = useAuthStore()
  const [q, setQ] = useState('')

  const filtered = conversations.filter(c =>
    !q.trim() || getConvName(c, user?.id).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Buscador */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar conversación..."
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '6px 10px', background: 'var(--surface2)',
            border: '1px solid var(--border2)', borderRadius: 8,
            color: 'var(--text)', fontFamily: "'Figtree',sans-serif",
            fontSize: '.78rem', outline: 'none',
          }}
        />
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '.8rem', color: 'var(--text3)' }}>
            {conversations.length === 0 ? 'Sin conversaciones aún.' : 'Sin resultados.'}
          </div>
        )}
        {filtered.map(c => {
          const name    = getConvName(c, user?.id)
          const lastMsg = c.lastMessage
          const lastText = lastMsg
            ? (lastMsg.eliminado ? 'Mensaje eliminado' : lastMsg.mediaUrl ? '📷 Imagen' : lastMsg.contenido)
            : 'Sin mensajes'
          const lastTime = formatTime(lastMsg?.creadoEn || c.creadoEn)
          const unread   = c.unreadCount || 0

          return (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: unread > 0 ? 'rgba(77,160,232,.04)' : 'transparent',
                transition: 'background .12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = unread > 0 ? 'rgba(77,160,232,.04)' : 'transparent'}
            >
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--green-glo)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: c.esGrupo ? '1rem' : '.9rem', fontWeight: 700,
                color: 'var(--green-lit)', flexShrink: 0,
              }}>
                {c.esGrupo ? '👥' : name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{
                    fontSize: '.82rem', fontWeight: unread > 0 ? 700 : 500,
                    color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', maxWidth: 160,
                  }}>
                    {name}
                  </span>
                  <span style={{ fontSize: '.65rem', color: 'var(--text3)', flexShrink: 0 }}>{lastTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 1 }}>
                  <span style={{
                    fontSize: '.74rem', color: 'var(--text3)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190,
                    fontStyle: lastMsg?.eliminado ? 'italic' : 'normal',
                  }}>
                    {lastText}
                  </span>
                  {unread > 0 && (
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 9, background: 'var(--green-mid)',
                      color: '#fff', fontSize: '.6rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, padding: '0 4px',
                    }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer — nuevo grupo */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onNewGroup}
          style={{
            width: '100%', padding: '7px', borderRadius: 8,
            border: '1px dashed var(--border2)', background: 'none',
            color: 'var(--text3)', fontFamily: "'Figtree',sans-serif",
            fontSize: '.76rem', cursor: 'pointer',
          }}
        >
          + Nuevo grupo
        </button>
      </div>
    </div>
  )
}

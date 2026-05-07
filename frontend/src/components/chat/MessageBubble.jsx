import useAuthStore from '../../store/authStore'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, onDelete }) {
  const { user } = useAuthStore()
  const isOwn    = message.sender?.id === user?.id

  if (message.eliminado) {
    return (
      <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
        <span style={{ fontSize: '.72rem', color: 'var(--text3)', fontStyle: 'italic', padding: '4px 10px' }}>
          Mensaje eliminado
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 6, gap: 6, alignItems: 'flex-end' }}>
      {!isOwn && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', flexShrink: 0,
        }}>
          {(message.sender?.nombre || '?').charAt(0).toUpperCase()}
        </div>
      )}

      <div style={{ maxWidth: '72%', position: 'relative' }}>
        {!isOwn && (
          <div style={{ fontSize: '.65rem', color: 'var(--text3)', marginBottom: 2, paddingLeft: 2 }}>
            {message.sender?.nombre}
          </div>
        )}

        <div style={{
          background:   isOwn ? 'var(--green-mid)' : 'var(--surface2)',
          color:        isOwn ? '#fff' : 'var(--text)',
          borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
          padding:      '8px 12px',
          fontSize:     '.82rem',
          lineHeight:   1.45,
          border:       isOwn ? 'none' : '1px solid var(--border)',
          wordBreak:    'break-word',
        }}>
          {message.mediaUrl && (
            <img
              src={message.mediaUrl}
              alt="imagen"
              style={{ display: 'block', maxWidth: 200, borderRadius: 8, marginBottom: message.contenido ? 6 : 0, cursor: 'pointer' }}
              onClick={() => window.open(message.mediaUrl, '_blank')}
            />
          )}
          {message.contenido && <span>{message.contenido}</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: isOwn ? 'flex-end' : 'flex-start', marginTop: 2 }}>
          <span style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{formatTime(message.creadoEn)}</span>
          {isOwn && (
            <button
              onClick={() => onDelete(message.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.62rem', padding: 0, lineHeight: 1 }}
              title="Eliminar mensaje"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

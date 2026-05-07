import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Send, Image, X } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { chatService } from '../../services'
import useAuthStore from '../../store/authStore'

function getConvName(conv, userId) {
  if (!conv) return ''
  if (conv.nombre) return conv.nombre
  const other = (conv.members || []).find(m => m.id !== userId)
  return other?.nombre || 'Conversación'
}

export default function ChatView({ conv, messages, loadingMsgs, onBack, onSend, onDelete, onLoadMore }) {
  const { user }  = useAuthStore()
  const [text,      setText]      = useState('')
  const [imgFile,   setImgFile]   = useState(null)
  const [imgPrev,   setImgPrev]   = useState(null)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef()
  const fileRef   = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleImgChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImgFile(f)
    setImgPrev(URL.createObjectURL(f))
    e.target.value = ''
  }

  const clearImg = () => {
    setImgFile(null)
    if (imgPrev) URL.revokeObjectURL(imgPrev)
    setImgPrev(null)
  }

  const handleSend = async () => {
    if (!text.trim() && !imgFile) return
    let mediaUrl = null

    if (imgFile) {
      setUploading(true)
      try {
        const fd  = new FormData()
        fd.append('file', imgFile)
        const res = await chatService.uploadImage(fd)
        mediaUrl  = res.data.url
      } catch { setUploading(false); return }
      setUploading(false)
      clearImg()
    }

    onSend(text.trim(), mediaUrl)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const convName = getConvName(conv, user?.id)
  const msgs     = messages || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', display: 'flex', padding: 4 }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--green-glo)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: conv?.esGrupo ? '.9rem' : '.82rem', fontWeight: 700,
          color: 'var(--green-lit)', flexShrink: 0,
        }}>
          {conv?.esGrupo ? '👥' : convName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {convName}
          </div>
          {conv?.esGrupo && (
            <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>
              {(conv.members || []).length} miembros
            </div>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}
        onScroll={e => { if (e.currentTarget.scrollTop === 0 && msgs.length >= 50) onLoadMore?.() }}
      >
        {loadingMsgs && (
          <div style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--text3)', padding: '1rem' }}>
            Cargando mensajes...
          </div>
        )}
        {msgs.map(m => (
          <MessageBubble key={m.id} message={m} onDelete={onDelete} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Preview imagen adjunta */}
      {imgPrev && (
        <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={imgPrev} alt="preview" style={{ height: 48, borderRadius: 6, objectFit: 'cover' }} />
          <button onClick={clearImg} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input de mensaje */}
      <div style={{
        display: 'flex', gap: 6, alignItems: 'flex-end',
        padding: '8px 10px', borderTop: '1px solid var(--border)',
      }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex', flexShrink: 0 }}
          title="Adjuntar imagen"
        >
          <Image size={17} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImgChange} style={{ display: 'none' }} />

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? 'Subiendo imagen...' : 'Escribe un mensaje... (Enter para enviar)'}
          rows={1}
          disabled={uploading}
          style={{
            flex: 1, resize: 'none', padding: '7px 10px',
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: 10, color: 'var(--text)',
            fontFamily: "'Figtree',sans-serif", fontSize: '.82rem',
            outline: 'none', maxHeight: 80, overflowY: 'auto', lineHeight: 1.4,
          }}
        />

        <button
          onClick={handleSend}
          disabled={(!text.trim() && !imgFile) || uploading}
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: ((!text.trim() && !imgFile) || uploading) ? 'var(--surface2)' : 'var(--green-mid)',
            border: 'none', cursor: ((!text.trim() && !imgFile) || uploading) ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'background .15s',
          }}
        >
          <Send size={15} color={((!text.trim() && !imgFile) || uploading) ? 'var(--text3)' : '#fff'} />
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import { BtnGreen, BtnOutline, Avatar, Badge, EmptyState } from '../components/ui/index'
import { eventoService } from '../services/index'
import useAuthStore from '../store/authStore'

const BLANK = { titulo: '', descripcion: '', fecha: '', lugar: '' }
const ADMIN_ROLES = ['ADMIN', 'TEACHER']

function resolveAuthorColor(type) {
  if (type === 'ADMIN') return 'var(--amber)'
  if (type === 'COMPANY') return '#40916c'
  return 'var(--green)'
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function EventCard({ evento, isAdmin, onRemoved }) {
  const { user } = useAuthStore()
  const [expanded, setExpanded]   = useState(false)
  const [comments, setComments]   = useState([])
  const [loadingC, setLoadingC]   = useState(false)
  const [draft, setDraft]         = useState('')
  const [sending, setSending]     = useState(false)
  const [reaction, setReaction]   = useState({ count: 0, reacted: false })
  const [loadingR, setLoadingR]   = useState(false)

  const d = new Date(evento.fecha)

  const loadComments = async () => {
    setLoadingC(true)
    try {
      const [c, r] = await Promise.all([
        eventoService.getComments(evento.id),
        eventoService.getReactions(evento.id),
      ])
      setComments(c.data)
      setReaction(r.data)
    } catch { toast.error('Error al cargar comentarios') }
    finally { setLoadingC(false) }
  }

  const handleExpand = () => {
    if (!expanded) loadComments()
    setExpanded(v => !v)
  }

  const handleComment = async () => {
    if (!draft.trim()) return
    setSending(true)
    try {
      const { data } = await eventoService.addComment(evento.id, { content: draft })
      setComments(prev => [...prev, data])
      setDraft('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al comentar')
    } finally { setSending(false) }
  }

  const handleDeleteComment = async (cid) => {
    try {
      await eventoService.deleteComment(evento.id, cid)
      setComments(prev => prev.filter(c => c.id !== cid))
    } catch { toast.error('Error al eliminar comentario') }
  }

  const handleReaction = async () => {
    if (loadingR) return
    setLoadingR(true)
    try {
      const { data } = await eventoService.toggleReaction(evento.id, '👍')
      setReaction({ count: data.count, reacted: data.reacted })
    } catch { toast.error('Error al reaccionar') }
    finally { setLoadingR(false) }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem' }}>
      {/* Header del evento */}
      <div style={{ padding: '1.1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* Fecha badge */}
          <div style={{ background: 'var(--green)', borderRadius: 10, padding: '.4rem .65rem', textAlign: 'center', minWidth: 44, flexShrink: 0 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{d.getDate()}</div>
            <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.7)' }}>{d.toLocaleString('es', { month: 'short' }).toUpperCase()}</div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.9rem', color: 'var(--text)' }}>{evento.titulo}</div>
            {evento.lugar && (
              <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: 2 }}>📍 {evento.lugar}</div>
            )}
            <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: 2 }}>
              {d.toLocaleString('es-CL', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => onRemoved(evento.id)}
              style={{ background: 'var(--red-bg)', border: '1px solid rgba(224,82,82,.3)', color: 'var(--red)', fontSize: '.7rem', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
            >
              Eliminar
            </button>
          )}
        </div>

        {evento.descripcion && (
          <p style={{ margin: '.75rem 0 0', fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.6 }}>{evento.descripcion}</p>
        )}
      </div>

      {/* Barra de acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '.6rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
        <button
          onClick={handleReaction}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: reaction.reacted ? 'var(--green-glo)' : 'transparent',
            border: `1px solid ${reaction.reacted ? 'rgba(82,183,136,.3)' : 'var(--border)'}`,
            color: reaction.reacted ? 'var(--green-lit)' : 'var(--text2)',
            borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
            fontSize: '.78rem', fontWeight: 500, transition: 'all .2s',
          }}
        >
          👍 {reaction.count > 0 && <span>{reaction.count}</span>}
        </button>

        <button
          onClick={handleExpand}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text2)', borderRadius: 20, padding: '4px 12px',
            cursor: 'pointer', fontSize: '.78rem', fontWeight: 500,
          }}
        >
          💬 {evento.commentCount > 0 ? evento.commentCount : ''} {expanded ? 'Cerrar' : 'Comentar'}
        </button>
      </div>

      {/* Sección de comentarios */}
      {expanded && (
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          {/* Formulario */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'flex-start' }}>
            <Avatar nombre={user?.nombre} size={32} bg={user?.role === 'COMPANY' ? '#40916c' : 'var(--green)'} />
            <div style={{ flex: 1 }}>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Escribe un comentario..."
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 20,
                  background: 'var(--surface2)', border: '1px solid var(--border2)',
                  color: 'var(--text)', fontFamily: "'Figtree','DM Sans',sans-serif",
                  fontSize: '.82rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={handleComment}
              disabled={sending || !draft.trim()}
              style={{
                background: 'var(--green-mid)', border: 'none', color: '#fff',
                borderRadius: 20, padding: '8px 14px', cursor: 'pointer',
                fontSize: '.78rem', opacity: (!draft.trim() || sending) ? .5 : 1,
              }}
            >
              Enviar
            </button>
          </div>

          {/* Lista de comentarios */}
          {loadingC ? (
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', padding: '.5rem 0' }}>Cargando...</div>
          ) : comments.length === 0 ? (
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', textAlign: 'center', padding: '.5rem 0' }}>
              Sin comentarios aún. ¡Sé el primero!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Avatar nombre={c.authorName} size={30} bg={resolveAuthorColor(c.authorType)} />
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 10, padding: '7px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text)' }}>{c.authorName}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: '.65rem', color: 'var(--text3)' }}>{formatDate(c.createdAt)}</span>
                        {(user?.id === c.authorId || isAdmin) && (
                          <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.75rem', padding: '0 2px' }}>✕</button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.5 }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EventosPage() {
  const { user } = useAuthStore()
  const isAdmin = ADMIN_ROLES.includes(user?.role)

  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(BLANK)
  const [saving, setSaving]   = useState(false)

  const load = () =>
    eventoService.getAll()
      .then(r => setEventos(r.data))
      .catch(() => toast.error('Error al cargar eventos'))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.titulo || !form.fecha) return toast.error('Título y fecha son requeridos')
    setSaving(true)
    try {
      const { data } = await eventoService.create(form)
      toast.success('Evento creado')
      setEventos(prev => [data, ...prev])
      setModal(false)
      setForm(BLANK)
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear evento') }
    finally { setSaving(false) }
  }

  const handleRemove = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      await eventoService.remove(id)
      toast.success('Evento eliminado')
      setEventos(prev => prev.filter(e => e.id !== id))
    } catch { toast.error('Error al eliminar evento') }
  }

  const inp = {
    width: '100%', padding: '9px 12px', background: 'var(--surface2)',
    border: '1px solid var(--border2)', borderRadius: 7, color: 'var(--text)',
    fontFamily: "'Figtree','DM Sans',sans-serif", fontSize: '.85rem', outline: 'none', marginTop: 3,
  }
  const lbl = { fontSize: '.75rem', color: 'var(--text2)', fontWeight: 500 }

  return (
    <AppLayout
      title="Eventos"
      actions={isAdmin && <BtnGreen onClick={() => setModal(true)}>+ Crear evento</BtnGreen>}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', fontSize: '.85rem' }}>Cargando eventos...</div>
        ) : eventos.length === 0 ? (
          <EmptyState icon="📅" message="No hay eventos programados" />
        ) : (
          eventos.map(e => (
            <EventCard
              key={e.id}
              evento={e}
              isAdmin={isAdmin}
              onRemoved={handleRemove}
            />
          ))
        )}
      </div>

      {/* Modal crear evento — solo admin */}
      {modal && (
        <div
          onClick={ev => { if (ev.target === ev.currentTarget) setModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 460 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '1.5rem' }}>Crear nuevo evento</div>
            {[['Título del evento', 'titulo'], ['Lugar', 'lugar']].map(([l, k]) => (
              <div key={k} style={{ marginBottom: '.75rem' }}>
                <label style={lbl}>{l}</label>
                <input type="text" style={inp} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={l} />
              </div>
            ))}
            <div style={{ marginBottom: '.75rem' }}>
              <label style={lbl}>Fecha y hora</label>
              <input type="datetime-local" style={inp} value={form.fecha || ''} onChange={e => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={lbl}>Descripción</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del evento..." />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <BtnOutline onClick={() => { setModal(false); setForm(BLANK) }}>Cancelar</BtnOutline>
              <BtnGreen onClick={handleCreate} disabled={saving}>{saving ? 'Creando...' : 'Crear evento'}</BtnGreen>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

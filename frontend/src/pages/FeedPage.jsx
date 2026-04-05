import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import CreatePost from '../components/feed/CreatePost'
import PostCard from '../components/feed/PostCard'
import { postService, eventoService, companyService, followService } from '../services/index'
import { EmptyState, Avatar } from '../components/ui/index'
import useAuthStore from '../store/authStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatEventDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ─── EventCardFeed — eventos en el feed central ───────────────────────────────
function EventCardFeed({ evento, likeState, onLike, onComment }) {
  const { user } = useAuthStore()
  const isAdmin = ['ADMIN', 'TEACHER'].includes(user?.role)
  const [expanded, setExpanded]     = useState(false)
  const [comments, setComments]     = useState([])
  const [loadingC, setLoadingC]     = useState(false)
  const [draft,    setDraft]        = useState('')
  const [sending,  setSending]      = useState(false)
  const [reaction, setReaction]     = useState({ count: 0, reacted: false })
  const [loadingR, setLoadingR]     = useState(false)

  const d = new Date(evento.fecha)

  useEffect(() => {
    eventoService.getReactions(evento.id)
      .then(r => setReaction(r.data))
      .catch(() => {})
  }, [evento.id])

  const handleExpand = () => {
    if (!expanded) {
      setLoadingC(true)
      eventoService.getComments(evento.id)
        .then(r => setComments(r.data))
        .catch(() => toast.error('Error al cargar comentarios'))
        .finally(() => setLoadingC(false))
    }
    setExpanded(v => !v)
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

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid rgba(77,160,232,.18)',
      borderRadius: 12, marginBottom: '1rem', overflow: 'hidden',
    }}>
      {/* Etiqueta evento */}
      <div style={{
        background: 'linear-gradient(90deg, var(--green) 0%, #1a3a6e 100%)',
        padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: '.7rem' }}>📅</span>
        <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.8)', fontWeight: 600, letterSpacing: '.04em' }}>
          EVENTO
        </span>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* Fecha badge */}
          <div style={{
            background: 'var(--green)', borderRadius: 10, padding: '.4rem .65rem',
            textAlign: 'center', minWidth: 44, flexShrink: 0,
          }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
              {d.getDate()}
            </div>
            <div style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.7)' }}>
              {d.toLocaleString('es', { month: 'short' }).toUpperCase()}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.9rem', color: 'var(--text)' }}>
              {evento.titulo}
            </div>
            {evento.lugar && (
              <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: 2 }}>
                📍 {evento.lugar}
              </div>
            )}
            <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: 2 }}>
              {d.toLocaleString('es-CL', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {evento.descripcion && (
          <p style={{ margin: '.75rem 0 0', fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            {evento.descripcion}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '.55rem 1.25rem', borderTop: '1px solid var(--border)',
        background: 'var(--surface2)',
      }}>
        <button
          onClick={handleReaction}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: reaction.reacted ? 'var(--green-glo)' : 'transparent',
            border: `1px solid ${reaction.reacted ? 'rgba(77,160,232,.3)' : 'var(--border)'}`,
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
          💬 {expanded ? 'Cerrar' : 'Comentar'}
        </button>
      </div>

      {/* Comentarios */}
      {expanded && (
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'flex-start' }}>
            <Avatar nombre={user?.nombre} size={32} bg="var(--green)" />
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

          {loadingC ? (
            <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>Cargando...</div>
          ) : comments.length === 0 ? (
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', textAlign: 'center' }}>
              Sin comentarios aún. ¡Sé el primero!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Avatar nombre={c.authorName} size={30} bg="var(--green)" />
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 10, padding: '7px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text)' }}>{c.authorName}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: '.65rem', color: 'var(--text3)' }}>
                          {new Date(c.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {(user?.id === c.authorId || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.75rem' }}
                          >
                            ✕
                          </button>
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

// ─── Sidebar derecho: Próximos eventos ───────────────────────────────────────
function UpcomingEventsCard({ eventos, navigate }) {
  const upcoming = eventos.slice(0, 4)
  if (upcoming.length === 0) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', marginBottom: '.75rem',
    }}>
      <div style={{
        padding: '.75rem 1rem .4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.8rem', color: 'var(--text)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>📅</span> Próximos eventos
        </div>
        <button
          onClick={() => navigate('/eventos')}
          style={{ background: 'none', border: 'none', color: 'var(--green-lit)', fontSize: '.68rem', cursor: 'pointer' }}
        >
          Ver todos →
        </button>
      </div>
      <div style={{ padding: '0 .75rem .75rem' }}>
        {upcoming.map((e, i) => {
          const d = new Date(e.fecha)
          return (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '.5rem .25rem', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                background: 'var(--green)', borderRadius: 7, padding: '.3rem .5rem',
                textAlign: 'center', minWidth: 36, flexShrink: 0,
              }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.85rem', color: '#fff' }}>
                  {d.getDate()}
                </div>
                <div style={{ fontSize: '.5rem', color: 'rgba(255,255,255,.7)' }}>
                  {d.toLocaleString('es', { month: 'short' }).toUpperCase()}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '.76rem', fontWeight: 500, color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {e.titulo}
                </div>
                {e.lugar && (
                  <div style={{ fontSize: '.64rem', color: 'var(--text3)', marginTop: 1 }}>
                    📍 {e.lugar}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sidebar derecho: Empresas verificadas ────────────────────────────────────
function CompanyRecoCard({ companies }) {
  if (companies.length === 0) return null
  const shown = companies.slice(0, 5)

  function compInitials(nombre) {
    return (nombre || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'E'
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        padding: '.75rem 1rem .4rem',
        fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.8rem', color: 'var(--text)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>🏢</span> Empresas del territorio
      </div>
      <div style={{ padding: '0 .75rem .75rem' }}>
        {shown.map((c, i) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '.5rem .25rem', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: 'linear-gradient(135deg,#1a4f8c,#2d6a8c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.65rem', color: '#fff',
              flexShrink: 0,
            }}>
              {compInitials(c.nombreEmpresa)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '.75rem', fontWeight: 500, color: 'var(--text)',
                display: 'flex', alignItems: 'center', gap: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {c.nombreEmpresa}
                {c.verified && (
                  <span title="Verificada" style={{ color: 'var(--green-lit)', fontSize: '.65rem', flexShrink: 0 }}>✔</span>
                )}
              </div>
              {c.rubro && (
                <div style={{ fontSize: '.65rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.rubro}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FeedPage principal ───────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  const [posts,       setPosts]       = useState([])
  const [eventos,     setEventos]     = useState([])
  const [companies,   setCompanies]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [following,   setFollowing]   = useState([]) // IDs que sigo
  const [feedFilter,  setFeedFilter]  = useState('all') // 'all' | 'following'

  useEffect(() => {
    Promise.all([
      postService.getAll(),
      eventoService.getAll(),
      companyService.getAll(),
      followService.getMyFollowing(),
    ])
      .then(([postsRes, eventosRes, companiesRes, followingRes]) => {
        setPosts(postsRes.data)
        setEventos(eventosRes.data)
        setCompanies((companiesRes.data || []).filter(c => c.aprobada))
        setFollowing(followingRes.data || [])
      })
      .catch(() => toast.error('Error al cargar el feed'))
      .finally(() => setLoading(false))
  }, [])

  const handleCreated = (newPost) => setPosts(prev => [newPost, ...prev])
  const handleDeleted = (id)      => setPosts(prev => prev.filter(p => p.id !== id))
  const handleUpdated = (updated) => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))

  // Unificar posts y eventos en un solo feed ordenado por fecha
  const feedItems = useMemo(() => {
    const postItems   = posts.map(p => ({ ...p, _type: 'post' }))
    const eventoItems = eventos.map(e => ({ ...e, _type: 'evento', createdAt: e.createdAt || e.fecha }))
    return [...postItems, ...eventoItems].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
  }, [posts, eventos])

  // Filtro "Siguiendo": muestra posts de usuarios que sigo (eventos siempre visibles)
  const visibleItems = useMemo(() => {
    if (feedFilter === 'all') return feedItems
    return feedItems.filter(item =>
      item._type === 'evento' || following.includes(item.authorId)
    )
  }, [feedItems, feedFilter, following])

  return (
    <AppLayout title="Feed">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="feed-grid">

          {/* ── Columna Central ── */}
          <div className="feed-col-center">
            {/* Crear publicación */}
            <CreatePost onCreated={handleCreated} />

            {/* Filtros */}
            <div style={{
              display: 'flex', gap: 6, marginBottom: '.9rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '.35rem .5rem',
            }}>
              {[
                { key: 'all',       label: 'Todos' },
                { key: 'following', label: 'Siguiendo' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFeedFilter(tab.key)}
                  style={{
                    padding: '5px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontFamily: "'Figtree','DM Sans',sans-serif", fontSize: '.8rem', fontWeight: 500,
                    background: feedFilter === tab.key ? 'var(--green-mid)' : 'transparent',
                    color: feedFilter === tab.key ? '#fff' : 'var(--text2)',
                    transition: 'all .15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Feed unificado */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text3)', fontSize: '.85rem' }}>
                Cargando publicaciones...
              </div>
            ) : visibleItems.length === 0 ? (
              <EmptyState
                icon={feedFilter === 'following' ? '👥' : '📢'}
                message={feedFilter === 'following' ? 'Sigue a alguien para ver su contenido aquí' : 'Sé el primero en publicar algo'}
              />
            ) : (
              visibleItems.map(item =>
                item._type === 'evento' ? (
                  <EventCardFeed key={`ev-${item.id}`} evento={item} />
                ) : (
                  <PostCard
                    key={`p-${item.id}`}
                    post={item}
                    onDeleted={handleDeleted}
                    onUpdated={handleUpdated}
                  />
                )
              )
            )}
          </div>

          {/* ── Columna Derecha ── */}
          <div className="feed-col-right">
            <UpcomingEventsCard eventos={eventos} navigate={navigate} />
            <CompanyRecoCard companies={companies} />
          </div>

        </div>
      </div>
    </AppLayout>
  )
}

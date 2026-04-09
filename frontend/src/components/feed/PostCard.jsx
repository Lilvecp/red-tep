import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ThumbsUp, MessageCircle, Pen, X, Trash2 } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { postService, followService, workerService } from '../../services/index'
import { Avatar, Badge, BtnGreen, BtnOutline } from '../ui/index'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const AUTHOR_COLOR = { STUDENT: 'var(--green)', COMPANY: '#2d6a8c', ADMIN: 'var(--amber)' }
const AUTHOR_LABEL = { STUDENT: 'Estudiante', COMPANY: 'Empresa', ADMIN: 'Admin' }
const AUTHOR_BADGE = { STUDENT: 'green', COMPANY: 'green', ADMIN: 'amber' }

export default function PostCard({ post, onDeleted, onUpdated }) {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const [editing,   setEditing]   = useState(false)
  const [draft,     setDraft]     = useState(post.content?.trim() === ' ' ? '' : post.content)
  const [loading,   setLoading]   = useState(false)
  const [expanded,  setExpanded]  = useState(false)
  const [comments,  setComments]  = useState([])
  const [commentDraft, setCommentDraft] = useState('')
  const [sending,   setSending]   = useState(false)
  const [loadingC,  setLoadingC]  = useState(false)
  const [reaction,  setReaction]  = useState({ count: 0, reacted: false })
  const [loadingR,  setLoadingR]  = useState(false)
  const [following, setFollowing] = useState(null) // null = not loaded yet
  const [followLoading, setFollowLoading] = useState(false)

  const isOwner     = user?.id === post.authorId
  const isAdmin     = user?.role === 'ADMIN'
  const isOtherUser = !isOwner
  const hasText     = post.content?.trim() && post.content.trim() !== ' '

  const goToProfile = async () => {
    if (post.authorType === 'COMPANY') {
      navigate(`/empresas/${post.authorId}`)
    } else if (post.authorType === 'STUDENT') {
      try {
        const r = await workerService.getByUserId(post.authorId)
        navigate(`/trabajadores/${r.data.id}`)
      } catch { /* no worker profile found */ }
    }
  }

  // Load reactions on mount
  useEffect(() => {
    postService.getReactions(post.id)
      .then(r => setReaction(r.data))
      .catch(() => {})
  }, [post.id])

  // Load follow status for other users' posts
  useEffect(() => {
    if (isOtherUser) {
      followService.getStatus(post.authorId)
        .then(r => setFollowing(r.data.isFollowing))
        .catch(() => {})
    }
  }, [post.authorId, isOtherUser])

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta publicación?')) return
    try {
      await postService.remove(post.id)
      toast.success('Publicación eliminada')
      onDeleted(post.id)
    } catch { toast.error('No se pudo eliminar') }
  }

  const handleSave = async () => {
    if (!draft.trim() && !post.mediaUrl) return
    setLoading(true)
    try {
      const { data } = await postService.update(post.id, { content: draft || ' ' })
      toast.success('Publicación actualizada')
      onUpdated(data)
      setEditing(false)
    } catch { toast.error('No se pudo actualizar') }
    finally { setLoading(false) }
  }

  const handleReaction = async () => {
    if (loadingR) return
    setLoadingR(true)
    try {
      const { data } = await postService.toggleReaction(post.id)
      setReaction({ count: data.count, reacted: data.reacted })
    } catch { toast.error('Error al reaccionar') }
    finally { setLoadingR(false) }
  }

  const handleExpandComments = () => {
    if (!expanded) {
      setLoadingC(true)
      postService.getComments(post.id)
        .then(r => setComments(r.data))
        .catch(() => toast.error('Error al cargar comentarios'))
        .finally(() => setLoadingC(false))
    }
    setExpanded(v => !v)
  }

  const handleComment = async () => {
    if (!commentDraft.trim()) return
    setSending(true)
    try {
      const { data } = await postService.addComment(post.id, { content: commentDraft })
      setComments(prev => [...prev, data])
      setCommentDraft('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al comentar')
    } finally { setSending(false) }
  }

  const handleDeleteComment = async (cid) => {
    try {
      await postService.deleteComment(post.id, cid)
      setComments(prev => prev.filter(c => c.id !== cid))
    } catch { toast.error('Error al eliminar comentario') }
  }

  const handleFollow = async () => {
    if (followLoading) return
    setFollowLoading(true)
    try {
      if (following) {
        await followService.unfollow(post.authorId)
        setFollowing(false)
        toast.success('Dejaste de seguir')
      } else {
        await followService.follow(post.authorId)
        setFollowing(true)
        toast.success('¡Siguiendo!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error')
    } finally { setFollowLoading(false) }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: '1rem', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 1.25rem .75rem' }}>
        <div
          onClick={post.authorType !== 'ADMIN' ? goToProfile : undefined}
          style={{ cursor: post.authorType !== 'ADMIN' ? 'pointer' : 'default', flexShrink: 0 }}
        >
          <Avatar
            nombre={post.authorName}
            size={40}
            bg={AUTHOR_COLOR[post.authorType] || 'var(--green)'}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              onClick={post.authorType !== 'ADMIN' ? goToProfile : undefined}
              style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', cursor: post.authorType !== 'ADMIN' ? 'pointer' : 'default' }}
              onMouseEnter={e => { if (post.authorType !== 'ADMIN') e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >{post.authorName}</span>
            {post.verified && (
              <span title="Empresa verificada" style={{ color: 'var(--green-lit)', fontSize: '.8rem' }}>✔</span>
            )}
            <Badge label={AUTHOR_LABEL[post.authorType] || post.authorType} color={AUTHOR_BADGE[post.authorType] || 'green'} />
            {isOtherUser && following !== null && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                style={{
                  background: following ? 'var(--surface2)' : 'var(--green-glo)',
                  border: `1px solid ${following ? 'var(--border)' : 'rgba(77,160,232,.3)'}`,
                  color: following ? 'var(--text3)' : 'var(--green-lit)',
                  fontSize: '.65rem', padding: '2px 9px', borderRadius: 20,
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                {followLoading ? '...' : following ? 'Siguiendo' : '+ Seguir'}
              </button>
            )}
          </div>
          <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{formatDate(post.createdAt)}</div>
        </div>

        {(isOwner || isAdmin) && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {isOwner && (
              <button
                onClick={() => { setEditing(!editing); setDraft(hasText ? post.content : '') }}
                style={btnStyle}
              >
                {editing ? <X size={14}/> : <Pen size={14}/>}
              </button>
            )}
            <button onClick={handleDelete} style={{ ...btnStyle, color: 'var(--red)' }}><Trash2 size={14}/></button>
          </div>
        )}
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div style={{ borderTop: '1px solid var(--border)', borderBottom: hasText || editing ? '1px solid var(--border)' : 'none' }}>
          {post.mediaType === 'video'
            ? <video src={post.mediaUrl} style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} controls />
            : <img src={post.mediaUrl} alt="media" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} />
          }
        </div>
      )}

      {/* Texto */}
      {(hasText || editing) && (
        <div style={{ padding: '.75rem 1.25rem' }}>
          {editing ? (
            <div>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, resize: 'vertical',
                  background: 'var(--surface2)', border: '1px solid var(--border2)',
                  color: 'var(--text)', fontFamily: "'Figtree','DM Sans',sans-serif",
                  fontSize: '.875rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <BtnGreen onClick={handleSave} disabled={loading} style={{ fontSize: '.8rem', padding: '7px 14px' }}>Guardar</BtnGreen>
                <BtnOutline onClick={() => setEditing(false)} style={{ fontSize: '.8rem', padding: '7px 14px' }}>Cancelar</BtnOutline>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {post.content}
            </p>
          )}
        </div>
      )}

      {/* Barra de acciones */}
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
          <ThumbsUp size={13}/> {reaction.count > 0 && <span>{reaction.count}</span>}
        </button>

        <button
          onClick={handleExpandComments}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text2)', borderRadius: 20, padding: '4px 12px',
            cursor: 'pointer', fontSize: '.78rem', fontWeight: 500,
          }}
        >
          <MessageCircle size={13}/> {expanded ? 'Cerrar' : 'Comentar'}
        </button>
      </div>

      {/* Comentarios */}
      {expanded && (
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          {/* Input */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'flex-start' }}>
            <Avatar
              nombre={user?.nombre}
              size={32}
              bg={AUTHOR_COLOR[user?.role === 'COMPANY' ? 'COMPANY' : user?.role === 'ADMIN' ? 'ADMIN' : 'STUDENT'] || 'var(--green)'}
            />
            <div style={{ flex: 1 }}>
              <input
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
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
              disabled={sending || !commentDraft.trim()}
              style={{
                background: 'var(--green-mid)', border: 'none', color: '#fff',
                borderRadius: 20, padding: '8px 14px', cursor: 'pointer',
                fontSize: '.78rem', opacity: (!commentDraft.trim() || sending) ? .5 : 1,
              }}
            >
              Enviar
            </button>
          </div>

          {/* Lista */}
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
                  <Avatar nombre={c.authorName} size={30} bg={AUTHOR_COLOR[c.authorType] || 'var(--green)'} />
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 10, padding: '7px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text)' }}>{c.authorName}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: '.65rem', color: 'var(--text3)' }}>{formatDate(c.createdAt)}</span>
                        {(user?.id === c.authorId || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display:'flex', alignItems:'center', padding: '0 2px' }}
                          >
                            <X size={12} />
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

const btnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '.85rem', padding: '4px 6px', borderRadius: 6,
  color: 'var(--text3)', transition: 'background .15s',
}

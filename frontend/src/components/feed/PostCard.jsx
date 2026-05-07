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

const AUTHOR_COLOR = { STUDENT: 'var(--green)', COMPANY: '#3B6EDC', ADMIN: 'var(--amber)' }
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
    // Once opened, keep open (user must click again only to toggle off if they want)
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
            ? <video src={post.mediaUrl} className="post-media" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} controls />
            : <img src={post.mediaUrl} alt="media" className="post-media" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} />
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

      {/* Barra de acciones — estilo LinkedIn */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '.35rem .75rem', borderTop: '1px solid var(--border)',
      }}>
        <button
          onClick={handleReaction}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: 'transparent', border: 'none',
            color: reaction.reacted ? 'var(--green-lit)' : 'var(--text2)',
            borderRadius: 8, padding: '8px 4px', cursor: 'pointer',
            fontSize: '.78rem', fontWeight: reaction.reacted ? 600 : 400, transition: 'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ThumbsUp size={15} style={{ fill: reaction.reacted ? 'var(--green-lit)' : 'none' }}/>
          <span>{reaction.reacted ? 'Me gusta' : 'Me gusta'}{reaction.count > 0 && ` · ${reaction.count}`}</span>
        </button>

        <button
          onClick={handleExpandComments}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: expanded ? 'var(--surface2)' : 'transparent', border: 'none',
            color: expanded ? 'var(--green-lit)' : 'var(--text2)',
            borderRadius: 8, padding: '8px 4px', cursor: 'pointer',
            fontSize: '.78rem', fontWeight: 400, transition: 'all .15s',
          }}
          onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'var(--surface2)' }}
          onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'transparent' }}
        >
          <MessageCircle size={15}/>
          <span>Comentar{comments.length > 0 && ` · ${comments.length}`}</span>
        </button>
      </div>

      {/* Sección de comentarios — se mantiene abierta una vez expandida */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '.9rem 1.1rem 1rem' }}>
          {/* Lista de comentarios */}
          {loadingC ? (
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', padding: '.25rem 0 .75rem' }}>Cargando comentarios...</div>
          ) : comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Avatar nombre={c.authorName} size={30} bg={AUTHOR_COLOR[c.authorType] || 'var(--green)'} />
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 12, padding: '7px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--text)' }}>{c.authorName}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{formatDate(c.createdAt)}</span>
                        {(user?.id === c.authorId || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display:'flex', alignItems:'center', padding: '0 2px' }}
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.5 }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', padding: '.2rem 0 .75rem' }}>
              Sin comentarios aún. ¡Sé el primero!
            </div>
          )}

          {/* Input de comentario — siempre visible al fondo */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Avatar
              nombre={user?.nombre}
              size={32}
              bg={AUTHOR_COLOR[user?.role === 'COMPANY' ? 'COMPANY' : user?.role === 'ADMIN' ? 'ADMIN' : 'STUDENT'] || 'var(--green)'}
            />
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                placeholder="Escribe un comentario..."
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                style={{
                  width: '100%', padding: '9px 44px 9px 14px', borderRadius: 20,
                  background: 'var(--surface2)', border: '1px solid var(--border2)',
                  color: 'var(--text)', fontFamily: "'Figtree','DM Sans',sans-serif",
                  fontSize: '.83rem', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(77,160,232,.4)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              <button
                onClick={handleComment}
                disabled={sending || !commentDraft.trim()}
                style={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  background: commentDraft.trim() ? 'var(--green-mid)' : 'transparent',
                  border: 'none', color: commentDraft.trim() ? '#fff' : 'var(--text3)',
                  borderRadius: '50%', width: 28, height: 28, cursor: commentDraft.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}
              >
                <MessageCircle size={13}/>
              </button>
            </div>
          </div>
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

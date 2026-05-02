import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { User, Megaphone, Film, Mail, Phone, MapPin, Clock, FileText, Briefcase } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { Avatar, Badge, Chip, EmptyState, BadgePill } from '../../components/ui'
import { workerService, postService, followService, badgeService } from '../../services'
import PostCard from '../../components/feed/PostCard'
import useAuthStore from '../../store/authStore'
import { useChat } from '../../hooks/useChat'

const DEFAULT_BANNER = 'linear-gradient(135deg, #3B6EDC 0%, #1e2d54 100%)'

function initials(nombre) {
  return (nombre || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '??'
}

export default function PublicWorkerProfile() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()

  const [worker,     setWorker]    = useState(null)
  const [posts,      setPosts]     = useState([])
  const [badges,     setBadges]    = useState([])
  const [loading,    setLoading]   = useState(true)
  const [following,  setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [tab,        setTab]       = useState('perfil') // 'perfil' | 'publicaciones' | 'media'
  const { openConversation } = useChat()

  useEffect(() => {
    Promise.all([
      workerService.getById(Number(id)),
    ])
      .then(([wRes]) => {
        const w = wRes.data
        setWorker(w)
        return Promise.allSettled([
          postService.getAll({ authorId: w.userId }),
          badgeService.getUserBadges(w.userId),
        ])
      })
      .then(([pRes, bRes]) => {
        if (pRes.status === 'fulfilled') setPosts(pRes.value.data)
        if (bRes.status === 'fulfilled') setBadges(bRes.value.data)
      })
      .catch(() => toast.error('Error al cargar el perfil'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (worker && user?.id !== worker.userId) {
      followService.getStatus(worker.userId)
        .then(r => setFollowing(r.data.isFollowing))
        .catch(() => {})
    }
  }, [worker, user?.id])

  const handleFollow = async () => {
    if (followLoading) return
    setFollowLoading(true)
    try {
      if (following) {
        await followService.unfollow(worker.userId)
        setFollowing(false)
        toast.success('Dejaste de seguir')
      } else {
        await followService.follow(worker.userId)
        setFollowing(true)
        toast.success('¡Siguiendo!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error')
    } finally { setFollowLoading(false) }
  }

  if (loading) {
    return (
      <AppLayout title="Perfil">
        <div style={{ color: 'var(--text2)', padding: '3rem', textAlign: 'center' }}>Cargando perfil...</div>
      </AppLayout>
    )
  }

  if (!worker) {
    return (
      <AppLayout title="Perfil">
        <EmptyState icon={User} message="Perfil no encontrado" />
      </AppLayout>
    )
  }

  const nombre      = worker.user?.nombre || ''
  const banner      = worker.bannerColor || DEFAULT_BANNER
  const isOwnProfile = user?.id === worker.userId

  const INSIGNIAS = [
    { tipo: 'PERFIL_COMPLETO',       icon: '🏅', label: 'Perfil completo' },
    { tipo: 'VALIDADO_POR_PROFESOR', icon: '✅', label: 'Validado' },
    { tipo: 'EXPERIENCIA_PRACTICA',  icon: '🎬', label: 'Práctica' },
    { tipo: 'PRIMERA_POSTULACION',   icon: '💼', label: '1ª Postulación' },
    { tipo: 'TOP_CANDIDATO',         icon: '⭐', label: 'Top candidato' },
  ]

  return (
    <AppLayout title="Perfil de estudiante">
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Banner + avatar ── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
          {/* Banner */}
          <div style={{
            height: 140,
            background: banner,
            position: 'relative',
          }} />

          {/* Info del perfil */}
          <div style={{ background: 'var(--surface)', padding: '0 1.75rem 1.5rem' }}>
            {/* Avatar sobrepuesto */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'var(--green)',
                border: '4px solid var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Sora',sans-serif", fontWeight: 800,
                fontSize: '1.6rem', color: '#fff',
                overflow: 'hidden', flexShrink: 0, position: 'relative',
              }}>
                {worker.fotoUrl
                  ? <img src={worker.fotoUrl} alt={nombre} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(nombre)
                }
              </div>

              <div style={{ display: 'flex', gap: 8, paddingBottom: 4, flexWrap: 'wrap' }}>
                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    style={{
                      padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      background: following ? 'var(--surface2)' : 'var(--green-mid)',
                      color: following ? 'var(--text2)' : '#fff',
                      fontSize: '.82rem', fontWeight: 600,
                      fontFamily: "'Figtree','DM Sans',sans-serif",
                    }}
                  >
                    {followLoading ? '...' : following ? 'Siguiendo' : '+ Seguir'}
                  </button>
                )}
                {!isOwnProfile && (
                  <button
                    onClick={() => openConversation(worker.userId)}
                    style={{
                      padding: '7px 18px', borderRadius: 20,
                      border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--text2)',
                      fontSize: '.82rem', cursor: 'pointer',
                      fontFamily: "'Figtree','DM Sans',sans-serif",
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    💬 Mensaje
                  </button>
                )}
                {worker.user?.email && (
                  <a
                    href={`mailto:${worker.user.email}`}
                    style={{
                      padding: '7px 18px', borderRadius: 20,
                      border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--text2)',
                      fontSize: '.82rem', textDecoration: 'none',
                      fontFamily: "'Figtree','DM Sans',sans-serif",
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    Contactar
                  </a>
                )}
              </div>
            </div>

            <div style={{ marginTop: '.75rem' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '1.15rem', color: 'var(--text)', marginBottom: 3 }}>
                {nombre}
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: 6 }}>
                {worker.especialidad || 'Sin especialidad'}{worker.curso ? ` · ${worker.curso}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {worker.perfilCompleto && <Badge label="Perfil completo" color="amber" />}
                {worker.disponibilidad && <Badge label={worker.disponibilidad} color="green" />}
                {worker?.modalidad === 'BUSCANDO_PRACTICA' && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(59,110,220,.15)', border:'1px solid rgba(59,110,220,.3)', borderRadius:20, padding:'2px 9px', fontSize:'.67rem', color:'#3B6EDC', fontWeight:600 }}>
                    Buscando práctica
                  </span>
                )}
                {worker?.modalidad === 'BUSCANDO_TRABAJO' && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(34,197,94,.12)', border:'1px solid rgba(34,197,94,.25)', borderRadius:20, padding:'2px 9px', fontSize:'.67rem', color:'rgba(34,197,94,.9)', fontWeight:600 }}>
                    Buscando trabajo
                  </span>
                )}
                {worker?.modalidad === 'EGRESADO' && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.3)', borderRadius:20, padding:'2px 9px', fontSize:'.67rem', color:'#f59e0b', fontWeight:600 }}>
                    Egresado {worker.anioEgreso} ✓
                  </span>
                )}
              </div>
            </div>

            {worker.experienciaPractica && (
              <p style={{ margin: '.75rem 0 0', fontSize: '.83rem', color: 'var(--text2)', lineHeight: 1.65, maxWidth: 600 }}>
                {worker.experienciaPractica}
              </p>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: '1.25rem',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '.35rem .5rem',
        }}>
          {[
            { key: 'perfil',        label: 'Perfil' },
            { key: 'publicaciones', label: `Publicaciones (${posts.length})` },
            { key: 'media',         label: `Multimedia (${worker.media?.length || 0})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: "'Figtree','DM Sans',sans-serif", fontSize: '.82rem', fontWeight: 500,
                background: tab === t.key ? 'var(--green-mid)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--text2)',
                transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Perfil ── */}
        {tab === 'perfil' && (
          <div className="r-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>

            {/* Información */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', marginBottom: '1rem' }}>
                Información
              </div>
              {[
                [Mail,  worker.user?.email || '—'],
                [Phone, worker.telefono || 'No registrado'],
                [MapPin, worker.direccion || 'No registrada'],
                [Clock, worker.disponibilidad || 'Por definir'],
              ].map(([Icon, val]) => (
                <div key={val} style={{ display: 'flex', gap: 8, marginBottom: '.55rem', fontSize: '.8rem', color: 'var(--text2)', alignItems: 'center' }}>
                  <Icon size={13} color="var(--green-lit)" style={{ flexShrink: 0 }} /><span>{val}</span>
                </div>
              ))}
              {(worker?.modalidad === 'BUSCANDO_TRABAJO' || worker?.modalidad === 'EGRESADO') && worker?.pretensionRenta && (
                <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.76rem', color:'var(--text2)', marginBottom:'.45rem' }}>
                  <Briefcase size={13} strokeWidth={1.8}/> {worker.pretensionRenta}
                </div>
              )}
            </div>

            {/* Habilidades */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', marginBottom: '1rem' }}>
                Habilidades
              </div>
              {worker.habilidades?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {worker.habilidades.map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: '.78rem', color: 'var(--text)', width: 120, flexShrink: 0 }}>{h.nombre}</div>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--surface2)' }}>
                        <div style={{ height: 5, borderRadius: 3, background: 'var(--green-mid)', width: `${(h.nivel || 3) * 20}%` }} />
                      </div>
                      <div style={{ fontSize: '.65rem', color: 'var(--text3)', width: 30, textAlign: 'right' }}>{(h.nivel || 3) * 20}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>Sin habilidades registradas</div>
              )}
            </div>

            {/* Insignias */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', gridColumn: '1 / -1' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', marginBottom: '1rem' }}>
                Insignias
              </div>
              {badges.length === 0 ? (
                <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>Este estudiante aún no tiene insignias.</div>
              ) : (
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {badges.map(award => <BadgePill key={award.id} award={award} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Publicaciones ── */}
        {tab === 'publicaciones' && (
          <div>
            {posts.length === 0 ? (
              <EmptyState icon={Megaphone} message="Este estudiante aún no ha publicado nada" />
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
                  onUpdated={updated => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))}
                />
              ))
            )}
          </div>
        )}

        {/* ── Tab: Multimedia ── */}
        {tab === 'media' && (
          <div>
            {!worker.media?.length ? (
              <EmptyState icon={Film} message="Sin fotos o videos de práctica subidos" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {worker.media.map(m => (
                  <div key={m.id} style={{
                    borderRadius: 12, overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    aspectRatio: '1',
                  }}>
                    {m.tipo === 'VIDEO'
                      ? <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                      : <img src={m.url} alt={m.descripcion} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { User, Megaphone, Film } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { Avatar, Badge, Chip, EmptyState } from '../../components/ui'
import { workerService, postService, followService } from '../../services'
import PostCard from '../../components/feed/PostCard'
import useAuthStore from '../../store/authStore'

const DEFAULT_BANNER = 'linear-gradient(135deg, #1a4f8c 0%, #0b1729 100%)'

function initials(nombre) {
  return (nombre || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '??'
}

export default function PublicWorkerProfile() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()

  const [worker,    setWorker]    = useState(null)
  const [posts,     setPosts]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [tab,       setTab]       = useState('perfil') // 'perfil' | 'publicaciones' | 'media'

  useEffect(() => {
    Promise.all([
      workerService.getById(Number(id)),
    ])
      .then(([wRes]) => {
        const w = wRes.data
        setWorker(w)
        // Cargar posts del trabajador
        return postService.getAll({ authorId: w.userId })
      })
      .then(pRes => setPosts(pRes.data))
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

              <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
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
                {worker.user?.email && (
                  <a
                    href={`mailto:${worker.user.email}`}
                    style={{
                      padding: '7px 18px', borderRadius: 20,
                      border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--text2)',
                      fontSize: '.82rem', textDecoration: 'none',
                      fontFamily: "'Figtree','DM Sans',sans-serif",
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
                {worker.disponibilidad && <Badge label={worker.disponibilidad.replace(/_/g, ' ')} color="green" />}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>

            {/* Información */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', marginBottom: '1rem' }}>
                Información
              </div>
              {[
                ['📧', worker.user?.email || '—'],
                ['📞', worker.telefono || 'No registrado'],
                ['📍', worker.direccion || 'No registrada'],
                ['🕐', worker.disponibilidad?.replace(/_/g, ' ') || 'Por definir'],
              ].map(([icon, val]) => (
                <div key={icon} style={{ display: 'flex', gap: 8, marginBottom: '.55rem', fontSize: '.8rem', color: 'var(--text2)' }}>
                  <span>{icon}</span><span>{val}</span>
                </div>
              ))}
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
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {INSIGNIAS.map(({ tipo, icon, label }) => {
                  const earned = worker.insignias?.some(i => i.tipo === tipo)
                  return (
                    <div key={tipo} style={{
                      background: earned ? 'var(--amber-bg)' : 'var(--surface2)',
                      border: `1px solid ${earned ? 'rgba(212,160,23,.3)' : 'var(--border)'}`,
                      borderRadius: 10, padding: '.65rem .9rem',
                      display: 'flex', alignItems: 'center', gap: 7,
                      opacity: earned ? 1 : .4,
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>{earned ? icon : '🔒'}</span>
                      <span style={{ fontSize: '.72rem', color: earned ? 'var(--amber-lit)' : 'var(--text3)', fontWeight: 500 }}>{label}</span>
                    </div>
                  )
                })}
              </div>
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

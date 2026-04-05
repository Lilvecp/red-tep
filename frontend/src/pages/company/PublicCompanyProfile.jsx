import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import AppLayout from '../../components/layout/AppLayout'
import { Badge, EmptyState } from '../../components/ui'
import { companyService, postService, followService } from '../../services'
import PostCard from '../../components/feed/PostCard'
import useAuthStore from '../../store/authStore'

const DEFAULT_BANNER = 'linear-gradient(135deg, #1a4f8c 0%, #0b1729 100%)'

export default function PublicCompanyProfile() {
  const { userId }  = useParams()
  const navigate    = useNavigate()
  const { user }    = useAuthStore()

  const [company,       setCompany]       = useState(null)
  const [posts,         setPosts]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [following,     setFollowing]     = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [tab,           setTab]           = useState('perfil')

  const uid = Number(userId)

  useEffect(() => {
    companyService.getPublic(uid)
      .then(r => {
        setCompany(r.data)
        return postService.getAll({ authorId: uid })
      })
      .then(r => setPosts(r.data))
      .catch(() => toast.error('Error al cargar el perfil'))
      .finally(() => setLoading(false))
  }, [uid])

  useEffect(() => {
    if (user?.id !== uid) {
      followService.getStatus(uid)
        .then(r => setFollowing(r.data.isFollowing))
        .catch(() => {})
    }
  }, [uid, user?.id])

  const handleFollow = async () => {
    if (followLoading) return
    setFollowLoading(true)
    try {
      if (following) {
        await followService.unfollow(uid)
        setFollowing(false)
        toast.success('Dejaste de seguir')
      } else {
        await followService.follow(uid)
        setFollowing(true)
        toast.success('¡Siguiendo!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error')
    } finally { setFollowLoading(false) }
  }

  if (loading) {
    return (
      <AppLayout title="Perfil de empresa">
        <div style={{ color: 'var(--text2)', padding: '3rem', textAlign: 'center' }}>Cargando perfil...</div>
      </AppLayout>
    )
  }

  if (!company) {
    return (
      <AppLayout title="Perfil de empresa">
        <EmptyState icon="🏢" message="Empresa no encontrada" />
      </AppLayout>
    )
  }

  const isOwnProfile = user?.id === uid
  const banner       = company.bannerColor || DEFAULT_BANNER
  const initials     = (company.nombreEmpresa || 'E').slice(0, 2).toUpperCase()

  return (
    <AppLayout title="Perfil de empresa">
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Banner + logo ── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
          <div style={{ height: 140, background: banner, position: 'relative' }} />

          <div style={{ background: 'var(--surface)', padding: '0 1.75rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44 }}>
              {/* Logo */}
              <div style={{
                width: 88, height: 88, borderRadius: 14,
                background: 'var(--green)',
                border: '4px solid var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Sora',sans-serif", fontWeight: 800,
                fontSize: '1.6rem', color: '#fff',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {company.logoUrl
                  ? <img src={company.logoUrl} alt={company.nombreEmpresa} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials
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
                {company.user?.email && (
                  <a
                    href={`mailto:${company.user.email}`}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '1.15rem', color: 'var(--text)' }}>
                  {company.nombreEmpresa}
                </div>
                {company.verified && (
                  <span title="Empresa verificada" style={{ color: 'var(--green-lit)', fontSize: '1rem' }}>✔</span>
                )}
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: 6 }}>
                {company.rubro || 'Sin rubro'}{company.comuna ? ` · ${company.comuna}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {company.verified && <Badge label="Verificada" color="green" />}
              </div>
            </div>
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
            { key: 'ofertas',       label: `Ofertas activas (${company.ofertas?.length || 0})` },
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
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', marginBottom: '1rem' }}>
              Información
            </div>
            {[
              ['🏢', 'Razón social', company.nombreEmpresa],
              ['🏭', 'Rubro',       company.rubro        || '—'],
              ['📍', 'Comuna',      company.comuna        || '—'],
              ['📞', 'Teléfono',    company.telefono      || 'No registrado'],
              ['🌐', 'Sitio web',   company.sitioWeb      || '—'],
              ['🔢', 'RUT',         company.rut           || '—'],
            ].map(([icon, label, val]) => (
              <div key={label} style={{ display: 'flex', gap: 10, marginBottom: '.6rem', fontSize: '.82rem', color: 'var(--text2)', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0 }}>{icon}</span>
                <span style={{ color: 'var(--text3)', minWidth: 80 }}>{label}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Publicaciones ── */}
        {tab === 'publicaciones' && (
          <div>
            {posts.length === 0 ? (
              <EmptyState icon="📢" message="Esta empresa aún no ha publicado nada" />
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

        {/* ── Tab: Ofertas ── */}
        {tab === 'ofertas' && (
          <div>
            {!company.ofertas?.length ? (
              <EmptyState icon="💼" message="Sin ofertas activas publicadas" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {company.ofertas.map(o => (
                  <div
                    key={o.id}
                    onClick={() => navigate(`/ofertas/${o.id}`)}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '1rem 1.25rem',
                      cursor: 'pointer', transition: 'border-color .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-mid)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.9rem', color: 'var(--text)', marginBottom: '.3rem' }}>
                      {o.cargo}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {o.disponibilidad && <span style={{ background: 'var(--surface2)', color: 'var(--text2)', fontSize: '.68rem', padding: '3px 8px', borderRadius: 8 }}>{o.disponibilidad.replace(/_/g, ' ')}</span>}
                      {o.salario && <span style={{ background: 'var(--amber-bg)', color: 'var(--amber-lit)', fontSize: '.68rem', padding: '3px 8px', borderRadius: 8 }}>{o.salario}</span>}
                      {o.comuna && <span style={{ background: 'var(--surface2)', color: 'var(--text2)', fontSize: '.68rem', padding: '3px 8px', borderRadius: 8 }}>📍 {o.comuna}</span>}
                    </div>
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

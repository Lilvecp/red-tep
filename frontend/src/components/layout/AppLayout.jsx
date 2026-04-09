import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Search, Home, Calendar, Briefcase, Users, Bell, User, ThumbsUp, MessageCircle } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { companyService, notificationService, followService, workerService } from '../../services/index'

// ─── Buscador global ──────────────────────────────────────────────────────────
function GlobalSearch() {
  const navigate   = useNavigate()
  const [q,        setQ]        = useState('')
  const [results,  setResults]  = useState({ workers: [], companies: [] })
  const [open,     setOpen]     = useState(false)
  const ref        = useRef()
  const timerRef   = useRef()

  const doSearch = async (val) => {
    if (!val.trim()) { setResults({ workers: [], companies: [] }); setOpen(false); return }
    const [w, c] = await Promise.allSettled([
      workerService.search({ nombre: val }),
      companyService.search(val),
    ])
    const workers   = w.status === 'fulfilled' ? (w.value.data.results || []).slice(0, 4) : []
    const companies = c.status === 'fulfilled' ? (c.value.data || []).slice(0, 4) : []
    setResults({ workers, companies })
    setOpen(workers.length > 0 || companies.length > 0)
  }

  const handleChange = (e) => {
    const val = e.target.value
    setQ(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(val), 300)
  }

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const go = (path) => { navigate(path); setOpen(false); setQ('') }

  const ini = (nombre) => (nombre || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none', display:'flex', alignItems:'center' }}><Search size={14}/></span>
        <input
          value={q}
          onChange={handleChange}
          onFocus={() => q && setOpen(true)}
          placeholder="Buscar personas, empresas..."
          style={{
            width:'100%', padding:'7px 12px 7px 32px', boxSizing:'border-box',
            background:'var(--surface)', border:'1px solid var(--border2)',
            borderRadius:10, color:'var(--text)',
            fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.82rem', outline:'none',
          }}
        />
      </div>

      {open && (
        <div style={{
          position:'absolute', top:'110%', left:0, right:0,
          background:'var(--bg2)', border:'1px solid var(--border)',
          borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.5)', zIndex:200, overflow:'hidden',
        }}>
          {results.workers.length > 0 && (
            <>
              <div style={{ padding:'5px 12px', fontSize:'.6rem', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', background:'var(--surface2)', fontWeight:600 }}>Estudiantes</div>
              {results.workers.map(w => (
                <div key={w.id} onClick={() => go(`/trabajadores/${w.id}`)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.62rem', fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden', position:'relative' }}>
                    {w.fotoUrl
                      ? <img src={w.fotoUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                      : ini(w.user?.nombre)
                    }
                  </div>
                  <div>
                    <div style={{ fontSize:'.8rem', color:'var(--text)', fontWeight:500 }}>{w.user?.nombre}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--text3)' }}>{w.especialidad || 'Estudiante'}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          {results.companies.length > 0 && (
            <>
              <div style={{ padding:'5px 12px', fontSize:'.6rem', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', background:'var(--surface2)', fontWeight:600 }}>Empresas</div>
              {results.companies.map(c => (
                <div key={c.id} onClick={() => go(`/empresas/${c.userId}`)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <div style={{ width:28, height:28, borderRadius:6, background:'#2d6a8c', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.62rem', fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden', position:'relative' }}>
                    {c.logoUrl
                      ? <img src={c.logoUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                      : (c.nombreEmpresa?.[0] || '?')
                    }
                  </div>
                  <div>
                    <div style={{ fontSize:'.8rem', color:'var(--text)', fontWeight:500 }}>{c.nombreEmpresa}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--text3)' }}>{c.rubro || 'Empresa'}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Menus ────────────────────────────────────────────────────────────────────
const MENU_COMMON = [
  { icon: Home,     label: 'Feed',    path: '/feed' },
  { icon: Calendar, label: 'Eventos', path: '/eventos' },
]

const MENU_BY_ROLE = {
  STUDENT_TP:   [{ icon: Briefcase, label: 'Oportunidades', path: '/ofertas' }],
  STUDENT_EPJA: [{ icon: Briefcase, label: 'Oportunidades', path: '/ofertas' }],
  COMPANY:      [{ icon: Users,     label: 'Candidatos',    path: '/candidatos' }],
}

const ADMIN_ROLES = ['ADMIN']

function getMenus(role) {
  return {
    common: MENU_COMMON,
    extra:  MENU_BY_ROLE[role] || [],
  }
}

function initials(nombre) {
  return (nombre || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '??'
}

function avatarColor(role) {
  if (ADMIN_ROLES.includes(role)) return 'var(--amber)'
  if (role === 'COMPANY') return '#2d6a8c'
  return 'var(--green)'
}

function roleLabel(role) {
  const map = {
    STUDENT_TP:   'Estudiante',
    STUDENT_EPJA: 'Estudiante',
    COMPANY:      'Empresa',
    ADMIN:        'Administrador',
  }
  return map[role] || role
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ item, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '.62rem 1rem', borderRadius: 10,
        margin: '2px .75rem',
        fontSize: '.83rem', fontWeight: active ? 600 : 400,
        color: active ? 'var(--green-lit)' : 'var(--text2)',
        background: active ? 'var(--green-glo)' : 'transparent',
        cursor: 'pointer', transition: 'all .15s',
        borderLeft: active ? '2px solid var(--green-lit)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <item.icon size={16} strokeWidth={2} />
      <span>{item.label}</span>
    </div>
  )
}

// ─── Notificaciones Bell ──────────────────────────────────────────────────────
function NotificationBell() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread,        setUnread]        = useState(0)
  const ref = useRef()

  const load = () => {
    notificationService.getAll()
      .then(r => {
        setNotifications(r.data.notifications || [])
        setUnread(r.data.unreadCount || 0)
      })
      .catch(() => {})
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(v => !v)
    if (!open && unread > 0) notificationService.readAll().then(() => setUnread(0)).catch(() => {})
  }

  const TypeIcon = ({ type }) => {
    if (type === 'FOLLOW')  return <User size={14} />
    if (type === 'COMMENT') return <MessageCircle size={14} />
    if (type === 'LIKE')    return <ThumbsUp size={14} />
    return <Bell size={14} />
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        style={{
          position: 'relative',
          background: open ? 'var(--surface2)' : 'transparent',
          border: '1px solid var(--border)', borderRadius: 8,
          padding: '6px 10px', cursor: 'pointer', color: 'var(--text2)',
          fontSize: '.85rem', transition: 'all .15s',
        }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--accent)', color: '#fff',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: '.58rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12, width: 300, maxHeight: 380, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,.5)', zIndex: 100,
        }}>
          <div style={{
            padding: '.75rem 1rem', borderBottom: '1px solid var(--border)',
            fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.82rem', color: 'var(--text)',
          }}>
            Notificaciones
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.8rem' }}>
              Sin notificaciones
            </div>
          ) : notifications.map(n => (
            <div key={n.id} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '.75rem 1rem', borderBottom: '1px solid var(--border)',
              background: n.read ? 'transparent' : 'var(--green-glo)',
            }}>
              <div style={{ flexShrink: 0, marginTop: 2, color: 'var(--text3)' }}><TypeIcon type={n.type} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.78rem', color: 'var(--text)', lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: '.65rem', color: 'var(--text3)', marginTop: 2 }}>
                  {new Date(n.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AppLayout ────────────────────────────────────────────────────────────────
export default function AppLayout({ children, title, actions }) {
  const navigate = useNavigate()
  const loc      = useLocation()
  const { user, logout, photoUrl, setPhotoUrl } = useAuthStore()
  const { common, extra } = getMenus(user?.role)

  const [companyVerified, setCompanyVerified] = useState(false)
  const [followStats,     setFollowStats]     = useState({ followers: 0, following: 0 })

  useEffect(() => {
    if (user?.role === 'COMPANY') {
      companyService.getMe()
        .then(r => { setCompanyVerified(r.data.verified); if (r.data.logoUrl) setPhotoUrl(r.data.logoUrl) })
        .catch(() => {})
    }
    if (['STUDENT_TP', 'STUDENT_EPJA'].includes(user?.role)) {
      workerService.getMe()
        .then(r => { if (r.data.fotoUrl) setPhotoUrl(r.data.fotoUrl) })
        .catch(() => {})
    }
    followService.getMyStats()
      .then(r => setFollowStats(r.data))
      .catch(() => {})
  }, [user?.role])

  const handleLogout  = () => { logout(); toast.success('Sesión cerrada'); navigate('/') }
  const avColor       = avatarColor(user?.role)
  const profilePath   = user?.role === 'ADMIN' ? '/admin' : '/perfil'
  const isOnProfile   = loc.pathname === profilePath

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ═══ SIDEBAR ═══════════════════════════════════════════════════════════ */}
      <aside style={{
        width: 268, flexShrink: 0,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>

        {/* ── Logo ── */}
        <div style={{
          padding: '1.1rem 1.25rem .9rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <img
            src="/logo.png"
            alt="Logo"
            onError={e => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextSibling.style.display = 'flex'
            }}
            style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          />
          {/* Fallback si no hay imagen */}
          <div style={{
            display: 'none', width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,#2665b5,#ec4899)',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 11, color: '#fff',
            boxShadow: '0 3px 10px rgba(38,101,181,.4)',
          }}>RT</div>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', letterSpacing: '.01em' }}>
              RED TEP
            </div>
            <div style={{ fontSize: '.6rem', color: 'var(--text3)', lineHeight: 1.2, marginTop: 1 }}>
              Centro Educacional Cardenal J.M. Caro
            </div>
          </div>
        </div>

        {/* ── Tarjeta de perfil ── */}
        <div
          onClick={() => navigate(profilePath)}
          style={{
            padding: '1.5rem 1.25rem 1.25rem',
            cursor: 'pointer',
            background: isOnProfile
              ? 'linear-gradient(180deg, rgba(77,160,232,.1) 0%, transparent 100%)'
              : 'transparent',
            borderBottom: '1px solid var(--border)',
            transition: 'background .15s',
          }}
          onMouseEnter={e => { if (!isOnProfile) e.currentTarget.style.background = 'rgba(255,255,255,.03)' }}
          onMouseLeave={e => { e.currentTarget.style.background = isOnProfile ? 'linear-gradient(180deg, rgba(77,160,232,.1) 0%, transparent 100%)' : 'transparent' }}
        >
          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: avColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Sora',sans-serif", fontWeight: 800,
              fontSize: '1.35rem', color: '#fff',
              border: `3px solid ${isOnProfile ? 'var(--green-lit)' : 'rgba(255,255,255,.1)'}`,
              boxShadow: isOnProfile ? '0 0 0 4px rgba(77,160,232,.15)' : '0 4px 16px rgba(0,0,0,.3)',
              transition: 'all .2s',
              overflow: 'hidden',
            }}>
              {photoUrl
                ? <img src={photoUrl} alt={user?.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                : initials(user?.nombre)
              }
            </div>
          </div>

          {/* Nombre y rol */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Sora',sans-serif", fontWeight: 700,
              fontSize: '.92rem', color: 'var(--text)',
              marginBottom: 3, lineHeight: 1.3,
            }}>
              {user?.nombre}
            </div>
            <div style={{
              fontSize: '.72rem',
              color: isOnProfile ? 'var(--green-lit)' : 'var(--text3)',
              marginBottom: 6,
            }}>
              {roleLabel(user?.role)}
              {user?.role === 'COMPANY' && companyVerified && (
                <span style={{ marginLeft: 5, color: 'var(--green-lit)' }}>✔</span>
              )}
            </div>

            {/* Stats seguidores */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 0,
              background: 'var(--surface2)', borderRadius: 10,
              border: '1px solid var(--border)', overflow: 'hidden',
              marginTop: 4,
            }}>
              <div style={{ flex: 1, padding: '.45rem .5rem', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>
                  {followStats.followers}
                </div>
                <div style={{ fontSize: '.6rem', color: 'var(--text3)', marginTop: 1 }}>seguidores</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ flex: 1, padding: '.45rem .5rem', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>
                  {followStats.following}
                </div>
                <div style={{ fontSize: '.6rem', color: 'var(--text3)', marginTop: 1 }}>siguiendo</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navegación ── */}
        <nav style={{ flex: 1, paddingTop: '.75rem' }}>
          <div style={{
            padding: '.3rem 1.25rem .2rem',
            fontSize: '.6rem', textTransform: 'uppercase',
            letterSpacing: '.1em', color: 'var(--text3)', fontWeight: 600,
          }}>
            Principal
          </div>
          {common.map(item => (
            <NavItem
              key={item.path} item={item}
              active={loc.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}

          {extra.length > 0 && (
            <>
              <div style={{
                padding: '.6rem 1.25rem .2rem',
                fontSize: '.6rem', textTransform: 'uppercase',
                letterSpacing: '.1em', color: 'var(--text3)', fontWeight: 600,
              }}>
                Mi espacio
              </div>
              {extra.map(item => (
                <NavItem
                  key={item.path} item={item}
                  active={loc.pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </>
          )}
        </nav>

        {/* ── Logout ── */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 9,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text3)', fontSize: '.78rem', fontFamily: "'Figtree','DM Sans',sans-serif",
              cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: '.8rem' }}>←</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ══════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '.75rem 1.75rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg2)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '1rem', color: 'var(--text)', flexShrink: 0, minWidth: 160 }}>
            {title}
          </div>
          <GlobalSearch />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            {actions}
            <NotificationBell />
          </div>
        </div>

        {/* Contenido */}
        <div style={{ padding: '1.75rem', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

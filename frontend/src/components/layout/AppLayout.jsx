import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Search, Home, Calendar, Briefcase, Users, Bell, User, ThumbsUp, MessageCircle, FileText, ClipboardList, CheckSquare, LayoutDashboard, Menu, X } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { companyService, notificationService, followService, workerService } from '../../services/index'
import RedTEPLogo from '../brand/RedTEPLogo'
import ChatWidget from '../chat/ChatWidget'

// ─── useMobile ────────────────────────────────────────────────────────────────
function useMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return mobile
}

// ─── Buscador global ──────────────────────────────────────────────────────────
function GlobalSearch({ onSelect }) {
  const navigate   = useNavigate()
  const [q,        setQ]        = useState('')
  const [results,  setResults]  = useState({ workers: [], companies: [] })
  const [open,     setOpen]     = useState(false)
  const ref        = useRef()
  const timerRef   = useRef()

  const doSearch = async (val) => {
    if (!val.trim()) { setResults({ workers: [], companies: [] }); setOpen(false); return }
    const [w, c] = await Promise.allSettled([
      workerService.search({ nombre: val, all: 'true' }),
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

  const go = (path) => { navigate(path); setOpen(false); setQ(''); onSelect?.() }

  const ini = (nombre) => (nombre || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.6)', pointerEvents:'none', display:'flex', alignItems:'center' }}><Search size={14}/></span>
        <input
          value={q}
          onChange={handleChange}
          onFocus={() => q && setOpen(true)}
          placeholder="Buscar personas, empresas..."
          style={{
            width:'100%', padding:'7px 12px 7px 32px', boxSizing:'border-box',
            background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.22)',
            borderRadius:10, color:'#FFFFFF',
            fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.82rem', outline:'none',
          }}
        />
      </div>

      {open && (
        <div style={{
          position:'absolute', top:'110%', left:0, right:0,
          background:'var(--bg2)', border:'1px solid var(--border)',
          borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', zIndex:300, overflow:'hidden',
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
                  <div style={{ width:28, height:28, borderRadius:6, background:'#3B6EDC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.62rem', fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden', position:'relative' }}>
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

const STUDENT_MENU = [
  { icon: Briefcase,   label: 'Oportunidades', path: '/ofertas' },
  { icon: FileText,    label: 'Mi CV',          path: '/mi-cv' },
]

const MENU_BY_ROLE = {
  STUDENT:      STUDENT_MENU,
  STUDENT_TP:   STUDENT_MENU,
  STUDENT_EPJA: STUDENT_MENU,
  COMPANY:      [
    { icon: Users,         label: 'Candidatos',  path: '/candidatos' },
    { icon: ClipboardList, label: 'Mis Ofertas', path: '/mis-ofertas' },
  ],
  TEACHER:      [
    { icon: CheckSquare,    label: 'Validaciones',  path: '/admin/validaciones' },
  ],
  ADMIN:        [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/admin' },
    { icon: CheckSquare,     label: 'Validaciones', path: '/admin/validaciones' },
  ],
}

const ADMIN_ROLES = ['ADMIN', 'TEACHER']

function getMenus(role) {
  return { common: MENU_COMMON, extra: MENU_BY_ROLE[role] || [] }
}

function initials(nombre) {
  return (nombre || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '??'
}

function avatarColor(role) {
  if (ADMIN_ROLES.includes(role)) return 'var(--amber)'
  if (role === 'COMPANY') return '#3B6EDC'
  return 'var(--green)'
}

function roleLabel(role) {
  const map = {
    STUDENT: 'Estudiante', STUDENT_TP: 'Estudiante', STUDENT_EPJA: 'Estudiante',
    COMPANY: 'Empresa', TEACHER: 'Docente', ADMIN: 'Administrador',
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
        color: active ? '#FFFFFF' : 'var(--text2)',
        background: active ? '#2F4FA3' : 'transparent',
        cursor: 'pointer', transition: 'all .15s',
        borderLeft: 'none',
        boxShadow: active ? '0 2px 8px rgba(47,79,163,0.20)' : 'none',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(59,110,220,0.08)'; e.currentTarget.style.color = '#3B6EDC' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' } }}
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
      .then(r => { setNotifications(r.data.notifications || []); setUnread(r.data.unreadCount || 0) })
      .catch(() => {})
  }

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id) }, [])

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
          position: 'relative', background: open ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8,
          padding: '6px 10px', cursor: 'pointer', color: '#FFFFFF',
          fontSize: '.85rem', transition: 'all .15s',
        }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: 'var(--accent)', color: '#fff',
            borderRadius: '50%', width: 16, height: 16, fontSize: '.58rem', fontWeight: 700,
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
          boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 200,
        }}>
          <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid var(--border)', fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.82rem', color: 'var(--text)' }}>
            Notificaciones
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.8rem' }}>Sin notificaciones</div>
          ) : notifications.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '.75rem 1rem', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'var(--green-glo)' }}>
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

// ─── Sidebar content ──────────────────────────────────────────────────────────
function SidebarContent({ onNavClick }) {
  const navigate    = useNavigate()
  const loc         = useLocation()
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
    if (['STUDENT', 'STUDENT_TP', 'STUDENT_EPJA'].includes(user?.role)) {
      workerService.getMe()
        .then(r => { if (r.data.fotoUrl) setPhotoUrl(r.data.fotoUrl) })
        .catch(() => {})
    }
    followService.getMyStats().then(r => setFollowStats(r.data)).catch(() => {})
  }, [user?.role])

  const handleLogout  = () => { logout(); toast.success('Sesión cerrada'); navigate('/') }
  const avColor       = avatarColor(user?.role)
  const profilePath   = user?.role === 'ADMIN' ? '/admin' : user?.role === 'TEACHER' ? '/admin/validaciones' : '/perfil'
  const isOnProfile   = loc.pathname === profilePath

  const go = (path) => { navigate(path); onNavClick?.() }

  return (
    <>
      {/* ── Logo ── */}
      <div style={{ padding: '1.1rem 1.25rem .9rem', borderBottom: '1px solid rgba(255,255,255,0.12)', background: '#2F4FA3' }}>
        <RedTEPLogo size={34} mode="inline" />
      </div>

      {/* ── Tarjeta de perfil ── */}
      <div
        onClick={() => go(profilePath)}
        style={{
          padding: '1.5rem 1.25rem 1.25rem', cursor: 'pointer',
          background: isOnProfile ? 'linear-gradient(180deg, rgba(77,160,232,.1) 0%, transparent 100%)' : 'transparent',
          borderBottom: '1px solid var(--border)', transition: 'background .15s',
        }}
        onMouseEnter={e => { if (!isOnProfile) e.currentTarget.style.background = 'rgba(0,0,0,.03)' }}
        onMouseLeave={e => { e.currentTarget.style.background = isOnProfile ? 'linear-gradient(180deg, rgba(77,160,232,.1) 0%, transparent 100%)' : 'transparent' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: avColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: '1.35rem', color: '#fff',
            border: `3px solid ${isOnProfile ? 'var(--green-lit)' : 'var(--border)'}`,
            boxShadow: isOnProfile ? '0 0 0 4px rgba(37,99,235,.12)' : '0 2px 8px rgba(0,0,0,.08)',
            transition: 'all .2s', overflow: 'hidden',
          }}>
            {photoUrl
              ? <img src={photoUrl} alt={user?.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              : initials(user?.nombre)
            }
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.92rem', color: 'var(--text)', marginBottom: 3, lineHeight: 1.3 }}>
            {user?.nombre}
          </div>
          <div style={{ fontSize: '.72rem', color: isOnProfile ? 'var(--green-lit)' : 'var(--text3)', marginBottom: 6 }}>
            {roleLabel(user?.role)}
            {user?.role === 'COMPANY' && companyVerified && <span style={{ marginLeft: 5, color: 'var(--green-lit)' }}>✔</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginTop: 4 }}>
            <div style={{ flex: 1, padding: '.45rem .5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{followStats.followers}</div>
              <div style={{ fontSize: '.6rem', color: 'var(--text3)', marginTop: 1 }}>seguidores</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ flex: 1, padding: '.45rem .5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{followStats.following}</div>
              <div style={{ fontSize: '.6rem', color: 'var(--text3)', marginTop: 1 }}>siguiendo</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navegación ── */}
      <nav style={{ flex: 1, paddingTop: '.75rem' }}>
        <div style={{ padding: '.3rem 1.25rem .2rem', fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text3)', fontWeight: 600 }}>Principal</div>
        {common.map(item => (
          <NavItem key={item.path} item={item} active={loc.pathname === item.path} onClick={() => go(item.path)} />
        ))}
        {extra.length > 0 && (
          <>
            <div style={{ padding: '.6rem 1.25rem .2rem', fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text3)', fontWeight: 600 }}>Mi espacio</div>
            {extra.map(item => (
              <NavItem key={item.path} item={item} active={loc.pathname === item.path} onClick={() => go(item.path)} />
            ))}
          </>
        )}
      </nav>

      {/* ── Logout ── */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: '.78rem', fontFamily: "'Figtree','DM Sans',sans-serif", cursor: 'pointer', textAlign: 'left', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 8 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '.8rem' }}>←</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  )
}

// ─── AppLayout ────────────────────────────────────────────────────────────────
export default function AppLayout({ children, title, actions }) {
  const isMobile    = useMobile()
  const loc         = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer when resizing to desktop
  useEffect(() => { if (!isMobile) setDrawerOpen(false) }, [isMobile])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ═══ SIDEBAR — desktop ════════════════════════════════════════════════ */}
      {!isMobile && (
        <aside style={{
          width: 268, flexShrink: 0,
          background: 'var(--bg2)', borderRight: '1px solid var(--border)',
          boxShadow: '2px 0 8px rgba(47,62,110,0.06)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* ═══ DRAWER OVERLAY — mobile ══════════════════════════════════════════ */}
      {isMobile && drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', zIndex:150, backdropFilter:'blur(2px)' }}
          />
          {/* Drawer */}
          <aside style={{
            position:'fixed', top:0, left:0, bottom:0, width:280, zIndex:160,
            background:'var(--bg2)', borderRight:'1px solid var(--border)',
            display:'flex', flexDirection:'column', overflowY:'auto',
            animation:'slideIn .2s ease-out',
          }}>
            {/* Close button */}
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:8, padding:'4px 8px', cursor:'pointer', color:'#fff', zIndex:1 }}
            >
              <X size={16}/>
            </button>
            <SidebarContent onNavClick={() => setDrawerOpen(false)} />
          </aside>
        </>
      )}

      {/* ═══ MAIN ════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: isMobile ? '.6rem 1rem' : '.85rem 1.75rem',
          borderBottom: 'none',
          background: '#2F4FA3',
          position: 'sticky', top: 0, zIndex: 10,
          boxShadow: '0 2px 8px rgba(47,79,163,0.22)',
        }}>
          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 9px', cursor:'pointer', color:'#fff', flexShrink:0, display:'flex', alignItems:'center' }}
            >
              <Menu size={18}/>
            </button>
          )}

          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: isMobile ? '.88rem' : '1rem', color: '#FFFFFF', flexShrink: 0, ...(isMobile ? {} : { minWidth: 160 }) }}>
            {title}
          </div>

          {loc.pathname === '/feed' && (
            <div style={{ flex: 1, maxWidth: isMobile ? 200 : 340 }}>
              <GlobalSearch onSelect={() => {}} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
            {actions}
            <NotificationBell />
          </div>
        </div>

        {/* Contenido */}
        <div style={{ padding: isMobile ? '1rem' : '1.75rem', flex: 1 }}>
          {children}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <ChatWidget />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import AppLayout from '../../components/layout/AppLayout'
import { StatCard, BtnGreen, BtnOutline } from '../../components/ui'
import { adminService, eventoService, filterService } from '../../services'

// ─── Mini Calendario ──────────────────────────────────────────────────────────
function EventCalendar({ eventos }) {
  const today = new Date()
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(null)

  const prev = () => setCur(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })
  const next = () => setCur(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })

  const firstDay = new Date(cur.year, cur.month, 1).getDay() // 0=Sun
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1) // Monday start
  const daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate()

  const eventsByDay = {}
  eventos.forEach(e => {
    const d = new Date(e.fecha)
    if (d.getFullYear() === cur.year && d.getMonth() === cur.month) {
      const day = d.getDate()
      if (!eventsByDay[day]) eventsByDay[day] = []
      eventsByDay[day].push(e)
    }
  })

  const DAY_NAMES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedEvents = selected ? (eventsByDay[selected] || []) : []

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.85rem', color:'var(--text)' }}>
          Calendario de Eventos
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={prev} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:'.75rem' }}>‹</button>
          <span style={{ fontSize:'.8rem', color:'var(--text)', fontWeight:500, minWidth:120, textAlign:'center' }}>
            {MONTHS[cur.month]} {cur.year}
          </span>
          <button onClick={next} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:'.75rem' }}>›</button>
        </div>
      </div>

      {/* Day names */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'.6rem', color:'var(--text3)', fontWeight:600, padding:'4px 0', textTransform:'uppercase', letterSpacing:'.05em' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const isToday = day === today.getDate() && cur.month === today.getMonth() && cur.year === today.getFullYear()
          const hasEvents = !!eventsByDay[day]
          const isSel = selected === day
          return (
            <div
              key={day}
              onClick={() => setSelected(isSel ? null : day)}
              style={{
                textAlign:'center', padding:'6px 2px', borderRadius:7, cursor: hasEvents ? 'pointer' : 'default',
                background: isSel ? 'var(--green-mid)' : isToday ? 'var(--green-glo)' : hasEvents ? 'rgba(77,160,232,.08)' : 'transparent',
                border: isToday ? '1px solid var(--green-lit)' : isSel ? '1px solid var(--green-mid)' : '1px solid transparent',
                transition:'all .15s',
              }}
            >
              <div style={{ fontSize:'.78rem', fontWeight: isToday ? 700 : 400, color: isSel ? '#fff' : isToday ? 'var(--green-lit)' : 'var(--text)' }}>{day}</div>
              {hasEvents && (
                <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:2 }}>
                  {eventsByDay[day].slice(0,3).map((_, j) => (
                    <div key={j} style={{ width:4, height:4, borderRadius:'50%', background: isSel ? '#fff' : 'var(--green-lit)' }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected day events */}
      {selected && selectedEvents.length > 0 && (
        <div style={{ marginTop:'1rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
          <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:'.5rem' }}>
            Eventos del {selected} de {MONTHS[cur.month]}
          </div>
          {selectedEvents.map(e => (
            <div key={e.id} style={{ background:'var(--surface2)', borderRadius:8, padding:'.6rem .8rem', marginBottom:6 }}>
              <div style={{ fontSize:'.8rem', fontWeight:500, color:'var(--text)' }}>{e.titulo}</div>
              <div style={{ fontSize:'.7rem', color:'var(--text2)', marginTop:2 }}>
                {new Date(e.fecha).toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' })} · {e.lugar}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const ROLE_LABELS = {
  STUDENT_TP:   'Estudiante',
  STUDENT_EPJA: 'Estudiante',
  COMPANY:      'Empresa',
  ADMIN:        'Admin',
}
const ROLE_OPTIONS = [
  { value: 'STUDENT_TP',   label: 'Estudiante' },
  { value: 'COMPANY',      label: 'Empresa' },
  { value: 'ADMIN',        label: 'Admin' },
]

function UserManager({ users, onAssignRole }) {
  const [q, setQ] = useState('')
  const filtered  = users.filter(u =>
    !q.trim() ||
    u.nombre.toLowerCase().includes(q.toLowerCase()) ||
    u.email.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem', marginTop:'1rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', gap:12 }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.85rem', color:'var(--text)', flexShrink:0 }}>
          Usuarios y roles
        </div>
        <div style={{ position:'relative', flex:1, maxWidth:280 }}>
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', fontSize:'.8rem', color:'var(--text3)', pointerEvents:'none' }}>🔍</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            style={{ width:'100%', boxSizing:'border-box', padding:'6px 10px 6px 28px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'Figtree',sans-serif", fontSize:'.78rem', outline:'none' }}
          />
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {filtered.length === 0 && (
          <div style={{ fontSize:'.82rem', color:'var(--text3)', padding:'.5rem 0' }}>
            {users.length === 0 ? 'Sin usuarios. Reinicia el backend.' : 'Sin resultados para esa búsqueda.'}
          </div>
        )}
        {filtered.map(u => (
          <div key={u.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', borderRadius:8, padding:'.6rem .9rem' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.nombre}</div>
              <div style={{ fontSize:'.7rem', color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <span style={{ fontSize:'.68rem', padding:'2px 8px', borderRadius:10, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)' }}>
                {ROLE_LABELS[u.role] || u.role}
              </span>
              <select
                value={u.role}
                onChange={e => onAssignRole(u.id, e.target.value)}
                style={{ padding:'4px 8px', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree',sans-serif", fontSize:'.75rem', cursor:'pointer', outline:'none' }}
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [metrics,   setMetrics]   = useState(null)
  const [eventos,   setEventos]   = useState([])
  const [companies, setCompanies] = useState([])
  const [filters,   setFilters]   = useState([])
  const [newFilter, setNewFilter] = useState('')
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.allSettled([
      adminService.getMetrics(),
      eventoService.getAll(),
      adminService.getAllCompanies(),
      filterService.getAll('especialidad'),
      adminService.getAllUsers(),
    ]).then(([m, e, c, f, u]) => {
      if (m.status === 'fulfilled') setMetrics(m.value.data)
      if (e.status === 'fulfilled') setEventos(e.value.data)
      if (c.status === 'fulfilled') setCompanies(c.value.data.filter(co => co.verificationRequested && !co.verified))
      if (f.status === 'fulfilled') setFilters(f.value.data)
      if (u.status === 'fulfilled') setUsers(u.value.data)
      else toast.error('Reinicia el backend para ver todos los módulos')
    }).finally(() => setLoading(false))
  }, [])

  const handleVerify = async (id) => {
    try {
      await adminService.verifyCompany(id)
      toast.success('Empresa verificada ✔')
      setCompanies(prev => prev.filter(c => c.id !== id))
    } catch { toast.error('Error al verificar empresa') }
  }

  const handleAddFilter = async () => {
    const val = newFilter.trim()
    if (!val) return
    try {
      const res = await filterService.create({ tipo: 'especialidad', valor: val })
      setFilters(prev => [...prev, res.data])
      setNewFilter('')
      toast.success(`Especialidad "${val}" creada`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear filtro')
    }
  }

  const handleRemoveFilter = async (id, valor) => {
    try {
      await filterService.remove(id)
      setFilters(prev => prev.filter(f => f.id !== id))
      toast.success(`Especialidad "${valor}" eliminada`)
    } catch { toast.error('Error al eliminar filtro') }
  }

  const handleAssignRole = async (userId, role) => {
    try {
      await adminService.assignRole(userId, role)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('Rol actualizado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar rol')
    }
  }

  if (loading) return <AppLayout title="Administración"><div style={{ color:'var(--text2)', padding:'2rem' }}>Cargando...</div></AppLayout>

  const bars = [
    { mes:'Sem 1', tp:35, epja:22 },
    { mes:'Sem 2', tp:50, epja:35 },
    { mes:'Sem 3', tp:44, epja:30 },
    { mes:'Sem 4', tp:65, epja:48 },
    { mes:'Sem 5', tp:metrics?.trabajadores?.tp||70, epja:metrics?.trabajadores?.epja||55 },
  ]

  return (
    <AppLayout title="Panel de Administración"
      actions={<BtnGreen onClick={() => window.location.href='/eventos'}>+ Crear evento</BtnGreen>}
    >
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.25rem' }}>
        <StatCard num={metrics?.trabajadores?.total||0} label="Estudiantes activos"/>
        <StatCard num={metrics?.empresas?.aprobadas||0} label="Empresas" color="var(--amber-lit)"/>
        <StatCard num={metrics?.ofertas||0} label="Ofertas activas"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        {/* Gráfico barras */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.85rem', color:'var(--text)' }}>Actividad de la Plataforma</div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:90 }}>
            {bars.map(b => (
              <div key={b.mes} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1 }}>
                <div style={{ display:'flex', gap:3, alignItems:'flex-end' }}>
                  <div style={{ width:20, borderRadius:'2px 2px 0 0', background:'var(--green-mid)', height:`${b.tp}px` }}/>
                </div>
                <div style={{ fontSize:'.6rem', color:'var(--text3)' }}>{b.mes}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por especialidad */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.85rem', color:'var(--text)', marginBottom:'1rem' }}>Distribución por Especialidad</div>
          <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="32" fill="none" stroke="var(--surface2)" strokeWidth="16"/>
              <circle cx="45" cy="45" r="32" fill="none" stroke="#40916c" strokeWidth="16" strokeDasharray="50 150" strokeDashoffset="0"/>
              <circle cx="45" cy="45" r="32" fill="none" stroke="#52b788" strokeWidth="16" strokeDasharray="40 150" strokeDashoffset="-50"/>
              <circle cx="45" cy="45" r="32" fill="none" stroke="#d4a017" strokeWidth="16" strokeDasharray="35 150" strokeDashoffset="-90"/>
              <circle cx="45" cy="45" r="32" fill="none" stroke="#2d6a4f" strokeWidth="16" strokeDasharray="25 150" strokeDashoffset="-125"/>
            </svg>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {(metrics?.porEspecialidad?.slice(0,4)||[{especialidad:'Electricidad',total:33},{especialidad:'Telecomunicaciones',total:27},{especialidad:'Gastronomía',total:23},{especialidad:'Otros',total:17}]).map((e,i) => (
                <div key={e.especialidad} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.72rem', color:'var(--text2)' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:['#40916c','#52b788','#d4a017','#2d6a4f'][i], flexShrink:0 }}/>
                  {e.especialidad} {e.total}%
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gestión de filtros */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.85rem', color:'var(--text)', marginBottom:'1rem' }}>
          Especialidades (filtros de búsqueda)
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:'1rem' }}>
          <input
            value={newFilter}
            onChange={e => setNewFilter(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddFilter()}
            placeholder="Nueva especialidad..."
            style={{ flex:1, padding:'7px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', outline:'none' }}
          />
          <button
            onClick={handleAddFilter}
            style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'var(--green-mid)', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', fontWeight:500, cursor:'pointer' }}
          >
            + Agregar
          </button>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {filters.map(f => (
            <div key={f.id} style={{ display:'flex', alignItems:'center', gap:5, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, padding:'4px 10px' }}>
              <span style={{ fontSize:'.78rem', color:'var(--text2)' }}>{f.valor}</span>
              <button
                onClick={() => handleRemoveFilter(f.id, f.valor)}
                style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:'.75rem', lineHeight:1, padding:0, display:'flex', alignItems:'center' }}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
          {filters.length === 0 && <span style={{ fontSize:'.8rem', color:'var(--text3)' }}>Sin especialidades registradas.</span>}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        {/* Solicitudes de verificación */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.85rem', color:'var(--text)', marginBottom:'1rem', display:'flex', alignItems:'center', gap:8 }}>
            Solicitudes de Verificación
            {companies.length > 0 && (
              <span style={{ background:'var(--green-glo)', color:'var(--green-lit)', fontSize:'.65rem', padding:'2px 7px', borderRadius:8 }}>{companies.length}</span>
            )}
          </div>
          {companies.length === 0 ? (
            <div style={{ fontSize:'.82rem', color:'var(--text3)', padding:'.5rem 0' }}>Sin solicitudes pendientes.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {companies.map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', borderRadius:8, padding:'.65rem .9rem' }}>
                  <div>
                    <div style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text)' }}>{c.nombreEmpresa}</div>
                    <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>{c.rubro || 'Sin rubro'} · {c.user?.email}</div>
                  </div>
                  <button
                    onClick={() => handleVerify(c.id)}
                    style={{ padding:'4px 12px', borderRadius:7, border:'1px solid rgba(77,160,232,.3)', background:'var(--green-glo)', color:'var(--green-lit)', fontSize:'.72rem', fontWeight:500, cursor:'pointer' }}
                  >
                    ✔ Verificar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendario de eventos */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }}>
          <EventCalendar eventos={eventos} />
        </div>
      </div>

      {/* Gestión de roles de usuario */}
      <UserManager users={users} onAssignRole={handleAssignRole} />
    </AppLayout>
  )
}

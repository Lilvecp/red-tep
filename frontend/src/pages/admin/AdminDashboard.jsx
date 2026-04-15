import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Bell, School, Award, Users, Upload, ChevronDown, ChevronUp,
  CheckCircle, XCircle, FileSpreadsheet, LayoutDashboard,
  Eye, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, TrendingUp,
} from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { StatCard, BtnGreen } from '../../components/ui'
import { adminService, eventoService, filterService, progresoService } from '../../services'

// ─── Mini Calendario ──────────────────────────────────────────────────────────
function EventCalendar({ eventos }) {
  const today = new Date()
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(null)

  const prev = () => setCur(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })
  const next = () => setCur(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })

  const firstDay    = new Date(cur.year, cur.month, 1).getDay()
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1)
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
  const MONTHS    = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const cells     = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedEvents = selected ? (eventsByDay[selected] || []) : []

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.85rem', color:'var(--text)' }}>Calendario</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={prev} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:'.75rem' }}>‹</button>
          <span style={{ fontSize:'.8rem', color:'var(--text)', fontWeight:500, minWidth:120, textAlign:'center' }}>{MONTHS[cur.month]} {cur.year}</span>
          <button onClick={next} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:'.75rem' }}>›</button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'.6rem', color:'var(--text3)', fontWeight:600, padding:'4px 0', textTransform:'uppercase', letterSpacing:'.05em' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const isToday   = day === today.getDate() && cur.month === today.getMonth() && cur.year === today.getFullYear()
          const hasEvents = !!eventsByDay[day]
          const isSel     = selected === day
          return (
            <div key={day} onClick={() => setSelected(isSel ? null : day)}
              style={{ textAlign:'center', padding:'6px 2px', borderRadius:7, cursor: hasEvents ? 'pointer' : 'default',
                background: isSel ? 'var(--green-mid)' : isToday ? 'var(--green-glo)' : hasEvents ? 'rgba(77,160,232,.08)' : 'transparent',
                border: isToday ? '1px solid var(--green-lit)' : isSel ? '1px solid var(--green-mid)' : '1px solid transparent',
              }}
            >
              <div style={{ fontSize:'.78rem', fontWeight: isToday ? 700 : 400, color: isSel ? '#fff' : isToday ? 'var(--green-lit)' : 'var(--text)' }}>{day}</div>
              {hasEvents && <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:2 }}>{eventsByDay[day].slice(0,3).map((_,j) => <div key={j} style={{ width:4, height:4, borderRadius:'50%', background: isSel ? '#fff' : 'var(--green-lit)' }}/>)}</div>}
            </div>
          )
        })}
      </div>
      {selected && selectedEvents.length > 0 && (
        <div style={{ marginTop:'1rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
          <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:'.5rem' }}>Eventos del {selected} de {MONTHS[cur.month]}</div>
          {selectedEvents.map(e => (
            <div key={e.id} style={{ background:'var(--surface2)', borderRadius:8, padding:'.6rem .8rem', marginBottom:6 }}>
              <div style={{ fontSize:'.8rem', fontWeight:500, color:'var(--text)' }}>{e.titulo}</div>
              <div style={{ fontSize:'.7rem', color:'var(--text2)', marginTop:2 }}>{new Date(e.fecha).toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' })} · {e.lugar}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Panel Liceo Requests ─────────────────────────────────────────────────────
function LiceoPanel({ requests, onApprove, onReject }) {
  const nav = useNavigate()
  if (requests.length === 0)
    return <div style={{ fontSize:'.82rem', color:'var(--text3)', padding:'.5rem 0' }}>Sin solicitudes pendientes.</div>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {requests.map(w => (
        <div key={w.id} className="panel-item">
          <div className="panel-item-info">
            <div style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text)' }}>{w.user?.nombre}</div>
            <div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:2 }}>{w.user?.email} · {w.especialidad || 'Sin especialidad'}</div>
          </div>
          <div className="panel-item-actions">
            <button
              onClick={() => nav(`/trabajadores/${w.id}`)}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1px solid var(--border2)', background:'var(--surface)', color:'var(--text2)', fontSize:'.75rem', cursor:'pointer' }}
              title="Ver perfil del estudiante"
            >
              <Eye size={13} /> Ver perfil
            </button>
            <button
              onClick={() => onApprove(w)}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:7, border:'1px solid rgba(77,160,232,.35)', background:'var(--green-glo)', color:'var(--green-lit)', fontSize:'.75rem', fontWeight:500, cursor:'pointer' }}
            >
              <CheckCircle size={13} /> Aprobar
            </button>
            <button
              onClick={() => onReject(w)}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:7, border:'1px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.08)', color:'#ef4444', fontSize:'.75rem', fontWeight:500, cursor:'pointer' }}
            >
              <XCircle size={13} /> Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Panel Badge Requests ─────────────────────────────────────────────────────
const INSIGNIA_LABEL = {
  PERFIL_COMPLETO:       'Perfil técnico completo',
  VALIDADO_POR_PROFESOR: 'Validado por docente',
  EXPERIENCIA_PRACTICA:  'Experiencia práctica',
  PRIMERA_POSTULACION:   'Primera postulación',
  TOP_CANDIDATO:         'Top candidato',
}

function BadgePanel({ requests, onApprove, onReject }) {
  const nav = useNavigate()
  if (requests.length === 0)
    return <div style={{ fontSize:'.82rem', color:'var(--text3)', padding:'.5rem 0' }}>Sin insignias pendientes.</div>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {requests.map(b => (
        <div key={b.id} className="panel-item">
          <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,rgba(240,188,56,.2),rgba(240,188,56,.05))', border:'1px solid rgba(240,188,56,.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Award size={18} color="#f0bc38" />
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {INSIGNIA_LABEL[b.tipo] || b.tipo}
              </div>
              <div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:1 }}>{b.worker?.user?.nombre || 'Desconocido'}</div>
            </div>
          </div>
          <div className="panel-item-actions">
            <button
              onClick={() => nav(`/trabajadores/${b.worker?.id}`)}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1px solid var(--border2)', background:'var(--surface)', color:'var(--text2)', fontSize:'.75rem', cursor:'pointer' }}
              title="Ver perfil del estudiante"
            >
              <Eye size={13} /> Ver perfil
            </button>
            <button
              onClick={() => onApprove(b)}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:7, border:'1px solid rgba(77,160,232,.35)', background:'var(--green-glo)', color:'var(--green-lit)', fontSize:'.75rem', fontWeight:500, cursor:'pointer' }}
            >
              <CheckCircle size={13} /> Aprobar
            </button>
            <button
              onClick={() => onReject(b)}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:7, border:'1px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.08)', color:'#ef4444', fontSize:'.75rem', fontWeight:500, cursor:'pointer' }}
            >
              <XCircle size={13} /> Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Bulk Import Panel ────────────────────────────────────────────────────────
function BulkImportPanel() {
  const fileRef = useRef()
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setLoading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await adminService.bulkImport(fd)
      setResult(res.data)
      toast.success(res.data.message)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al importar')
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <div style={{ fontSize:'.82rem', color:'var(--text2)', marginBottom:'.75rem', lineHeight:1.6 }}>
        Sube un archivo <strong style={{ color:'var(--text)' }}>.csv</strong> o <strong style={{ color:'var(--text)' }}>.xlsx</strong> con columnas:
        <code style={{ display:'block', background:'var(--surface2)', borderRadius:6, padding:'.4rem .7rem', marginTop:'.4rem', fontSize:'.75rem', color:'var(--text3)' }}>
          nombre, email, tipo (estudiante/profesor/empresa), especialidad
        </code>
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'9px 18px', borderRadius:9, border:'1px solid var(--border2)',
            background:'var(--surface2)', color:'var(--text2)',
            fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', cursor:'pointer',
            opacity: loading ? .6 : 1,
          }}
        >
          <FileSpreadsheet size={15} />
          {loading ? 'Procesando...' : 'Seleccionar archivo'}
        </button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display:'none' }} />
        {fileName && !loading && (
          <span style={{ fontSize:'.75rem', color:'var(--text3)' }}>{fileName}</span>
        )}
      </div>

      {result && (
        <div style={{
          marginTop:'1rem', background:'var(--surface2)', borderRadius:10, padding:'.85rem 1rem',
          border:`1px solid ${result.errors?.length ? 'rgba(239,68,68,.2)' : 'rgba(77,160,232,.2)'}`,
        }}>
          <div style={{ fontWeight:600, fontSize:'.82rem', color:'var(--text)', marginBottom:'.4rem' }}>{result.message}</div>
          <div style={{ display:'flex', gap:'1.5rem', fontSize:'.78rem', color:'var(--text2)' }}>
            <span>Creados: <strong style={{ color:'var(--green-lit)' }}>{result.created}</strong></span>
            <span>Omitidos: <strong>{result.skipped}</strong></span>
          </div>
          {result.errors?.length > 0 && (
            <div style={{ marginTop:'.5rem', fontSize:'.72rem', color:'#ef4444' }}>
              Errores: {result.errors.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, count, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:'1rem' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'1rem 1.25rem', background:'none', border:'none', cursor:'pointer',
          fontFamily:"'Sora',sans-serif",
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Icon size={16} color="var(--text2)" />
          <span style={{ fontWeight:600, fontSize:'.87rem', color:'var(--text)' }}>{title}</span>
          {count > 0 && (
            <span style={{ background: badge || 'var(--green-glo)', color: badge ? '#fff' : 'var(--green-lit)', fontSize:'.65rem', fontWeight:700, padding:'2px 8px', borderRadius:8 }}>
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} color="var(--text3)" /> : <ChevronDown size={14} color="var(--text3)" />}
      </button>
      {open && (
        <div style={{ padding:'0 1.25rem 1.25rem' }}>
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── User Manager ─────────────────────────────────────────────────────────────
const ROLE_LABELS = { STUDENT:'Estudiante', STUDENT_TP:'Estudiante TP', STUDENT_EPJA:'Estudiante EPJA', COMPANY:'Empresa', ADMIN:'Admin', TEACHER:'Docente' }
const ROLE_OPTIONS = [
  { value:'STUDENT',      label:'Estudiante' },
  { value:'STUDENT_TP',   label:'Estudiante TP (legacy)' },
  { value:'STUDENT_EPJA', label:'Estudiante EPJA (legacy)' },
  { value:'COMPANY',      label:'Empresa' },
  { value:'TEACHER',      label:'Docente' },
  { value:'ADMIN',        label:'Admin' },
]

function UserManager({ users, onAssignRole }) {
  const [q, setQ] = useState('')
  const filtered  = users.filter(u =>
    !q.trim() ||
    u.nombre.toLowerCase().includes(q.toLowerCase()) ||
    u.email.toLowerCase().includes(q.toLowerCase())
  )
  return (
    <div>
      <div style={{ position:'relative', marginBottom:'1rem' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px 8px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'Figtree',sans-serif", fontSize:'.78rem', outline:'none' }}
        />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {filtered.length === 0 && <div style={{ fontSize:'.82rem', color:'var(--text3)' }}>{users.length === 0 ? 'Sin usuarios.' : 'Sin resultados.'}</div>}
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
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Admin Notifications Panel ────────────────────────────────────────────────
function AdminNotifPanel({ notifications, onReadAll }) {
  const TIPO_COLOR = { LICEO_VALIDATION: '#4da0e8', BADGE_REQUEST: '#f0bc38' }
  const TIPO_ICON  = { LICEO_VALIDATION: School, BADGE_REQUEST: Award }

  return (
    <div>
      {notifications.length === 0 ? (
        <div style={{ fontSize:'.82rem', color:'var(--text3)' }}>Sin notificaciones.</div>
      ) : (
        <>
          <button
            onClick={onReadAll}
            style={{ marginBottom:'.75rem', padding:'5px 12px', background:'none', border:'1px solid var(--border)', borderRadius:7, color:'var(--text2)', fontSize:'.75rem', cursor:'pointer' }}
          >
            Marcar todas como leídas
          </button>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {notifications.slice(0, 15).map(n => {
              const Icon  = TIPO_ICON[n.tipo]  || Bell
              const color = TIPO_COLOR[n.tipo] || 'var(--text3)'
              return (
                <div key={n.id} style={{
                  display:'flex', gap:10, alignItems:'flex-start',
                  background: n.leida ? 'transparent' : 'rgba(77,160,232,.05)',
                  border:`1px solid ${n.leida ? 'var(--border)' : 'rgba(77,160,232,.15)'}`,
                  borderRadius:8, padding:'.65rem .9rem',
                }}>
                  <Icon size={14} color={color} style={{ flexShrink:0, marginTop:2 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'.8rem', color:'var(--text)', lineHeight:1.4 }}>{n.mensaje}</div>
                    <div style={{ fontSize:'.65rem', color:'var(--text3)', marginTop:2 }}>
                      {new Date(n.createdAt).toLocaleDateString('es-CL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                  {!n.leida && <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0, marginTop:4 }} />}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Confirm Modal with Feedback ─────────────────────────────────────────────
function ConfirmModal({ modal, onClose }) {
  const [feedback, setFeedback] = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => { if (!modal) setFeedback('') }, [modal])

  if (!modal) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await modal.action(feedback.trim() || undefined)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', backdropFilter:'blur(3px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
    >
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1.5rem', width:'100%', maxWidth:400 }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.95rem', color:'var(--text)', marginBottom:'.3rem' }}>
          {modal.label}
        </div>
        <div style={{ fontSize:'.8rem', color:'var(--text2)', marginBottom:'1.1rem' }}>
          {modal.targetName}
        </div>
        <div style={{ marginBottom:'1.1rem' }}>
          <label style={{ display:'block', fontSize:'.73rem', fontWeight:500, color:'var(--text2)', marginBottom:4 }}>
            Retroalimentación <span style={{ color:'var(--text3)', fontWeight:400 }}>(opcional)</span>
          </label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Escribe un comentario para el estudiante o empresa..."
            style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', outline:'none', resize:'vertical', minHeight:80, boxSizing:'border-box' }}
          />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding:'8px 16px', borderRadius:8, border:'1px solid var(--border2)', background:'none', color:'var(--text2)', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', cursor:'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{ padding:'8px 18px', borderRadius:8, border:'none', background: modal.danger ? '#ef4444' : 'var(--green-mid)', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', fontWeight:600, cursor: loading ? 'default' : 'pointer', opacity: loading ? .7 : 1 }}
          >
            {loading ? 'Procesando...' : modal.actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Progreso Formativo Manager ───────────────────────────────────────────────
function ProgresoPanel({ sections, onCreate, onUpdate, onDelete }) {
  const [newNombre, setNewNombre]   = useState('')
  const [newDesc,   setNewDesc]     = useState('')
  const [editId,    setEditId]      = useState(null)
  const [editData,  setEditData]    = useState({})
  const [saving,    setSaving]      = useState(false)

  const handleCreate = async () => {
    const nombre = newNombre.trim()
    if (!nombre) return
    setSaving(true)
    try {
      await onCreate({ nombre, descripcion: newDesc.trim() || undefined, orden: sections.length })
      setNewNombre('')
      setNewDesc('')
    } finally { setSaving(false) }
  }

  const handleSaveEdit = async () => {
    if (!editId) return
    setSaving(true)
    try {
      await onUpdate(editId, editData)
      setEditId(null)
      setEditData({})
    } finally { setSaving(false) }
  }

  const inpS = { padding:'7px 10px', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree',sans-serif", fontSize:'.8rem', outline:'none', boxSizing:'border-box' }

  return (
    <div>
      {/* Create form */}
      <div style={{ background:'var(--surface2)', borderRadius:10, padding:'1rem', marginBottom:'1rem', border:'1px solid var(--border)' }}>
        <div style={{ fontSize:'.75rem', fontWeight:600, color:'var(--text2)', marginBottom:'.65rem', textTransform:'uppercase', letterSpacing:'.05em' }}>Nueva sección</div>
        <div className="progreso-form-grid">
          <div>
            <label style={{ fontSize:'.7rem', color:'var(--text3)', display:'block', marginBottom:3 }}>Nombre *</label>
            <input
              style={{ ...inpS, width:'100%' }}
              placeholder="Ej: Portafolio digital"
              value={newNombre}
              onChange={e => setNewNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div>
            <label style={{ fontSize:'.7rem', color:'var(--text3)', display:'block', marginBottom:3 }}>Descripción</label>
            <input
              style={{ ...inpS, width:'100%' }}
              placeholder="Descripción breve (opcional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!newNombre.trim() || saving}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:7, border:'none', background:'var(--green-mid)', color:'#fff', fontSize:'.8rem', fontWeight:600, cursor:'pointer', opacity: (!newNombre.trim() || saving) ? .6 : 1 }}
          >
            <Plus size={14} /> Crear
          </button>
        </div>
      </div>

      {/* Section list */}
      {sections.length === 0 ? (
        <div style={{ fontSize:'.82rem', color:'var(--text3)' }}>Sin secciones de progreso. Crea la primera arriba.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {sections.map(s => (
            <div key={s.id} style={{
              background:'var(--surface2)', borderRadius:10, padding:'.75rem 1rem',
              border:`1px solid ${s.activo ? 'var(--border)' : 'rgba(239,68,68,.2)'}`,
              opacity: s.activo ? 1 : .65,
            }}>
              {editId === s.id ? (
                /* Edit mode */
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto auto', gap:8, alignItems:'flex-end' }}>
                  <input
                    style={{ ...inpS }}
                    value={editData.nombre ?? s.nombre}
                    onChange={e => setEditData(d => ({ ...d, nombre: e.target.value }))}
                    placeholder="Nombre"
                  />
                  <input
                    style={{ ...inpS }}
                    value={editData.descripcion ?? (s.descripcion || '')}
                    onChange={e => setEditData(d => ({ ...d, descripcion: e.target.value }))}
                    placeholder="Descripción"
                  />
                  <button onClick={handleSaveEdit} disabled={saving}
                    style={{ padding:'7px 12px', borderRadius:7, border:'none', background:'var(--green-mid)', color:'#fff', fontSize:'.78rem', fontWeight:600, cursor:'pointer' }}>
                    Guardar
                  </button>
                  <button onClick={() => { setEditId(null); setEditData({}) }}
                    style={{ padding:'7px 10px', borderRadius:7, border:'1px solid var(--border)', background:'none', color:'var(--text2)', fontSize:'.78rem', cursor:'pointer' }}>
                    <XCircle size={13} />
                  </button>
                </div>
              ) : (
                /* View mode */
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text)' }}>{s.nombre}</span>
                      <span style={{ fontSize:'.65rem', padding:'2px 7px', borderRadius:6, background: s.activo ? 'var(--green-glo)' : 'rgba(239,68,68,.1)', color: s.activo ? 'var(--green-lit)' : '#ef4444', fontWeight:600 }}>
                        {s.activo ? 'Activa' : 'Inactiva'}
                      </span>
                      {s._count && (
                        <span style={{ fontSize:'.65rem', color:'var(--text3)' }}>{s._count.progresosUsuario} usuarios con progreso</span>
                      )}
                    </div>
                    {s.descripcion && <div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:2 }}>{s.descripcion}</div>}
                  </div>
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    <button
                      onClick={() => { setEditId(s.id); setEditData({}) }}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)', background:'none', color:'var(--text2)', fontSize:'.75rem', cursor:'pointer' }}
                      title="Editar"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => onUpdate(s.id, { activo: !s.activo })}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)', background:'none', color: s.activo ? 'var(--text2)' : 'var(--green-lit)', fontSize:'.75rem', cursor:'pointer' }}
                      title={s.activo ? 'Desactivar' : 'Activar'}
                    >
                      {s.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button
                      onClick={() => onDelete(s.id, s.nombre)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.06)', color:'#ef4444', fontSize:'.75rem', cursor:'pointer' }}
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [metrics,      setMetrics]      = useState(null)
  const [eventos,      setEventos]      = useState([])
  const [companies,    setCompanies]    = useState([])
  const [filters,      setFilters]      = useState([])
  const [newFilter,    setNewFilter]    = useState('')
  const [users,        setUsers]        = useState([])
  const [liceoReqs,    setLiceoReqs]    = useState([])
  const [badgeReqs,    setBadgeReqs]    = useState([])
  const [adminNotifs,  setAdminNotifs]  = useState([])
  const [progreso,     setProgreso]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [confirmModal, setConfirmModal] = useState(null)

  const load = () => {
    Promise.allSettled([
      adminService.getMetrics(),
      eventoService.getAll(),
      adminService.getAllCompanies(),
      filterService.getAll('especialidad'),
      adminService.getAllUsers(),
      adminService.getLiceoRequests(),
      adminService.getBadgeRequests(),
      adminService.getAdminNotifications(),
      progresoService.adminGetAll(),
    ]).then(([m, e, c, f, u, lr, br, an, pg]) => {
      if (m.status  === 'fulfilled') setMetrics(m.value.data)
      if (e.status  === 'fulfilled') setEventos(e.value.data)
      if (c.status  === 'fulfilled') setCompanies(c.value.data.filter(co => co.verificationRequested && !co.verified))
      if (f.status  === 'fulfilled') setFilters(f.value.data)
      if (u.status  === 'fulfilled') setUsers(u.value.data)
      if (lr.status === 'fulfilled') setLiceoReqs(lr.value.data)
      if (br.status === 'fulfilled') setBadgeReqs(br.value.data)
      if (an.status === 'fulfilled') setAdminNotifs(an.value.data.notifications || [])
      if (pg.status === 'fulfilled') setProgreso(pg.value.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── Company verification ──
  const handleVerify = async (id) => {
    try {
      await adminService.verifyCompany(id)
      toast.success('Empresa verificada')
      setCompanies(prev => prev.filter(c => c.id !== id))
    } catch { toast.error('Error al verificar empresa') }
  }

  // ── Filters ──
  const handleAddFilter = async () => {
    const val = newFilter.trim()
    if (!val) return
    try {
      const res = await filterService.create({ tipo: 'especialidad', valor: val })
      setFilters(prev => [...prev, res.data])
      setNewFilter('')
      toast.success(`Especialidad "${val}" creada`)
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear filtro') }
  }

  const handleRemoveFilter = async (id, valor) => {
    try {
      await filterService.remove(id)
      setFilters(prev => prev.filter(f => f.id !== id))
      toast.success(`"${valor}" eliminada`)
    } catch { toast.error('Error al eliminar filtro') }
  }

  // ── Users ──
  const handleAssignRole = async (userId, role) => {
    try {
      await adminService.assignRole(userId, role)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('Rol actualizado')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al cambiar rol') }
  }

  // ── Admin notifs ──
  const handleReadAll = async () => {
    try {
      await adminService.readAllAdminNotifications()
      setAdminNotifs(prev => prev.map(n => ({ ...n, leida: true })))
    } catch {}
  }

  // ── Progreso Formativo ──
  const handleProgresoCreate = async (data) => {
    try {
      const res = await progresoService.adminCreate(data)
      setProgreso(prev => [...prev, res.data])
      toast.success(`Sección "${res.data.nombre}" creada`)
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear sección') }
  }

  const handleProgresoUpdate = async (id, data) => {
    try {
      const res = await progresoService.adminUpdate(id, data)
      setProgreso(prev => prev.map(s => s.id === id ? { ...s, ...res.data } : s))
      toast.success('Sección actualizada')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al actualizar') }
  }

  const handleProgresoDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar la sección "${nombre}"? Esto borrará el progreso de todos los usuarios en esta sección.`)) return
    try {
      await progresoService.adminDelete(id)
      setProgreso(prev => prev.filter(s => s.id !== id))
      toast.success(`Sección "${nombre}" eliminada`)
    } catch (err) { toast.error(err.response?.data?.error || 'Error al eliminar') }
  }

  if (loading) return <AppLayout title="Administración"><div style={{ color:'var(--text2)', padding:'2rem' }}>Cargando...</div></AppLayout>

  const unreadNotifs = adminNotifs.filter(n => !n.leida).length

  return (
    <AppLayout
      title="Panel de Administración"
      actions={<BtnGreen onClick={() => window.location.href='/eventos'}>+ Evento</BtnGreen>}
    >
      <ConfirmModal modal={confirmModal} onClose={() => setConfirmModal(null)} />
      {/* ── Stats row ── */}
      <div className="g-5" style={{ marginBottom:'1.25rem' }}>
        <StatCard num={metrics?.trabajadores?.total || 0}  label="Estudiantes"/>
        <StatCard num={metrics?.empresas?.aprobadas || 0} label="Empresas" color="var(--amber-lit)"/>
        <StatCard num={metrics?.ofertas || 0}              label="Ofertas"/>
        <StatCard num={metrics?.pendingLiceo || liceoReqs.length} label="Liceo pendientes" color="#4da0e8"/>
        <StatCard num={metrics?.pendingBadges || badgeReqs.length} label="Insignias pendientes" color="#f0bc38"/>
      </div>

      {/* ── Row: Liceo + Badges ── */}
      <div className="admin-g2">

        <Section title="Validaciones de Liceo" icon={School} count={liceoReqs.length} badge="rgba(77,160,232,.7)">
          <LiceoPanel
            requests={liceoReqs}
            onApprove={(w) => setConfirmModal({
              label:       'Aprobar solicitud de liceo',
              targetName:  w.user?.nombre,
              actionLabel: 'Aprobar',
              danger:      false,
              action: async (feedback) => {
                await adminService.approveLiceo(w.id, feedback)
                setLiceoReqs(r => r.filter(x => x.id !== w.id))
                setMetrics(m => m ? { ...m, pendingLiceo: Math.max((m.pendingLiceo || 1) - 1, 0) } : m)
                toast.success('Solicitud aprobada')
              },
            })}
            onReject={(w) => setConfirmModal({
              label:       'Rechazar solicitud de liceo',
              targetName:  w.user?.nombre,
              actionLabel: 'Rechazar',
              danger:      true,
              action: async (feedback) => {
                await adminService.rejectLiceo(w.id, feedback)
                setLiceoReqs(r => r.filter(x => x.id !== w.id))
                setMetrics(m => m ? { ...m, pendingLiceo: Math.max((m.pendingLiceo || 1) - 1, 0) } : m)
                toast.success('Solicitud rechazada')
              },
            })}
          />
        </Section>

        <Section title="Solicitudes de Insignias" icon={Award} count={badgeReqs.length} badge="rgba(240,188,56,.8)">
          <BadgePanel
            requests={badgeReqs}
            onApprove={(b) => setConfirmModal({
              label:       'Aprobar insignia',
              targetName:  `${INSIGNIA_LABEL[b.tipo] || b.tipo} — ${b.worker?.user?.nombre}`,
              actionLabel: 'Aprobar',
              danger:      false,
              action: async (feedback) => {
                await adminService.approveBadge(b.id, feedback)
                setBadgeReqs(r => r.filter(x => x.id !== b.id))
                setMetrics(m => m ? { ...m, pendingBadges: Math.max((m.pendingBadges || 1) - 1, 0) } : m)
                toast.success('Insignia aprobada')
              },
            })}
            onReject={(b) => setConfirmModal({
              label:       'Rechazar insignia',
              targetName:  `${INSIGNIA_LABEL[b.tipo] || b.tipo} — ${b.worker?.user?.nombre}`,
              actionLabel: 'Rechazar',
              danger:      true,
              action: async (feedback) => {
                await adminService.rejectBadge(b.id, feedback)
                setBadgeReqs(r => r.filter(x => x.id !== b.id))
                setMetrics(m => m ? { ...m, pendingBadges: Math.max((m.pendingBadges || 1) - 1, 0) } : m)
                toast.success('Insignia rechazada')
              },
            })}
          />
        </Section>
      </div>

      {/* ── Row: Admin Notifications + Calendario ── */}
      <div className="admin-g2">

        <Section title="Notificaciones del Sistema" icon={Bell} count={unreadNotifs} badge="rgba(190,24,93,.7)">
          <AdminNotifPanel notifications={adminNotifs} onReadAll={handleReadAll} />
        </Section>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }}>
          <EventCalendar eventos={eventos} />
        </div>
      </div>

      {/* ── Row: Verificación empresas + Filtros ── */}
      <div className="admin-g2">

        <Section title="Verificaciones de Empresa" icon={CheckCircle} count={companies.length}>
          {companies.length === 0 ? (
            <div style={{ fontSize:'.82rem', color:'var(--text3)' }}>Sin solicitudes pendientes.</div>
          ) : companies.map(c => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', borderRadius:8, padding:'.65rem .9rem', marginBottom:6 }}>
              <div>
                <div style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text)' }}>{c.nombreEmpresa}</div>
                <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>{c.rubro || 'Sin rubro'} · {c.user?.email}</div>
              </div>
              <button
                onClick={() => setConfirmModal({
                  label:       'Aprobar empresa',
                  targetName:  c.nombreEmpresa || c.user?.nombre,
                  actionLabel: 'Aprobar',
                  danger:      false,
                  action: async (feedback) => {
                    await adminService.approveCompany(c.id, feedback)
                    setCompanies(r => r.filter(x => x.id !== c.id))
                    setMetrics(m => m ? { ...m, empresas: { ...m.empresas, pendientes: Math.max((m.empresas?.pendientes || 1) - 1, 0) } } : m)
                    toast.success('Empresa aprobada')
                  },
                })}
                style={{ padding:'4px 12px', borderRadius:7, border:'1px solid rgba(77,160,232,.3)', background:'var(--green-glo)', color:'var(--green-lit)', fontSize:'.72rem', fontWeight:500, cursor:'pointer' }}
              >
                ✔ Verificar
              </button>
            </div>
          ))}
        </Section>

        <Section title="Especialidades / Filtros" icon={LayoutDashboard}>
          <div style={{ display:'flex', gap:8, marginBottom:'1rem' }}>
            <input
              value={newFilter}
              onChange={e => setNewFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddFilter()}
              placeholder="Nueva especialidad..."
              style={{ flex:1, padding:'7px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', outline:'none' }}
            />
            <button onClick={handleAddFilter} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'var(--green-mid)', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', fontWeight:500, cursor:'pointer' }}>
              + Agregar
            </button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {filters.map(f => (
              <div key={f.id} style={{ display:'flex', alignItems:'center', gap:5, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, padding:'4px 10px' }}>
                <span style={{ fontSize:'.78rem', color:'var(--text2)' }}>{f.valor}</span>
                <button onClick={() => handleRemoveFilter(f.id, f.valor)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:'.75rem', lineHeight:1, padding:0 }}>✕</button>
              </div>
            ))}
            {filters.length === 0 && <span style={{ fontSize:'.8rem', color:'var(--text3)' }}>Sin especialidades registradas.</span>}
          </div>
        </Section>
      </div>

      {/* ── Progreso Formativo ── */}
      <Section title="Gestión de Progreso Formativo" icon={TrendingUp} count={progreso.length} defaultOpen={false}>
        <div style={{ fontSize:'.78rem', color:'var(--text3)', marginBottom:'.85rem', lineHeight:1.6 }}>
          Estas secciones definen el progreso de <strong style={{ color:'var(--text)' }}>todos los estudiantes</strong>.
          Cada sección puede generar una insignia cuando el alumno llega al 100%.
        </div>
        <ProgresoPanel
          sections={progreso}
          onCreate={handleProgresoCreate}
          onUpdate={handleProgresoUpdate}
          onDelete={handleProgresoDelete}
        />
      </Section>

      {/* ── Carga masiva ── */}
      <Section title="Carga Masiva de Usuarios (Excel / CSV)" icon={Upload} defaultOpen={false}>
        <BulkImportPanel />
      </Section>

      {/* ── Gestión de roles ── */}
      <Section title="Usuarios y Roles" icon={Users} defaultOpen={false}>
        <UserManager users={users} onAssignRole={handleAssignRole} />
      </Section>
    </AppLayout>
  )
}

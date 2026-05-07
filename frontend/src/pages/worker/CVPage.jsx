import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Printer, ArrowLeft, Mail, Phone, MapPin, Clock,
  Award, BookOpen, Wrench, CheckCircle, Star,
  Pencil, Save, X, Plus, Trash2, Eye, EyeOff,
} from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { workerService } from '../../services'
import useAuthStore from '../../store/authStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DISPONIBILIDAD_LABEL = {
  TIEMPO_COMPLETO:  'Tiempo completo',
  MEDIO_TIEMPO:     'Medio tiempo',
  FINES_DE_SEMANA:  'Fines de semana',
  POR_DEFINIR:      'Por definir',
}

const NIVEL_BADGE = { BAJO: '#6b7280', MEDIO: '#2A3353', ALTO: '#15803d' }
const INSIGNIA_LABEL = {
  PERFIL_COMPLETO:       'Perfil completo',
  VALIDADO_POR_PROFESOR: 'Validado por docente',
  EXPERIENCIA_PRACTICA:  'Experiencia práctica',
  PRIMERA_POSTULACION:   'Primera postulación',
  TOP_CANDIDATO:         'Top candidato',
}

// ─── Sección visual del CV ────────────────────────────────────────────────────
function CVSection({ title, icon: Icon, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        borderBottom: '2px solid #2A3353', paddingBottom: '.4rem', marginBottom: '.9rem',
      }}>
        <Icon size={15} color="#2A3353" />
        <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.85rem', color: '#2A3353', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

const DISPONIBILIDAD_OPTIONS = [
  { value: '', label: 'Sin especificar' },
  { value: 'TIEMPO_COMPLETO', label: 'Tiempo completo' },
  { value: 'MEDIO_TIEMPO',    label: 'Medio tiempo' },
  { value: 'FINES_DE_SEMANA', label: 'Fines de semana' },
  { value: 'POR_DEFINIR',     label: 'Por definir' },
]

const inp = {
  width: '100%', padding: '8px 10px',
  background: 'var(--surface2)', border: '1px solid var(--border2)',
  borderRadius: 7, color: 'var(--text)',
  fontFamily: "'Figtree','DM Sans',sans-serif",
  fontSize: '.83rem', outline: 'none', boxSizing: 'border-box',
}
const lbl = { fontSize: '.72rem', color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 3 }

// ─── CVPage ───────────────────────────────────────────────────────────────────
export default function CVPage() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()

  const [worker,    setWorker]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({})
  const [habilidades, setHabilidades] = useState([])
  const [cvSections, setCvSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`cvSections_${user?.id}`) || '{}') } catch { return {} }
  })

  useEffect(() => {
    workerService.getMe()
      .then(res => {
        const wd = res.data
        setWorker(wd)
        resetForm(wd)
      })
      .catch(() => toast.error('Error al cargar datos del CV'))
      .finally(() => setLoading(false))
  }, [])

  const resetForm = (wd) => {
    setForm({
      telefono:            wd.telefono            || '',
      direccion:           wd.direccion           || '',
      disponibilidad:      wd.disponibilidad      || '',
      especialidad:        wd.especialidad        || '',
      curso:               wd.curso               || '',
      experienciaPractica: wd.experienciaPractica || '',
    })
    setHabilidades(
      (wd.habilidades || []).map(h => ({
        nombre:    h.nombre    || '',
        nivel:     h.nivel     || 3,
        categoria: h.categoria || 'Técnica',
      }))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await workerService.updateMe({ ...form, habilidades })
      setWorker(res.data)
      resetForm(res.data)
      setEditing(false)
      toast.success('CV actualizado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    resetForm(worker)
    setEditing(false)
  }

  const addHabilidad = () => {
    setHabilidades(h => [...h, { nombre: '', nivel: 3, categoria: 'Técnica' }])
  }

  const removeHabilidad = (i) => {
    setHabilidades(h => h.filter((_, idx) => idx !== i))
  }

  const updateHabilidad = (i, field, value) => {
    setHabilidades(h => h.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <AppLayout title="Mi CV">
        <div style={{ color: 'var(--text2)', padding: '3rem', textAlign: 'center' }}>
          Generando CV...
        </div>
      </AppLayout>
    )
  }

  if (!worker) {
    return (
      <AppLayout title="Mi CV">
        <div style={{ color: 'var(--text2)', padding: '3rem', textAlign: 'center' }}>
          No se encontró tu perfil de trabajador.
        </div>
      </AppLayout>
    )
  }

  const nombre      = user?.nombre || 'Sin nombre'
  const email       = user?.email  || ''
  // En modo edición mostramos los datos del form para previsualización en vivo
  const displayWorker = editing
    ? { ...worker, ...form, habilidades }
    : worker
  const habilidadesTecnicas = (displayWorker.habilidades || []).filter(h => h.categoria === 'Técnica')
  const habilidadesBlandas  = (displayWorker.habilidades || []).filter(h => h.categoria === 'Blanda')
  const insigniasGanadas    = (worker.insignias || []).filter(i => i.estado === 'APROBADA')

  // CV section visibility — default true for all
  const isSectionOn = (key) => cvSections[key] !== false
  const toggleSection = (key) => {
    const next = { ...cvSections, [key]: !isSectionOn(key) }
    setCvSections(next)
    try { localStorage.setItem(`cvSections_${user?.id}`, JSON.stringify(next)) } catch {}
  }
  const SectionToggle = ({ sectionKey }) => (
    <button
      className="cv-no-print"
      onClick={() => toggleSection(sectionKey)}
      title={isSectionOn(sectionKey) ? 'Ocultar del CV' : 'Incluir en CV'}
      style={{ background:'none', border:'none', cursor:'pointer', color: isSectionOn(sectionKey) ? 'var(--green-lit)' : 'var(--text3)', padding:'2px 4px', display:'flex', alignItems:'center', marginLeft:'auto' }}
    >
      {isSectionOn(sectionKey) ? <Eye size={13}/> : <EyeOff size={13}/>}
    </button>
  )

  return (
    <AppLayout title="Mi CV">
      {/* Barra de acción (no se imprime) */}
      <div className="cv-no-print" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: '1.5rem', flexWrap: 'wrap',
      }}>
        <button
          onClick={() => navigate('/perfil')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text2)', borderRadius: 8, padding: '8px 16px',
            cursor: 'pointer', fontFamily: "'Figtree','DM Sans',sans-serif",
            fontSize: '.82rem',
          }}
        >
          <ArrowLeft size={15} /> Volver al perfil
        </button>

        {!editing ? (
          <>
            <button
              onClick={() => setEditing(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text)', borderRadius: 8, padding: '8px 16px',
                cursor: 'pointer', fontFamily: "'Figtree','DM Sans',sans-serif",
                fontSize: '.82rem', fontWeight: 500,
              }}
            >
              <Pencil size={14} /> Editar CV
            </button>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--green)', border: 'none',
                color: '#fff', borderRadius: 8, padding: '8px 20px',
                cursor: 'pointer', fontFamily: "'Figtree','DM Sans',sans-serif",
                fontWeight: 600, fontSize: '.82rem',
              }}
            >
              <Printer size={15} /> Imprimir / Guardar PDF
            </button>
            <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
              Tip: En el diálogo de impresión selecciona "Guardar como PDF"
            </span>
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--green)', border: 'none',
                color: '#fff', borderRadius: 8, padding: '8px 20px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: "'Figtree','DM Sans',sans-serif",
                fontWeight: 600, fontSize: '.82rem', opacity: saving ? 0.7 : 1,
              }}
            >
              <Save size={14} /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text2)', borderRadius: 8, padding: '8px 16px',
                cursor: 'pointer', fontFamily: "'Figtree','DM Sans',sans-serif",
                fontSize: '.82rem',
              }}
            >
              <X size={14} /> Cancelar
            </button>
          </>
        )}
      </div>

      {/* ── Panel de secciones visibles (siempre accesible) ── */}
      <div className="cv-no-print" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem 1.5rem', marginBottom:'1.25rem', maxWidth:820, margin:'0 auto 1.25rem' }}>
        <div style={{ fontSize:'.72rem', fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.6rem' }}>Secciones del CV</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {[
            ['contacto',     'Contacto'],
            ['perfil',       'Perfil Profesional'],
            ['formacion',    'Formación Académica'],
            ['validaciones', 'Competencias Docentes'],
            ['habilTecnicas','Habilidades Técnicas'],
            ['habilBlandas', 'Habilidades Blandas'],
            ['insignias',    'Reconocimientos'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => toggleSection(key)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:`1px solid ${isSectionOn(key) ? 'rgba(77,160,232,.35)' : 'var(--border)'}`, background: isSectionOn(key) ? 'var(--green-glo)' : 'var(--surface2)', color: isSectionOn(key) ? 'var(--green-lit)' : 'var(--text3)', fontSize:'.74rem', cursor:'pointer', fontFamily:"'Figtree',sans-serif", transition:'all .15s' }}
            >
              {isSectionOn(key) ? <Eye size={11}/> : <EyeOff size={11}/>}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Panel de edición ── */}
      {editing && (
        <div className="cv-no-print" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '1.5rem',
          marginBottom: '1.5rem',
          maxWidth: 820,
          margin: '0 auto 1.5rem',
        }}>
          <div style={{
            fontFamily: "'Sora',sans-serif", fontWeight: 700,
            fontSize: '.9rem', color: 'var(--text)',
            marginBottom: '1.25rem',
            paddingBottom: '.75rem',
            borderBottom: '1px solid var(--border)',
          }}>
            Editar información del CV
          </div>

          <div className="cv-edit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Especialidad */}
            <div>
              <label style={lbl}>Especialidad</label>
              <input style={inp} value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} placeholder="Ej: Técnico en Electrónica" />
            </div>

            {/* Curso */}
            <div>
              <label style={lbl}>Curso</label>
              <input style={inp} value={form.curso} onChange={e => setForm(f => ({ ...f, curso: e.target.value }))} placeholder="Ej: 4° Medio B" />
            </div>

            {/* Teléfono */}
            <div>
              <label style={lbl}>Teléfono</label>
              <input style={inp} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+56 9 xxxx xxxx" />
            </div>

            {/* Dirección */}
            <div>
              <label style={lbl}>Dirección</label>
              <input style={inp} value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Ej: Lo Espejo, Santiago" />
            </div>

            {/* Disponibilidad */}
            <div>
              <label style={lbl}>Disponibilidad</label>
              <select style={inp} value={form.disponibilidad} onChange={e => setForm(f => ({ ...f, disponibilidad: e.target.value }))}>
                {DISPONIBILIDAD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Perfil profesional */}
          <div style={{ marginTop: '1rem' }}>
            <label style={lbl}>Perfil profesional / Sobre mí</label>
            <textarea
              style={{ ...inp, minHeight: 90, resize: 'vertical' }}
              value={form.experienciaPractica}
              onChange={e => setForm(f => ({ ...f, experienciaPractica: e.target.value }))}
              placeholder="Describe tu experiencia, logros y lo que buscas..."
            />
          </div>

          {/* Habilidades */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '.75rem',
            }}>
              <label style={{ ...lbl, marginBottom: 0 }}>Habilidades</label>
              <button
                onClick={addHabilidad}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text2)', borderRadius: 6, padding: '4px 10px',
                  cursor: 'pointer', fontSize: '.75rem',
                  fontFamily: "'Figtree','DM Sans',sans-serif",
                }}
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {habilidades.map((h, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 120px auto',
                  gap: 8, alignItems: 'center',
                }}>
                  <input
                    style={inp}
                    placeholder="Nombre de la habilidad"
                    value={h.nombre}
                    onChange={e => updateHabilidad(i, 'nombre', e.target.value)}
                  />
                  <select
                    style={inp}
                    value={h.nivel}
                    onChange={e => updateHabilidad(i, 'nivel', Number(e.target.value))}
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n * 20}%</option>)}
                  </select>
                  <select
                    style={inp}
                    value={h.categoria}
                    onChange={e => updateHabilidad(i, 'categoria', e.target.value)}
                  >
                    <option value="Técnica">Técnica</option>
                    <option value="Blanda">Blanda</option>
                  </select>
                  <button
                    onClick={() => removeHabilidad(i)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#e53e3e', padding: 4, display: 'flex',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {habilidades.length === 0 && (
                <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                  Sin habilidades. Haz clic en "Agregar" para añadir una.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Documento CV ── */}
      <div
        className="cv-document"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(42,51,83,0.12)',
          borderRadius: 12,
          maxWidth: 820,
          margin: '0 auto',
          overflow: 'hidden',
          fontFamily: "'Figtree','DM Sans',sans-serif",
          color: '#1A2035',
        }}
      >
        {/* ── Encabezado ── */}
        <div style={{
          background: 'linear-gradient(135deg, #2A3353 0%, #3D4E7A 100%)',
          padding: '2rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.75rem',
        }}>
          {/* Avatar */}
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontFamily: "'Sora',sans-serif", fontWeight: 800,
            color: '#fff', flexShrink: 0, overflow: 'hidden',
          }}>
            {displayWorker.fotoUrl
              ? <img src={displayWorker.fotoUrl} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
            }
          </div>

          {/* Info principal */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Sora',sans-serif", fontWeight: 800,
              fontSize: '1.6rem', color: '#fff', marginBottom: '.25rem',
            }}>
              {nombre}
            </div>
            <div style={{ fontSize: '.95rem', color: 'rgba(255,255,255,0.8)', marginBottom: '.5rem' }}>
              {displayWorker.especialidad || 'Técnico'}{displayWorker.curso ? ` · ${displayWorker.curso}` : ''}
            </div>
            {worker.liceoValidado === 'APROBADO' && (
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,0.65)' }}>
                {displayWorker.establecimiento || 'C.E. Cardenal José María Caro · Lo Espejo'}
              </div>
            )}

            {/* Disponibilidad badge */}
            {displayWorker.disponibilidad && (
              <div style={{
                display: 'inline-block', marginTop: '.6rem',
                background: 'rgba(255,255,255,0.15)', borderRadius: 20,
                padding: '3px 12px', fontSize: '.72rem',
                color: 'rgba(255,255,255,0.9)', fontWeight: 500,
              }}>
                {DISPONIBILIDAD_LABEL[displayWorker.disponibilidad] || displayWorker.disponibilidad}
              </div>
            )}
          </div>

          {/* Sello institucional — logo sin fondo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: 0.85 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              {/* Aristas del hexágono */}
              {[[22,6.2],[35.4,14.1],[35.4,29.9],[22,37.8],[8.6,29.9],[8.6,14.1]].map((p,i,arr) => {
                const next = arr[(i+1)%6]
                return <line key={i} x1={p[0]} y1={p[1]} x2={next[0]} y2={next[1]} stroke="white" strokeWidth="0.9" strokeOpacity="0.55" strokeLinecap="round"/>
              })}
              {/* Líneas centro → nodos principales (0,2,4) */}
              {[[22,6.2],[35.4,29.9],[8.6,29.9]].map((p,i) => (
                <line key={i} x1={22} y1={22} x2={p[0]} y2={p[1]} stroke="white" strokeWidth="0.9" strokeOpacity="0.55" strokeLinecap="round"/>
              ))}
              {/* Nodos secundarios pequeños */}
              {[[35.4,14.1],[22,37.8],[8.6,14.1]].map((p,i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="1.1" fill="white" fillOpacity="0.5"/>
              ))}
              {/* Nodos principales */}
              {[[22,6.2],[35.4,29.9],[8.6,29.9]].map((p,i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="2.7" fill="white"/>
              ))}
              {/* Nodo central con R */}
              <circle cx="22" cy="22" r="3.3" fill="white"/>
              <text x="22" y="22" textAnchor="middle" dominantBaseline="central" fill="#3B6EDC" fontWeight="800" fontSize="4.5" fontFamily="'Sora',sans-serif" letterSpacing="-0.02em">R</text>
            </svg>
            <span style={{ fontSize: '.52rem', color: 'rgba(255,255,255,0.75)', textAlign: 'center', letterSpacing: '.08em', fontFamily: "'Sora',sans-serif", fontWeight: 700 }}>
              RED TEP
            </span>
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div className="cv-doc-grid" style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: 0,
        }}>
          {/* Columna izquierda */}
          <div style={{
            background: '#F8FAFC',
            borderRight: '1px solid rgba(42,51,83,0.08)',
            padding: '1.75rem 1.5rem',
          }}>

            {/* Contacto */}
            {isSectionOn('contacto') && (
              <CVSection title="Contacto" icon={Mail}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                  {email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.78rem', color: '#4A5578' }}>
                      <Mail size={12} color="#2A3353" /> {email}
                    </div>
                  )}
                  {displayWorker.telefono && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.78rem', color: '#4A5578' }}>
                      <Phone size={12} color="#2A3353" /> {displayWorker.telefono}
                    </div>
                  )}
                  {displayWorker.direccion && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.78rem', color: '#4A5578' }}>
                      <MapPin size={12} color="#2A3353" /> {displayWorker.direccion}
                    </div>
                  )}
                  {displayWorker.disponibilidad && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.78rem', color: '#4A5578' }}>
                      <Clock size={12} color="#2A3353" /> {DISPONIBILIDAD_LABEL[displayWorker.disponibilidad] || displayWorker.disponibilidad}
                    </div>
                  )}
                </div>
              </CVSection>
            )}

            {/* Habilidades Técnicas */}
            {habilidadesTecnicas.length > 0 && isSectionOn('habilTecnicas') && (
              <CVSection title="Habilidades Técnicas" icon={Wrench}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {habilidadesTecnicas.map((h, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: '.76rem', color: '#1A2035', fontWeight: 500 }}>{h.nombre}</span>
                        <span style={{ fontSize: '.65rem', color: '#8A96B5' }}>{(h.nivel || 3) * 20}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: '#E2E8F0' }}>
                        <div style={{
                          height: 4, borderRadius: 2,
                          background: '#2A3353',
                          width: `${(h.nivel || 3) * 20}%`,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CVSection>
            )}

            {/* Habilidades Blandas */}
            {habilidadesBlandas.length > 0 && isSectionOn('habilBlandas') && (
              <CVSection title="Habilidades Blandas" icon={Star}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {habilidadesBlandas.map((h, i) => (
                    <span key={i} style={{
                      fontSize: '.7rem', padding: '2px 10px', borderRadius: 20,
                      background: 'rgba(42,51,83,0.08)', color: '#2A3353', fontWeight: 500,
                    }}>
                      {h.nombre}
                    </span>
                  ))}
                </div>
              </CVSection>
            )}

            {/* Insignias */}
            {insigniasGanadas.length > 0 && isSectionOn('insignias') && (
              <CVSection title="Reconocimientos" icon={Award}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {insigniasGanadas.map((ins, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', color: '#4A5578' }}>
                      <Award size={11} color="#c9940c" />
                      {INSIGNIA_LABEL[ins.tipo] || ins.tipo}
                    </div>
                  ))}
                </div>
              </CVSection>
            )}
          </div>

          {/* Columna derecha */}
          <div style={{ padding: '1.75rem 2rem' }}>

            {/* Sobre mí */}
            {displayWorker.experienciaPractica && isSectionOn('perfil') && (
              <CVSection title="Perfil Profesional" icon={BookOpen}>
                <div className="cv-no-print" style={{ display:'flex', justifyContent:'flex-end', marginBottom:4 }}>
                  <SectionToggle sectionKey="perfil"/>
                </div>
                <p style={{ fontSize: '.85rem', color: '#4A5578', lineHeight: 1.7, margin: 0 }}>
                  {displayWorker.experienciaPractica}
                </p>
              </CVSection>
            )}
            {displayWorker.experienciaPractica && !isSectionOn('perfil') && (
              <div className="cv-no-print" style={{ marginBottom:'.75rem', display:'flex', alignItems:'center', gap:6, fontSize:'.73rem', color:'#8A96B5' }}>
                <EyeOff size={12}/> Perfil Profesional (oculto del CV) <SectionToggle sectionKey="perfil"/>
              </div>
            )}

            {/* Formación — solo si el liceo está validado */}
            {worker.liceoValidado === 'APROBADO' && isSectionOn('formacion') && (
              <CVSection title="Formación Académica" icon={BookOpen}>
                <div className="cv-no-print" style={{ display:'flex', justifyContent:'flex-end', marginBottom:4 }}>
                  <SectionToggle sectionKey="formacion"/>
                </div>
                <div style={{ borderLeft: '3px solid #2A3353', paddingLeft: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#1A2035' }}>
                    {displayWorker.especialidad || 'Técnico Profesional'}
                  </div>
                  <div style={{ fontSize: '.78rem', color: '#4A5578', marginTop: 2 }}>
                    {displayWorker.establecimiento || 'C.E. Cardenal José María Caro'}
                  </div>
                  {displayWorker.curso && (
                    <div style={{ fontSize: '.75rem', color: '#8A96B5', marginTop: 1 }}>
                      {displayWorker.curso}
                    </div>
                  )}
                  <div style={{ fontSize: '.72rem', color: '#8A96B5', marginTop: 3 }}>
                    Lo Espejo, Santiago · Chile
                  </div>
                </div>
              </CVSection>
            )}
            {worker.liceoValidado === 'APROBADO' && !isSectionOn('formacion') && (
              <div className="cv-no-print" style={{ marginBottom:'.75rem', display:'flex', alignItems:'center', gap:6, fontSize:'.73rem', color:'#8A96B5' }}>
                <EyeOff size={12}/> Formación Académica (oculta del CV) <SectionToggle sectionKey="formacion"/>
              </div>
            )}

            {/* Validaciones docentes */}
            {worker.validaciones && worker.validaciones.length > 0 && isSectionOn('validaciones') && (
              <CVSection title="Competencias Validadas por Docentes" icon={CheckCircle}>
                <div className="cv-no-print" style={{ display:'flex', justifyContent:'flex-end', marginBottom:4 }}>
                  <SectionToggle sectionKey="validaciones"/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {worker.validaciones.map((v, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#F8FAFC', border: '1px solid rgba(42,51,83,0.08)',
                      borderRadius: 8, padding: '.55rem .85rem',
                    }}>
                      <div>
                        <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#1A2035' }}>{v.competencia}</div>
                        {v.observacion && (
                          <div style={{ fontSize: '.7rem', color: '#8A96B5', marginTop: 1 }}>{v.observacion}</div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '.65rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                        background: NIVEL_BADGE[v.nivel] || '#2A3353', color: '#fff',
                      }}>
                        {v.nivel}
                      </span>
                    </div>
                  ))}
                </div>
              </CVSection>
            )}
            {worker.validaciones && worker.validaciones.length > 0 && !isSectionOn('validaciones') && (
              <div className="cv-no-print" style={{ marginBottom:'.75rem', display:'flex', alignItems:'center', gap:6, fontSize:'.73rem', color:'#8A96B5' }}>
                <EyeOff size={12}/> Competencias Validadas (ocultas del CV) <SectionToggle sectionKey="validaciones"/>
              </div>
            )}

            {/* Pie de página del CV */}
            <div style={{
              marginTop: '1.5rem', paddingTop: '1rem',
              borderTop: '1px solid rgba(42,51,83,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '.65rem', color: '#8A96B5' }}>
                CV generado desde RED TEP · C.E. Cardenal José María Caro
              </div>
              <div style={{ fontSize: '.65rem', color: '#8A96B5' }}>
                {new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          .cv-no-print { display: none !important; }
          body { background: white !important; }
          .cv-document {
            border: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          nav, aside, header, footer { display: none !important; }
          /* Oculta el AppLayout sidebar/topbar en impresión */
          [data-sidebar], [data-topbar] { display: none !important; }
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      `}</style>
    </AppLayout>
  )
}

import { useEffect, useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, Clock, Camera, Loader, Lock, LockOpen, Medal, CheckCircle, Film, Briefcase, Star, Wrench, ClipboardList, X, Globe, Check } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { Avatar, Badge, Chip, BtnGreen, BtnOutline, ProgressBar, SectionTitle, StatCard, EmptyState } from '../components/ui/index'
import { workerService, companyService, adminService, ofertaService, eventoService, mediaService, followService } from '../services/index'
import useAuthStore from '../store/authStore'

const C = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }
const inp = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none', marginTop:3, boxSizing:'border-box' }
const lbl = { fontSize:'.75rem', color:'var(--text2)', fontWeight:500 }

const BANNER_PRESETS = [
  'linear-gradient(135deg, #1a4f8c 0%, #0b1729 100%)',
  'linear-gradient(135deg, #2d6a4f 0%, #081c15 100%)',
  'linear-gradient(135deg, #6a0572 0%, #1a0530 100%)',
  'linear-gradient(135deg, #b5451b 0%, #1e0f07 100%)',
  'linear-gradient(135deg, #1a3a6e 0%, #2c1a6e 100%)',
  'linear-gradient(135deg, #006466 0%, #0b1729 100%)',
  'linear-gradient(135deg, #4a4e69 0%, #1a1a2e 100%)',
  'linear-gradient(135deg, #7b2d8b 0%, #1a0048 100%)',
]

// ═══════════════════════════════════════════════════════
// PERFIL ESTUDIANTE
// ═══════════════════════════════════════════════════════
function StudentProfile({ user, setPhotoUrl }) {
  const [worker,  setWorker]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({})
  const [progreso, setProgreso] = useState({ perfilTecnico:0, habilidades:0, practicas:0, portafolio:0 })
  const [habilidadesEdit, setHabilidadesEdit] = useState([])
  const [buscando, setBuscando] = useState(true)
  const [media,   setMedia]   = useState([])
  const [mediaFilter, setMediaFilter] = useState('')
  const [uploading, setUploading]     = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileRef      = useRef()
  const filePhotoRef = useRef()

  useEffect(() => {
    Promise.all([
      workerService.getMe(),
      mediaService.getFeed({ tipo: '' }),
    ]).then(([w, m]) => {
      const wd = w.data
      setWorker(wd)
      setBuscando(wd.buscandoTrabajo !== false)
      setProgreso({ perfilTecnico:0, habilidades:0, practicas:0, portafolio:0, ...(wd.progreso || {}) })
      setHabilidadesEdit(wd.habilidades?.map(h => ({ nombre: h.nombre, nivel: h.nivel || 3, categoria: h.categoria || 'Técnica' })) || [])
      setMedia(m.data.filter(item => item.worker?.user?.nombre === user?.nombre))
      setForm({
        especialidad: wd.especialidad || '',
        telefono:     wd.telefono     || '',
        curso:        wd.curso        || '',
        disponibilidad: wd.disponibilidad || '',
        direccion:    wd.direccion    || '',
        experienciaPractica: wd.experienciaPractica || '',
        bannerColor:  wd.bannerColor  || '',
      })
    }).catch(() => toast.error('Error al cargar perfil'))
    .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      const res = await workerService.updateMe({
        ...form,
        progreso,
        habilidades: habilidadesEdit,
      })
      setWorker(res.data)
      setProgreso({ perfilTecnico:0, habilidades:0, practicas:0, portafolio:0, ...(res.data.progreso || {}) })
      setHabilidadesEdit(res.data.habilidades?.map(h => ({ nombre: h.nombre, nivel: h.nivel || 3, categoria: h.categoria || 'Técnica' })) || [])
      setForm(f => ({ ...f, bannerColor: res.data.bannerColor || f.bannerColor }))
      setEditing(false)
      toast.success('Perfil actualizado')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar') }
  }

  const toggleBuscando = async () => {
    const next = !buscando
    try {
      await workerService.updateMe({ buscandoTrabajo: next })
      setBuscando(next)
      toast.success(next ? 'Ahora apareces en búsquedas de empleo' : 'Ya no apareces en búsquedas de empleo')
    } catch { toast.error('Error al actualizar estado') }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('descripcion', 'Práctica')
    try {
      await workerService.uploadMedia(fd)
      toast.success('Archivo subido')
      const m = await mediaService.getFeed({})
      setMedia(m.data.filter(item => item.worker?.user?.nombre === user?.nombre))
    } catch { toast.error('Error al subir') }
    finally { setUploading(false) }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r   = await mediaService.uploadUrl(fd)
      const url = r.data.url
      const res = await workerService.updateMe({ fotoUrl: url })
      setWorker(res.data)
      setPhotoUrl(url)   // actualiza sidebar inmediatamente
      toast.success('Foto de perfil actualizada')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al subir foto') }
    finally { setPhotoUploading(false); e.target.value = '' }
  }

  if (loading) return <div style={{ padding:'2rem', color:'var(--text2)' }}>Cargando...</div>

  const nombre   = user?.nombre || ''
  const initials = nombre.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()
  const filteredMedia = mediaFilter ? media.filter(m => m.tipo === mediaFilter) : media

  return (
    <div style={{ display:'grid', gridTemplateColumns:'270px 1fr', gap:'1.25rem' }}>
      {/* Columna izquierda */}
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

        {/* Tarjeta de perfil */}
        <div style={{ ...C, padding:0, overflow:'hidden' }}>
          <div style={{ background: form.bannerColor || 'linear-gradient(160deg, var(--green) 0%, #0f1f38 100%)', padding:'1.5rem', textAlign:'center', position:'relative' }}>
            <div style={{ position:'relative', width:68, height:68, margin:'0 auto .9rem' }}>
              <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(255,255,255,.15)', border:'3px solid rgba(255,255,255,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:'1.25rem', color:'#fff', overflow:'hidden' }}>
                {worker?.fotoUrl
                  ? <img src={worker.fotoUrl} alt={nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : initials
                }
              </div>
              <button
                onClick={() => filePhotoRef.current?.click()}
                title={photoUploading ? 'Subiendo...' : 'Cambiar foto'}
                disabled={photoUploading}
                style={{ position:'absolute', bottom:0, right:-6, background:'var(--green-mid)', border:'2px solid rgba(0,0,0,.3)', borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}
              >
                {photoUploading ? <Loader size={12}/> : <Camera size={12}/>}
              </button>
              <input ref={filePhotoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoUpload}/>
            </div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1rem', color:'#fff' }}>{nombre}</div>
            <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.65)', marginTop:'.2rem' }}>{worker?.especialidad || 'Sin especialidad'} · {worker?.curso || 'Sin curso'}</div>
            <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:'.75rem', flexWrap:'wrap' }}>
              {worker?.validaciones?.length > 0 && <Badge label="✓ Validado" color="green"/>}
              {worker?.perfilCompleto && <Badge label="Perfil completo" color="amber"/>}
            </div>
          </div>
          <div style={{ padding:'1rem' }}>
            {[
              [Mail,   user?.email],
              [Phone,  worker?.telefono || 'No registrado'],
              [MapPin, worker?.direccion || 'No registrado'],
              [Clock,  worker?.disponibilidad?.replace(/_/g,' ') || 'Por definir'],
            ].map(([Icon, val]) => (
              <div key={val} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.76rem', color:'var(--text2)', marginBottom:'.45rem' }}>
                <Icon size={13} strokeWidth={1.8} />{val}
              </div>
            ))}
            <div style={{ marginTop:'.75rem', paddingTop:'.75rem', borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:'.4rem' }}>Estado laboral</div>
              <button
                onClick={toggleBuscando}
                style={{
                  display:'flex', alignItems:'center', gap:8, width:'100%',
                  background: buscando ? 'rgba(34,197,94,.1)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${buscando ? 'rgba(34,197,94,.3)' : 'var(--border)'}`,
                  borderRadius:8, padding:'6px 10px', cursor:'pointer',
                  transition:'all .2s',
                }}
              >
                <div style={{
                  width:32, height:18, borderRadius:9, position:'relative',
                  background: buscando ? 'rgba(34,197,94,.7)' : 'var(--surface2)',
                  transition:'background .2s', flexShrink:0,
                }}>
                  <div style={{
                    position:'absolute', top:2, left: buscando ? 14 : 2,
                    width:14, height:14, borderRadius:'50%',
                    background:'#fff', transition:'left .2s',
                  }}/>
                </div>
                <span style={{ fontSize:'.74rem', color: buscando ? 'rgba(34,197,94,.9)' : 'var(--text3)', fontWeight:500 }}>
                  {buscando ? 'Buscando trabajo' : 'No disponible'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Progreso formativo */}
        <div style={C}>
          <SectionTitle>Progreso Formativo</SectionTitle>
          {[
            { key:'perfilTecnico', label:'Perfil técnico',  badge:'PERFIL_COMPLETO' },
            { key:'habilidades',   label:'Habilidades',     badge:'TOP_CANDIDATO' },
            { key:'practicas',     label:'Prácticas',       badge:'EXPERIENCIA_PRACTICA' },
            { key:'portafolio',    label:'Portafolio',      badge: null },
          ].map(({ key, label, badge }) => {
            const val = progreso[key] || 0
            const unlocks = badge && val >= 100 && !worker?.insignias?.some(i => i.tipo === badge)
            return (
              <div key={key} style={{ marginBottom:'.55rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem', marginBottom:3 }}>
                  <span style={{ color:'var(--text2)' }}>{label}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:2, color: val >= 100 ? 'var(--amber-lit)' : 'var(--green-lit)' }}>
                    <span>{val}%</span>{unlocks && <LockOpen size={10}/>}
                  </div>
                </div>
                <div style={{ height:5, borderRadius:3, background:'var(--surface2)' }}>
                  <div style={{ height:5, borderRadius:3, background: val >= 100 ? 'var(--amber)' : 'var(--green-mid)', width:`${val}%`, transition:'width .3s' }}/>
                </div>
              </div>
            )
          })}
        </div>

        {/* Insignias */}
        <div style={C}>
          <SectionTitle>Insignias</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
            {[
              { tipo:'PERFIL_COMPLETO',       icon:Medal,        label:'Perfil',   hint:'Perfil técnico 100%' },
              { tipo:'VALIDADO_POR_PROFESOR',  icon:CheckCircle,  label:'Validado', hint:'Asignada por docente' },
              { tipo:'EXPERIENCIA_PRACTICA',   icon:Film,         label:'Práctica', hint:'Prácticas 100%' },
              { tipo:'PRIMERA_POSTULACION',    icon:Briefcase,    label:'1ª Post.', hint:'Primera postulación' },
              { tipo:'TOP_CANDIDATO',          icon:Star,         label:'Top',      hint:'Habilidades 100%' },
            ].map(({ tipo, icon: Icon, label, hint }) => {
              const earned = worker?.insignias?.some(i => i.tipo === tipo)
              return (
                <div key={tipo} title={hint} style={{ background: earned ? 'var(--amber-bg)' : 'var(--surface2)', border:`1px solid ${earned ? 'rgba(212,160,23,.3)' : 'var(--border)'}`, borderRadius:8, padding:'.55rem', textAlign:'center', cursor:'help' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:2, color: earned ? 'var(--amber-lit)' : 'var(--text3)' }}>
                    {earned ? <Icon size={20}/> : <Lock size={20}/>}
                  </div>
                  <div style={{ fontSize:'.58rem', color: earned ? 'var(--amber-lit)' : 'var(--text3)' }}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Columna derecha */}
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

        {/* Botón editar */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          {editing
            ? <><BtnOutline onClick={() => setEditing(false)}>Cancelar</BtnOutline><BtnGreen onClick={handleSave} style={{ marginLeft:0 }}>Guardar cambios</BtnGreen></>
            : <BtnGreen onClick={() => setEditing(true)}>Editar perfil</BtnGreen>
          }
        </div>

        {/* Formulario de edición */}
        {editing && (
          <div style={C}>
            <SectionTitle>Editar información</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1rem' }}>
              {[
                ['Especialidad', 'especialidad', 'Electricidad, Gastronomía...'],
                ['Curso',        'curso',        '4to Medio TP, 3er EPJA...'],
                ['Teléfono',     'telefono',     '+56 9 XXXX XXXX'],
                ['Dirección',    'direccion',    'Calle, comuna...'],
              ].map(([label, key, ph]) => (
                <div key={key} style={{ marginBottom:'.75rem' }}>
                  <label style={lbl}>{label}</label>
                  <input style={inp} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph}/>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Disponibilidad</label>
              <select style={inp} value={form.disponibilidad||''} onChange={e=>setForm({...form,disponibilidad:e.target.value})}>
                <option value="">Seleccionar...</option>
                {['TIEMPO_COMPLETO','MEDIO_TIEMPO','FINES_DE_SEMANA','POR_DEFINIR'].map(d=>(
                  <option key={d} value={d}>{d.replace(/_/g,' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Experiencia práctica</label>
              <textarea style={{ ...inp, resize:'vertical', minHeight:80 }} value={form.experienciaPractica||''} onChange={e=>setForm({...form,experienciaPractica:e.target.value})} placeholder="Describe tu experiencia..."/>
            </div>
            <div style={{ marginTop:'.75rem' }}>
              <label style={lbl}>Color de banner</label>
              <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                {BANNER_PRESETS.map((bg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({...form, bannerColor: bg})}
                    style={{
                      width:32, height:32, borderRadius:8, background:bg, cursor:'pointer',
                      border: form.bannerColor === bg ? '2px solid var(--green-lit)' : '2px solid transparent',
                      outline: form.bannerColor === bg ? '1px solid var(--green-lit)' : 'none',
                      flexShrink:0,
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginTop:'1rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
              <label style={{ ...lbl, marginBottom:8, display:'block' }}>Progreso formativo</label>
              <div style={{ fontSize:'.7rem', color:'var(--text3)', marginBottom:'.75rem' }}>
                Al llegar a 100% se desbloquean insignias automáticamente al guardar.
              </div>
              {[
                { key:'perfilTecnico', label:'Perfil técnico',  badge:'Perfil completo' },
                { key:'habilidades',   label:'Habilidades',     badge:'Top candidato' },
                { key:'practicas',     label:'Prácticas',       badge:'Práctica completa' },
                { key:'portafolio',    label:'Portafolio',      badge: null },
              ].map(({ key, label, badge }) => (
                <div key={key} style={{ marginBottom:'.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:'.78rem', color:'var(--text2)' }}>{label}{badge && <span style={{ fontSize:'.65rem', color:'var(--text3)', marginLeft:6 }}>→ {badge}</span>}</span>
                    <span style={{ fontSize:'.78rem', color:'var(--green-lit)', fontWeight:500 }}>{progreso[key] || 0}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={progreso[key] || 0}
                    onChange={e => setProgreso(p => ({ ...p, [key]: Number(e.target.value) }))}
                    style={{ width:'100%', accentColor:'var(--green-mid)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habilidades */}
        <div style={C}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.9rem' }}>
            <SectionTitle style={{ marginBottom:0 }}>Habilidades Técnicas</SectionTitle>
            {editing && (
              <button
                onClick={() => setHabilidadesEdit(h => [...h, { nombre:'', nivel:3, categoria:'Técnica' }])}
                style={{ background:'var(--green-mid)', color:'#fff', border:'none', borderRadius:7, padding:'4px 10px', fontSize:'.72rem', cursor:'pointer' }}
              >+ Agregar</button>
            )}
          </div>
          {editing ? (
            habilidadesEdit.length === 0
              ? <div style={{ fontSize:'.8rem', color:'var(--text3)' }}>Presiona "+ Agregar" para añadir habilidades</div>
              : habilidadesEdit.map((h, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:6, alignItems:'center', marginBottom:6 }}>
                  <input
                    style={{ ...inp, marginTop:0 }}
                    value={h.nombre}
                    onChange={e => { const a=[...habilidadesEdit]; a[i]={...a[i],nombre:e.target.value}; setHabilidadesEdit(a) }}
                    placeholder="Nombre habilidad..."
                  />
                  <select
                    style={{ ...inp, marginTop:0, width:'auto' }}
                    value={h.nivel}
                    onChange={e => { const a=[...habilidadesEdit]; a[i]={...a[i],nivel:Number(e.target.value)}; setHabilidadesEdit(a) }}
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n*20}%</option>)}
                  </select>
                  <select
                    style={{ ...inp, marginTop:0, width:'auto' }}
                    value={h.categoria}
                    onChange={e => { const a=[...habilidadesEdit]; a[i]={...a[i],categoria:e.target.value}; setHabilidadesEdit(a) }}
                  >
                    <option value="Técnica">Técnica</option>
                    <option value="Blanda">Blanda</option>
                  </select>
                  <button
                    onClick={() => setHabilidadesEdit(h => h.filter((_,j)=>j!==i))}
                    style={{ background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', color:'rgba(239,68,68,.8)', borderRadius:6, padding:'4px 8px', cursor:'pointer', display:'flex', alignItems:'center' }}
                  ><X size={13}/></button>
                </div>
              ))
          ) : (
            worker?.habilidades?.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <tbody>
                  {worker.habilidades.map(h => (
                    <tr key={h.id}>
                      <td style={{ padding:'.4rem .25rem', fontSize:'.8rem', color:'var(--text)', width:'40%' }}>{h.nombre}</td>
                      <td style={{ padding:'.4rem .25rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:5, borderRadius:3, background:'var(--surface2)' }}>
                            <div style={{ height:5, borderRadius:3, background:'var(--green-mid)', width:`${(h.nivel||3)*20}%` }}/>
                          </div>
                          <span style={{ fontSize:'.62rem', color:'var(--text3)', minWidth:28 }}>{(h.nivel||3)*20}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'.4rem .25rem' }}><Chip label={h.categoria} active={h.categoria==='Técnica'}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState icon={Wrench} message="Sin habilidades registradas. Edita tu perfil para agregarlas."/>
          )}
        </div>

        {/* Prácticas / Media */}
        <div style={C}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.9rem', color:'var(--text)' }}>Mis Prácticas</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {[['','Todos'],['VIDEO','Videos'],['FOTO','Fotos']].map(([v,l]) => (
                <button key={v} onClick={() => setMediaFilter(v)} style={{ padding:'4px 12px', borderRadius:20, border:`1px solid ${mediaFilter===v?'var(--green-mid)':'var(--border)'}`, background: mediaFilter===v?'var(--green-glo)':'transparent', color: mediaFilter===v?'var(--green-lit)':'var(--text2)', fontSize:'.72rem', cursor:'pointer' }}>{l}</button>
              ))}
              <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={handleUpload}/>
              <BtnGreen onClick={() => fileRef.current?.click()} disabled={uploading} style={{ fontSize:'.75rem', padding:'5px 12px' }}>
                {uploading ? 'Subiendo...' : '+ Subir'}
              </BtnGreen>
            </div>
          </div>
          {filteredMedia.length === 0 ? (
            <EmptyState icon={Film} message="Aún no has subido videos ni fotos"/>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
              {filteredMedia.map(m => (
                <div key={m.id} style={{ borderRadius:10, overflow:'hidden', border:'1px solid var(--border)', aspectRatio:'1', position:'relative' }}>
                  {m.tipo === 'VIDEO'
                    ? <video src={m.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} controls/>
                    : <img src={m.url} alt={m.descripcion} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Postulaciones */}
        <div style={C}>
          <SectionTitle>Postulaciones Recientes</SectionTitle>
          {worker?.postulaciones?.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {worker.postulaciones.slice(0,5).map(p => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', borderRadius:8, padding:'.65rem 1rem' }}>
                  <div>
                    <div style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text)' }}>{p.oferta?.cargo}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--text2)' }}>{p.oferta?.company?.nombreEmpresa}</div>
                  </div>
                  <Badge label={p.estado} color={p.estado==='ACEPTADO'?'green':p.estado==='RECHAZADO'?'red':'amber'}/>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Briefcase} message="Aún no has postulado a ninguna oferta"/>}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// PERFIL EMPRESA
// ═══════════════════════════════════════════════════════
const BLANK_OFERTA = { cargo:'', descripcion:'', especialidadRequerida:'', comuna:'', disponibilidad:'', salario:'', horario:'' }

function CompanyProfile({ user, setPhotoUrl }) {
  const [company,    setCompany]    = useState(null)
  const [ofertas,    setOfertas]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(false)
  const [form,       setForm]       = useState({})
  const [modal,      setModal]      = useState(false)
  const [ofForm,     setOfForm]     = useState(BLANK_OFERTA)
  const [saving,     setSaving]     = useState(false)
  const [reqLoading, setReqLoading] = useState(false)
  const [followStats,     setFollowStats]     = useState({ followers: 0, following: 0 })
  const [logoUploading,   setLogoUploading]   = useState(false)
  const fileLogoRef = useRef()

  useEffect(() => {
    Promise.all([companyService.getMe(), ofertaService.getAll(), followService.getMyStats()])
      .then(([c, o, fs]) => {
        setCompany(c.data)
        setOfertas(o.data)
        setFollowStats(fs.data)
        setForm({
          nombreEmpresa: c.data.nombreEmpresa || '',
          rut:           c.data.rut           || '',
          rubro:         c.data.rubro         || '',
          comuna:        c.data.comuna        || '',
          telefono:      c.data.telefono      || '',
          sitioWeb:      c.data.sitioWeb      || '',
          bannerColor:   c.data.bannerColor   || '',
        })
      })
      .catch(() => toast.error('Error al cargar perfil'))
      .finally(() => setLoading(false))
  }, [])

  const handleRequestVerification = async () => {
    setReqLoading(true)
    try {
      await companyService.requestVerification()
      toast.success('Solicitud enviada al administrador')
      setCompany(prev => ({ ...prev, verificationRequested: true }))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar solicitud')
    } finally { setReqLoading(false) }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r   = await mediaService.uploadUrl(fd)
      const url = r.data.url
      const res = await companyService.updateMe({ logoUrl: url })
      setCompany(res.data)
      setPhotoUrl(url)   // actualiza sidebar inmediatamente
      toast.success('Logo actualizado')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al subir logo') }
    finally { setLogoUploading(false); e.target.value = '' }
  }

  const handleSave = async () => {
    try {
      const res = await companyService.updateMe(form)
      setCompany(res.data)
      setEditing(false)
      toast.success('Perfil actualizado')
    } catch { toast.error('Error al guardar') }
  }

  const handleCreateOferta = async () => {
    if (!ofForm.cargo) return toast.error('El cargo es requerido')
    setSaving(true)
    try {
      const { data } = await ofertaService.create(ofForm)
      toast.success('Oferta publicada')
      setOfertas(prev => [data, ...prev])
      setModal(false)
      setOfForm(BLANK_OFERTA)
    } catch (err) { toast.error(err.response?.data?.error || 'Error al publicar') }
    finally { setSaving(false) }
  }

  const toggleActiva = async (o) => {
    try {
      await ofertaService.update(o.id, { activa: !o.activa })
      setOfertas(prev => prev.map(x => x.id === o.id ? { ...x, activa: !o.activa } : x))
      toast.success(o.activa ? 'Oferta desactivada' : 'Oferta activada')
    } catch { toast.error('Error') }
  }

  if (loading) return <div style={{ padding:'2rem', color:'var(--text2)' }}>Cargando...</div>

  const initials = (company?.nombreEmpresa||'??').slice(0,2).toUpperCase()

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'1.25rem' }}>
      {/* Columna izquierda */}
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div style={{ ...C, padding:0, overflow:'hidden' }}>
          <div style={{ background: form.bannerColor || 'linear-gradient(160deg, #1a4f8c 0%, #0f1f38 100%)', padding:'1.5rem', textAlign:'center', position:'relative' }}>
            <div style={{ position:'relative', width:64, height:64, margin:'0 auto .9rem' }}>
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt="logo" style={{ width:64, height:64, borderRadius:12, objectFit:'cover', display:'block', border:'2px solid rgba(255,255,255,.2)' }}/>
              ) : (
                <div style={{ width:64, height:64, borderRadius:12, background:'rgba(255,255,255,.15)', border:'2px solid rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:'1.3rem', color:'#fff' }}>{initials}</div>
              )}
              <button
                onClick={() => fileLogoRef.current?.click()}
                title={logoUploading ? 'Subiendo...' : 'Cambiar logo'}
                disabled={logoUploading}
                style={{ position:'absolute', bottom:-4, right:-8, background:'var(--green-mid)', border:'2px solid rgba(0,0,0,.3)', borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}
              >
                {logoUploading ? <Loader size={12}/> : <Camera size={12}/>}
              </button>
              <input ref={fileLogoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoUpload}/>
            </div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1rem', color:'#fff' }}>
              {company?.nombreEmpresa}
              {company?.verified && <span style={{ marginLeft:6, fontSize:'.75rem', color:'#74c69d' }}>✔</span>}
            </div>
            <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.65)', marginTop:'.2rem' }}>{company?.rubro || 'Sin rubro'}</div>
          </div>
          <div style={{ padding:'1rem' }}>
            {[
              [Mail,   user?.email],
              [Phone,  company?.telefono || 'No registrado'],
              [MapPin, company?.comuna   || 'No registrada'],
              [Globe,  company?.sitioWeb || 'Sin sitio web'],
            ].map(([Icon, val]) => (
              <div key={val} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.76rem', color:'var(--text2)', marginBottom:'.45rem' }}>
                <Icon size={13} strokeWidth={1.8} />{val}
              </div>
            ))}

            {/* Stats seguidores */}
            <div style={{ display:'flex', gap:16, justifyContent:'center', padding:'.65rem 0', borderTop:'1px solid var(--border)', marginTop:'.5rem' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.95rem', color:'var(--text)' }}>{followStats.followers}</div>
                <div style={{ fontSize:'.62rem', color:'var(--text3)' }}>seguidores</div>
              </div>
              <div style={{ width:1, background:'var(--border)' }}/>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.95rem', color:'var(--text)' }}>{followStats.following}</div>
                <div style={{ fontSize:'.62rem', color:'var(--text3)' }}>siguiendo</div>
              </div>
            </div>

            {/* Verificación */}
            {!company?.verified && (
              <div style={{ marginTop:'.5rem' }}>
                {company?.verificationRequested ? (
                  <div style={{ textAlign:'center', fontSize:'.72rem', color:'var(--amber-lit)', padding:'.5rem', background:'var(--amber-bg)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <Loader size={12}/> Verificación en revisión
                  </div>
                ) : (
                  <button
                    onClick={handleRequestVerification}
                    disabled={reqLoading}
                    style={{
                      width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid rgba(77,160,232,.3)',
                      background:'var(--green-glo)', color:'var(--green-lit)', fontSize:'.75rem',
                      fontWeight:500, cursor:'pointer', opacity: reqLoading ? .6 : 1,
                    }}
                  >
                    {reqLoading ? 'Enviando...' : <><Check size={12}/> Solicitar verificación</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna derecha */}
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          {editing
            ? <><BtnOutline onClick={() => setEditing(false)}>Cancelar</BtnOutline><BtnGreen onClick={handleSave}>Guardar cambios</BtnGreen></>
            : <BtnGreen onClick={() => setEditing(true)}>Editar perfil</BtnGreen>
          }
        </div>

        {editing && (
          <div style={C}>
            <SectionTitle>Editar información</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1rem' }}>
              {[
                ['Nombre empresa','nombreEmpresa','Nombre de la empresa'],
                ['RUT',           'rut',          '12.345.678-9'],
                ['Rubro',         'rubro',         'Construcción, TI...'],
                ['Comuna',        'comuna',        'Santiago, Pudahuel...'],
                ['Teléfono',      'telefono',      '+56 2 XXXX XXXX'],
                ['Sitio web',     'sitioWeb',      'https://...'],
              ].map(([label, key, ph]) => (
                <div key={key} style={{ marginBottom:'.75rem' }}>
                  <label style={lbl}>{label}</label>
                  <input style={inp} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph}/>
                </div>
              ))}
            </div>
            <div style={{ marginTop:'.25rem' }}>
              <label style={lbl}>Color de banner</label>
              <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                {BANNER_PRESETS.map((bg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({...form, bannerColor: bg})}
                    style={{
                      width:32, height:32, borderRadius:8, background:bg, cursor:'pointer',
                      border: form.bannerColor === bg ? '2px solid var(--green-lit)' : '2px solid transparent',
                      outline: form.bannerColor === bg ? '1px solid var(--green-lit)' : 'none',
                      flexShrink:0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ofertas */}
        <div style={C}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.9rem', color:'var(--text)' }}>
              Mis Ofertas Laborales
              <span style={{ marginLeft:8, fontSize:'.72rem', color:'var(--text3)' }}>{ofertas.length}</span>
            </div>
            <BtnGreen onClick={() => setModal(true)} style={{ fontSize:'.78rem', padding:'6px 14px' }}>+ Nueva oferta</BtnGreen>
          </div>

          {ofertas.length === 0 ? (
            <EmptyState icon={ClipboardList} message="No has publicado ninguna oferta"/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {ofertas.map(o => (
                <div key={o.id} style={{ display:'flex', alignItems:'center', gap:'1rem', background:'var(--surface2)', borderRadius:10, padding:'.75rem 1rem' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.85rem', color:'var(--text)', marginBottom:'.15rem' }}>{o.cargo}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--text2)' }}>
                      {o.especialidadRequerida && `${o.especialidadRequerida} · `}
                      {o.disponibilidad?.replace(/_/g,' ')} · {o.postulaciones?.length||0} postulantes
                    </div>
                  </div>
                  <Badge label={o.activa ? 'Activa' : 'Inactiva'} color={o.activa ? 'green' : 'gray'}/>
                  <BtnOutline onClick={() => toggleActiva(o)} style={{ fontSize:'.72rem', padding:'4px 10px' }}>
                    {o.activa ? 'Desactivar' : 'Activar'}
                  </BtnOutline>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal nueva oferta */}
      {modal && (
        <div onClick={e=>{ if(e.target===e.currentTarget) setModal(false) }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:'2rem', width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.1rem', color:'var(--text)', marginBottom:'1.5rem' }}>Publicar nueva oferta</div>
            {[['Cargo / Título del puesto','cargo'],['Especialidad requerida','especialidadRequerida'],['Comuna','comuna'],['Salario','salario'],['Horario','horario']].map(([label, key]) => (
              <div key={key} style={{ marginBottom:'.75rem' }}>
                <label style={lbl}>{label}</label>
                <input style={inp} value={ofForm[key]||''} onChange={e=>setOfForm({...ofForm,[key]:e.target.value})} placeholder={label}/>
              </div>
            ))}
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Disponibilidad</label>
              <select style={inp} value={ofForm.disponibilidad||''} onChange={e=>setOfForm({...ofForm,disponibilidad:e.target.value})}>
                <option value="">Seleccionar...</option>
                {['TIEMPO_COMPLETO','MEDIO_TIEMPO','FINES_DE_SEMANA'].map(d=><option key={d} value={d}>{d.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={lbl}>Descripción</label>
              <textarea style={{ ...inp, resize:'vertical', minHeight:80 }} value={ofForm.descripcion||''} onChange={e=>setOfForm({...ofForm,descripcion:e.target.value})} placeholder="Descripción del cargo..."/>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <BtnOutline onClick={() => { setModal(false); setOfForm(BLANK_OFERTA) }}>Cancelar</BtnOutline>
              <BtnGreen onClick={handleCreateOferta} disabled={saving || !ofForm.cargo}>{saving ? 'Publicando...' : 'Publicar oferta'}</BtnGreen>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// PERFIL ADMIN
// ═══════════════════════════════════════════════════════
function AdminProfile({ user }) {
  const [metrics,   setMetrics]   = useState(null)
  const [companies, setCompanies] = useState([])
  const [eventos,   setEventos]   = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      adminService.getMetrics(),
      adminService.getAllCompanies(),
      eventoService.getAll(),
    ]).then(([m, c, e]) => {
      setMetrics(m.data)
      // Solo empresas que han solicitado verificación y aún no están verificadas
      setCompanies(c.data.filter(co => co.verificationRequested && !co.verified))
      setEventos(e.data)
    }).catch(() => toast.error('Error al cargar datos'))
    .finally(() => setLoading(false))
  }, [])

  const handleVerify = async (id) => {
    try {
      const { data } = await adminService.verifyCompany(id)
      toast.success('Empresa verificada')
      setCompanies(prev => prev.filter(c => c.id !== id))
    } catch { toast.error('Error') }
  }

  if (loading) return <div style={{ padding:'2rem', color:'var(--text2)' }}>Cargando...</div>

  const initials = (user?.nombre||'AD').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

      {/* Header */}
      <div style={{ ...C, display:'flex', alignItems:'center', gap:'1.25rem' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--amber)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:'1.2rem', color:'#fff', flexShrink:0 }}>{initials}</div>
        <div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.1rem', color:'var(--text)' }}>{user?.nombre}</div>
          <div style={{ fontSize:'.78rem', color:'var(--text2)', marginTop:2 }}>Administrador · {user?.email}</div>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
        <StatCard num={metrics?.trabajadores?.total||0} label="Estudiantes activos"/>
        <StatCard num={metrics?.empresas?.aprobadas||0} label="Empresas" color="var(--amber-lit)"/>
        <StatCard num={metrics?.ofertas||0} label="Ofertas activas"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        {/* Solicitudes de verificación */}
        <div style={C}>
          <SectionTitle>
            Solicitudes de Verificación
            {companies.length > 0 && (
              <span style={{ marginLeft:6, background:'var(--green-glo)', color:'var(--green-lit)', fontSize:'.65rem', padding:'1px 7px', borderRadius:8 }}>
                {companies.length}
              </span>
            )}
          </SectionTitle>
          {companies.length === 0
            ? <div style={{ fontSize:'.82rem', color:'var(--text3)' }}>Sin solicitudes pendientes.</div>
            : companies.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', borderRadius:8, padding:'.65rem .9rem', marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text)' }}>{c.nombreEmpresa}</div>
                  <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>{c.rubro || 'Sin rubro'} · {c.user?.email}</div>
                </div>
                <button
                  onClick={() => handleVerify(c.id)}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:7, border:'1px solid rgba(42,51,83,.2)', background:'var(--green-glo)', color:'var(--green-lit)', fontSize:'.72rem', fontWeight:500, cursor:'pointer' }}
                >
                  <Check size={12}/> Verificar
                </button>
              </div>
            ))
          }
        </div>

        {/* Próximos eventos */}
        <div style={C}>
          <SectionTitle>Próximos Eventos</SectionTitle>
          {eventos.length === 0
            ? <div style={{ fontSize:'.82rem', color:'var(--text3)' }}>Sin eventos próximos.</div>
            : eventos.slice(0,4).map(e => {
              const d = new Date(e.fecha)
              return (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--surface2)', borderRadius:8, padding:'.6rem .9rem', marginBottom:6 }}>
                  <div style={{ background:'var(--green)', borderRadius:6, padding:'.3rem .5rem', textAlign:'center', minWidth:38, flexShrink:0 }}>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.88rem', color:'#fff' }}>{d.getDate()}</div>
                    <div style={{ fontSize:'.54rem', color:'rgba(255,255,255,.6)' }}>{d.toLocaleString('es',{month:'short'}).toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:'.8rem', fontWeight:500, color:'var(--text)' }}>{e.titulo}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--text2)' }}>{e.lugar}</div>
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// PAGE PRINCIPAL — router por rol
// ═══════════════════════════════════════════════════════
export default function ProfilePage() {
  const { user, setPhotoUrl } = useAuthStore()

  const isAdmin  = ['ADMIN', 'TEACHER'].includes(user?.role)
  const isCompany = user?.role === 'COMPANY'

  const title = isAdmin ? 'Mi Perfil' : isCompany ? 'Perfil de Empresa' : 'Mi Perfil Técnico'

  return (
    <AppLayout title={title}>
      {isAdmin   && <AdminProfile  user={user} />}
      {isCompany && <CompanyProfile user={user} setPhotoUrl={setPhotoUrl} />}
      {!isAdmin && !isCompany && <StudentProfile user={user} setPhotoUrl={setPhotoUrl} />}
    </AppLayout>
  )
}

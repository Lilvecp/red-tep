import { useEffect, useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, Clock, Camera, Loader, Lock, LockOpen, Medal, CheckCircle, Film, Briefcase, Star, Wrench, ClipboardList, X, Globe, Check, FileText, Send, ImagePlus, AlertTriangle } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { Avatar, Badge, Chip, BtnGreen, BtnOutline, ProgressBar, SectionTitle, StatCard, EmptyState, BadgePill } from '../components/ui/index'
import { workerService, companyService, adminService, ofertaService, eventoService, mediaService, followService, progresoService, postService, authService, badgeService } from '../services/index'
import useAuthStore from '../store/authStore'

const C = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }
const inp = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none', marginTop:3, boxSizing:'border-box' }
const lbl = { fontSize:'.75rem', color:'var(--text2)', fontWeight:500 }

const BANNER_PRESETS = [
  'linear-gradient(135deg, #3B6EDC 0%, #1e2d54 100%)',
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
  const [myBadges, setMyBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({})
  const [progresoSections, setProgresoSections] = useState([]) // dynamic sections from DB
  const [progresosEditMap, setProgresosEditMap] = useState({}) // {sectionId: porcentaje} during edit
  const [habilidadesEdit, setHabilidadesEdit] = useState([])
  const [modalidad, setModalidad] = useState(null)
  const [posts,         setPosts]         = useState([])
  const [postText,      setPostText]      = useState('')
  const [postFile,      setPostFile]      = useState(null)
  const [postUploading, setPostUploading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileRef      = useRef()
  const filePhotoRef = useRef()

  useEffect(() => {
    Promise.all([
      workerService.getMe(),
      postService.getAll({ authorId: user.id }),
      progresoService.getAll(),
    ]).then(([w, m, pg]) => {
      const wd = w.data
      setWorker(wd)
      setModalidad(wd.modalidad || null)
      // Build initial edit map from DB sections
      const sections = pg.data || []
      setProgresoSections(sections)
      const editMap = {}
      sections.forEach(s => { editMap[s.id] = s.porcentaje || 0 })
      setProgresosEditMap(editMap)
      setHabilidadesEdit(wd.habilidades?.map(h => ({ nombre: h.nombre, nivel: h.nivel || 3, categoria: h.categoria || 'Técnica' })) || [])
      setPosts(m.data)
      setForm({
        nombre:       user?.nombre    || '',
        especialidad: wd.especialidad || '',
        telefono:     wd.telefono     || '',
        curso:        wd.curso        || '',
        disponibilidad: wd.disponibilidad || '',
        pretensionRenta: wd.pretensionRenta || '',
        direccion:    wd.direccion    || '',
        experienciaPractica: wd.experienciaPractica || '',
        bannerColor:  wd.bannerColor  || '',
      })
    }).catch(() => toast.error('Error al cargar perfil'))
    .finally(() => setLoading(false))
    // Load badges separately so a missing table doesn't break the whole page
    badgeService.getMyBadges().then(r => setMyBadges(r.data)).catch(() => {})
  }, [])

  const handleSave = async () => {
    try {
      const promises = [
        workerService.updateMe({ ...form, habilidades: habilidadesEdit }),
        ...progresoSections.map(s =>
          progresoService.updateMe(s.id, progresosEditMap[s.id] ?? s.porcentaje)
            .catch(() => {})
        ),
      ]
      // Actualizar nombre si cambió
      if (form.nombre.trim() && form.nombre.trim() !== user?.nombre) {
        promises.push(
          authService.updateMe({ nombre: form.nombre.trim() })
            .then(r => useAuthStore.getState().login(r.data.user, r.data.token))
        )
      }
      const [res] = await Promise.all(promises)
      setWorker(res.data)
      setHabilidadesEdit(res.data.habilidades?.map(h => ({ nombre: h.nombre, nivel: h.nivel || 3, categoria: h.categoria || 'Técnica' })) || [])
      setForm(f => ({ ...f, bannerColor: res.data.bannerColor || f.bannerColor }))
      progresoService.getAll().then(pg => {
        const sections = pg.data || []
        setProgresoSections(sections)
        const editMap = {}
        sections.forEach(s => { editMap[s.id] = s.porcentaje || 0 })
        setProgresosEditMap(editMap)
      }).catch(() => {})
      setEditing(false)
      toast.success('Perfil actualizado')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar') }
  }

  const changeModalidad = async (next) => {
    if (worker?.modalidad === 'EGRESADO') return
    try {
      await workerService.setModalidad(next)
      setModalidad(next)
      const labels = { BUSCANDO_PRACTICA: 'Buscando práctica', BUSCANDO_TRABAJO: 'Buscando trabajo', null: 'No disponible' }
      toast.success(labels[next] || 'Estado actualizado')
    } catch { toast.error('Error al actualizar estado') }
  }

  const handlePublish = async () => {
    if (!postText.trim()) return toast.error('Escribe algo para publicar')
    setPostUploading(true)
    try {
      let mediaUrl, mediaType
      if (postFile) {
        const fd = new FormData()
        fd.append('file', postFile)
        const r = await mediaService.uploadUrl(fd)
        mediaUrl  = r.data.url
        mediaType = r.data.mediaType
      }
      const res = await postService.create({ content: postText, mediaUrl, mediaType })
      setPosts(prev => [res.data, ...prev])
      setPostText('')
      setPostFile(null)
      if (fileRef.current) fileRef.current.value = ''
      toast.success('Publicación creada')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al publicar') }
    finally { setPostUploading(false) }
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

  return (
    <div className="p-grid">
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
              {worker?.liceoValidado === 'APROBADO' && <Badge label="✓ Alumno C.E." color="green"/>}
              {worker?.liceoValidado === 'PENDIENTE' && <Badge label="C.E. pendiente" color="amber"/>}
              {worker?.liceoValidado === 'RECHAZADO' && <Badge label="C.E. rechazado" color="red"/>}
            </div>
          </div>
          <div style={{ padding:'1rem' }}>
            {[
              [Mail,   user?.email],
              [Phone,  worker?.telefono || 'No registrado'],
              [MapPin, worker?.direccion || 'No registrado'],
              [Clock,  worker?.disponibilidad || 'Por definir'],
            ].map(([Icon, val]) => (
              <div key={val} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.76rem', color:'var(--text2)', marginBottom:'.45rem' }}>
                <Icon size={13} strokeWidth={1.8} />{val}
              </div>
            ))}
            {(modalidad === 'BUSCANDO_TRABAJO' || modalidad === 'EGRESADO') && worker?.pretensionRenta && (
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.76rem', color:'var(--text2)', marginBottom:'.45rem' }}>
                <Briefcase size={13} strokeWidth={1.8} />{worker.pretensionRenta}
              </div>
            )}
            {modalidad === 'EGRESADO' && worker?.anioEgreso && (
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.76rem', color:'#f59e0b', marginBottom:'.45rem', fontWeight:600 }}>
                <Star size={13} strokeWidth={1.8} />Egresado {worker.anioEgreso}
              </div>
            )}
            {/* Estado laboral / modalidad */}
            <div style={{ marginTop:'.75rem', paddingTop:'.75rem', borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:'.4rem' }}>Estado laboral</div>
              {worker?.modalidad === 'EGRESADO' ? (
                <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', borderRadius:8, padding:'7px 10px' }}>
                  <span style={{ fontSize:'.74rem', color:'#f59e0b', fontWeight:600 }}>
                    Egresado {worker.anioEgreso} ✓
                  </span>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {[
                    { value: null,                label: 'No disponible',     color: 'var(--text3)' },
                    { value: 'BUSCANDO_PRACTICA', label: 'Buscando práctica', color: '#3B6EDC' },
                    { value: 'BUSCANDO_TRABAJO',  label: 'Buscando trabajo',  color: 'rgba(34,197,94,.9)' },
                  ].map(opt => (
                    <button
                      key={String(opt.value)}
                      onClick={() => changeModalidad(opt.value)}
                      style={{
                        display:'flex', alignItems:'center', gap:8, width:'100%',
                        background: modalidad === opt.value ? `${opt.color}18` : 'rgba(255,255,255,.04)',
                        border: `1px solid ${modalidad === opt.value ? `${opt.color}44` : 'var(--border)'}`,
                        borderRadius:7, padding:'6px 10px', cursor:'pointer', transition:'all .2s',
                      }}
                    >
                      <div style={{
                        width:10, height:10, borderRadius:'50%',
                        background: modalidad === opt.value ? opt.color : 'var(--surface2)',
                        border: `1.5px solid ${modalidad === opt.value ? opt.color : 'var(--border2)'}`,
                        flexShrink:0,
                      }}/>
                      <span style={{ fontSize:'.74rem', color: modalidad === opt.value ? opt.color : 'var(--text3)', fontWeight: modalidad === opt.value ? 600 : 400 }}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Solicitar egreso */}
            {worker?.modalidad !== 'EGRESADO' && (
              <div style={{ marginTop:'.5rem', paddingTop:'.5rem', borderTop:'1px solid var(--border)' }}>
                {worker?.egresadoSolicitado ? (
                  <div style={{ textAlign:'center', fontSize:'.72rem', color:'var(--amber-lit)', padding:'.5rem', background:'var(--amber-bg)', borderRadius:8 }}>
                    ⏳ Solicitud de egreso en revisión
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        await workerService.requestEgreso()
                        setWorker(w => ({ ...w, egresadoSolicitado: true }))
                        toast.success('Solicitud de egreso enviada al administrador')
                      } catch (err) { toast.error(err.response?.data?.error || 'Error al enviar solicitud') }
                    }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:8, padding:'7px 10px', cursor:'pointer', color:'#f59e0b', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.76rem', fontWeight:500 }}
                  >
                    Solicitar confirmación de egreso
                  </button>
                )}
              </div>
            )}

            {/* Validación liceo */}
            {(!worker?.liceoValidado || worker?.liceoValidado === 'RECHAZADO') && (
              <div style={{ marginTop:'.75rem', paddingTop:'.75rem', borderTop:'1px solid var(--border)' }}>
                <button
                  onClick={async () => {
                    try {
                      await workerService.requestLiceo()
                      setWorker(w => ({ ...w, liceoValidado: 'PENDIENTE' }))
                      toast.success('Solicitud enviada al administrador')
                    } catch (err) { toast.error(err.response?.data?.error || 'Error al enviar solicitud') }
                  }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', background:'rgba(77,160,232,.1)', border:'1px solid rgba(77,160,232,.25)', borderRadius:8, padding:'7px 10px', cursor:'pointer', color:'#3B6EDC', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.76rem', fontWeight:500 }}
                >
                  Solicitar validación del Centro Educacional
                </button>
              </div>
            )}

            {/* Acceso rápido al CV */}
            <div style={{ marginTop:'.75rem', paddingTop:'.75rem', borderTop:'1px solid var(--border)' }}>
              <button
                onClick={() => window.open('/mi-cv', '_blank')}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%',
                  background:'var(--green)', border:'none', borderRadius:8, padding:'8px 10px',
                  cursor:'pointer', color:'#fff', fontFamily:"'Figtree','DM Sans',sans-serif",
                  fontSize:'.78rem', fontWeight:600, transition:'opacity .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity='.85'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
              >
                <FileText size={14}/> Ver mi CV / Descargar PDF
              </button>
            </div>
          </div>
        </div>

        {/* Progreso formativo — dinámico desde DB */}
        <div style={{ ...C, ...(modalidad === 'BUSCANDO_PRACTICA' && { border:'1px solid rgba(59,110,220,.3)', boxShadow:'0 0 0 3px rgba(59,110,220,.06)' }) }}>
          <SectionTitle>Progreso Formativo</SectionTitle>
          {progresoSections.length === 0 ? (
            <div style={{ fontSize:'.78rem', color:'var(--text3)' }}>Sin secciones de progreso configuradas.</div>
          ) : progresoSections.map(s => {
            const val     = s.porcentaje || 0
            const isPend  = s.insigniaEstado === 'PENDIENTE'
            const isAprov = s.insigniaEstado === 'APROBADA'
            return (
              <div key={s.id} style={{ marginBottom:'.55rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem', marginBottom:3 }}>
                  <span style={{ color:'var(--text2)' }}>{s.nombre}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:4, color: isAprov ? 'var(--amber-lit)' : val >= 100 ? 'var(--green-lit)' : 'var(--text2)' }}>
                    <span>{val}%</span>
                    {isAprov && <Medal size={10} />}
                    {isPend  && <span style={{ color:'#3B6EDC', fontSize:'.6rem' }}>⏳</span>}
                    {!isAprov && !isPend && val >= 100 && <LockOpen size={10}/>}
                  </div>
                </div>
                <div style={{ height:5, borderRadius:3, background:'var(--surface2)' }}>
                  <div style={{ height:5, borderRadius:3, background: isAprov ? 'var(--amber)' : 'var(--green-mid)', width:`${val}%`, transition:'width .3s' }}/>
                </div>
              </div>
            )
          })}
        </div>

        {/* Insignias otorgadas por el admin */}
        <div style={C}>
          <SectionTitle>Insignias</SectionTitle>
          {myBadges.length === 0 ? (
            <div style={{ fontSize:'.78rem', color:'var(--text3)' }}>Aún no tienes insignias. El administrador puede otorgarte una.</div>
          ) : (
            <>
              <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:'.75rem', lineHeight:1.5 }}>
                Haz clic en una insignia para mostrarla u ocultarla en tu perfil público.
              </div>
              <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                {myBadges.map(award => (
                  <BadgePill
                    key={award.id}
                    award={award}
                    onToggle={async (id) => {
                      try {
                        const r = await badgeService.toggleVisibility(id)
                        setMyBadges(prev => prev.map(a => a.id === id ? r.data : a))
                      } catch { toast.error('Error al actualizar') }
                    }}
                  />
                ))}
              </div>
            </>
          )}
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
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Nombres y apellidos</label>
              <input style={inp} value={form.nombre||''} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Tu nombre completo"/>
            </div>
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
              <input
                list="disp-worker-opts"
                style={inp}
                value={form.disponibilidad||''}
                onChange={e=>setForm({...form,disponibilidad:e.target.value})}
                placeholder="Ej: Tardes, fines de semana, tiempo completo..."
              />
              <datalist id="disp-worker-opts">
                {['Tiempo completo','Medio tiempo','Fines de semana','Solo tardes','Solo mañanas','Por turnos','Por definir'].map(o=><option key={o} value={o}/>)}
              </datalist>
            </div>
            {(modalidad === 'BUSCANDO_TRABAJO' || modalidad === 'EGRESADO') && (
              <div style={{ marginBottom:'.75rem' }}>
                <label style={lbl}>Pretensión de renta (opcional)</label>
                <input
                  style={inp}
                  value={form.pretensionRenta || ''}
                  onChange={e => setForm({...form, pretensionRenta: e.target.value})}
                  placeholder="Ej: $500.000 mensual, a convenir..."
                />
              </div>
            )}
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

            {progresoSections.length > 0 && (
              <div style={{ marginTop:'1rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                <label style={{ ...lbl, marginBottom:8, display:'block' }}>Progreso formativo</label>
                <div style={{ fontSize:'.7rem', color:'var(--text3)', marginBottom:'.75rem' }}>
                  Al llegar al 100% se genera automáticamente una solicitud de insignia para el administrador.
                </div>
                {progresoSections.map(s => {
                  const val     = progresosEditMap[s.id] ?? s.porcentaje ?? 0
                  const isAprov = s.insigniaEstado === 'APROBADA'
                  const isPend  = s.insigniaEstado === 'PENDIENTE'
                  return (
                    <div key={s.id} style={{ marginBottom:'.75rem' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:'.78rem', color:'var(--text2)' }}>
                          {s.nombre}
                          {isAprov && <span style={{ fontSize:'.63rem', color:'var(--amber-lit)', marginLeft:6 }}>✔ Insignia obtenida</span>}
                          {isPend  && <span style={{ fontSize:'.63rem', color:'#3B6EDC', marginLeft:6 }}>⏳ Insignia en revisión</span>}
                        </span>
                        <span style={{ fontSize:'.78rem', color: val >= 100 ? 'var(--amber-lit)' : 'var(--green-lit)', fontWeight:500 }}>{val}%</span>
                      </div>
                      <input
                        type="range" min={0} max={100} step={5}
                        value={val}
                        disabled={isAprov || isPend}
                        onChange={e => setProgresosEditMap(m => ({ ...m, [s.id]: Number(e.target.value) }))}
                        style={{ width:'100%', accentColor:'var(--green-mid)', opacity: isAprov || isPend ? .5 : 1 }}
                      />
                    </div>
                  )
                })}
              </div>
            )}
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

        {/* Publicaciones */}
        <div style={C}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.9rem', color:'var(--text)', marginBottom:'1rem' }}>Publicaciones</div>

          {/* Compositor */}
          <div style={{ marginBottom:'1rem', background:'var(--surface2)', borderRadius:10, padding:'1rem', border:'1px solid var(--border)' }}>
            <textarea
              style={{ ...inp, resize:'vertical', minHeight:72 }}
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder="¿Qué quieres compartir con la red?"
            />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display:'none' }}
                  onChange={e => setPostFile(e.target.files[0] || null)} />
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:'.75rem', cursor:'pointer' }}
                >
                  <ImagePlus size={13}/> {postFile ? postFile.name.slice(0,24) : 'Adjuntar media'}
                </button>
                {postFile && (
                  <button onClick={() => { setPostFile(null); if (fileRef.current) fileRef.current.value = '' }}
                    style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}>
                    <X size={13}/>
                  </button>
                )}
              </div>
              <BtnGreen onClick={handlePublish} disabled={postUploading} style={{ fontSize:'.75rem', padding:'5px 14px', display:'flex', alignItems:'center', gap:5 }}>
                {postUploading ? <Loader size={13}/> : <><Send size={12}/> Publicar</>}
              </BtnGreen>
            </div>
          </div>

          {/* Lista de publicaciones */}
          {posts.length === 0 ? (
            <EmptyState icon={Film} message="Aún no has creado publicaciones"/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {posts.map(p => (
                <div key={p.id} style={{ background:'var(--surface2)', borderRadius:10, padding:'1rem', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'.83rem', color:'var(--text)', lineHeight:1.55, marginBottom: p.mediaUrl ? '.65rem' : 0 }}>{p.content}</div>
                  {p.mediaUrl && (
                    p.mediaType === 'video'
                      ? <video src={p.mediaUrl} controls style={{ width:'100%', maxHeight:220, borderRadius:8, objectFit:'cover', marginBottom:'.5rem' }}/>
                      : <img src={p.mediaUrl} alt="" style={{ width:'100%', maxHeight:220, borderRadius:8, objectFit:'cover', marginBottom:'.5rem' }}/>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'.4rem' }}>
                    <span style={{ fontSize:'.68rem', color:'var(--text3)' }}>{new Date(p.createdAt).toLocaleDateString('es-CL')}</span>
                    <button
                      onClick={async () => {
                        try { await postService.remove(p.id); setPosts(prev => prev.filter(x => x.id !== p.id)); toast.success('Publicación eliminada') }
                        catch { toast.error('Error al eliminar') }
                      }}
                      style={{ background:'none', border:'none', color:'rgba(239,68,68,.5)', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}
                    >
                      <X size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Postulaciones — solo visible para el propio usuario */}
        {user?.id === worker?.userId && (
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
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// PERFIL EMPRESA
// ═══════════════════════════════════════════════════════
const BLANK_OFERTA = { cargo:'', descripcion:'', especialidadRequerida:'', comuna:'', disponibilidad:'', salario:'', horario:'', imagenUrl:'' }
const DISPONIBILIDAD_OPTS = ['Tiempo completo', 'Medio tiempo', 'Fines de semana', 'Por turnos', 'Por definir']

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
  const [ofImgPreview,    setOfImgPreview]    = useState(null)
  const [ofImgUploading,  setOfImgUploading]  = useState(false)
  const fileLogoRef = useRef()
  const fileOfImgRef = useRef()

  useEffect(() => {
    Promise.all([companyService.getMe(), followService.getMyStats()])
      .then(([c, fs]) => {
        setCompany(c.data)
        setOfertas(c.data.ofertas || [])
        setFollowStats(fs.data)
        setForm({
          nombre:        user?.nombre         || '',
          nombreEmpresa: c.data.nombreEmpresa || '',
          rut:           c.data.rut           || '',
          rubro:         c.data.rubro         || '',
          comuna:        c.data.comuna        || '',
          telefono:      c.data.telefono      || '',
          sitioWeb:      c.data.sitioWeb      || '',
          bannerColor:   c.data.bannerColor   || '',
        })
      })
      .catch(e => { console.error(e); toast.error('Error al cargar perfil') })
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
      const promises = [companyService.updateMe(form)]
      if (form.nombre.trim() && form.nombre.trim() !== user?.nombre) {
        promises.push(
          authService.updateMe({ nombre: form.nombre.trim() })
            .then(r => useAuthStore.getState().login(r.data.user, r.data.token))
        )
      }
      const [res] = await Promise.all(promises)
      setCompany(res.data)
      setEditing(false)
      toast.success('Perfil actualizado')
    } catch { toast.error('Error al guardar') }
  }

  const handleOfImgChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setOfImgPreview(URL.createObjectURL(file))
    setOfImgUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await mediaService.uploadUrl(fd)
      setOfForm(f => ({ ...f, imagenUrl: r.data.url }))
    } catch { toast.error('Error al subir imagen') }
    finally { setOfImgUploading(false); e.target.value = '' }
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
      setOfImgPreview(null)
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
    <div>
      {/* Banner: empresa no verificada */}
      {!company?.verified && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.3)', borderRadius:12, padding:'.9rem 1.25rem', marginBottom:'1.1rem' }}>
          <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink:0, marginTop:2 }}/>
          <div>
            <span style={{ fontSize:'.82rem', color:'#f59e0b', fontWeight:600 }}>Empresa no verificada. </span>
            <span style={{ fontSize:'.80rem', color:'var(--text2)' }}>
              Tu empresa aún no está verificada por el colegio. Las empresas verificadas generan mayor confianza y aparecen destacadas ante los estudiantes.
              {!company?.verificationRequested && ' Puedes solicitarlo desde tu tarjeta de perfil.'}
            </span>
          </div>
        </div>
      )}
    <div className="p-grid">
      {/* Columna izquierda */}
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div style={{ ...C, padding:0, overflow:'hidden' }}>
          <div style={{ background: form.bannerColor || 'linear-gradient(160deg, #3B6EDC 0%, #1e2d54 100%)', padding:'1.5rem', textAlign:'center', position:'relative' }}>
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
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Nombre del contacto (tuyo)</label>
              <input style={inp} value={form.nombre||''} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Tu nombre completo"/>
            </div>
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
                  {o.imagenUrl && (
                    <img src={o.imagenUrl} alt="" style={{ width:44, height:44, borderRadius:7, objectFit:'cover', flexShrink:0 }}/>
                  )}
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.85rem', color:'var(--text)', marginBottom:'.15rem' }}>{o.cargo}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--text2)' }}>
                      {[o.especialidadRequerida, o.disponibilidad, `${o.postulaciones?.length||0} postulantes`].filter(Boolean).join(' · ')}
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
        <div onClick={e=>{ if(e.target===e.currentTarget){ setModal(false); setOfImgPreview(null) }}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:'2rem', width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.1rem', color:'var(--text)', marginBottom:'1.5rem' }}>Publicar nueva oferta</div>

            {/* Imagen opcional */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={lbl}>Imagen de portada (opcional)</label>
              <input ref={fileOfImgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleOfImgChange}/>
              {ofImgPreview ? (
                <div style={{ position:'relative', marginTop:6, borderRadius:8, overflow:'hidden', height:120 }}>
                  <img src={ofImgPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                  <button onClick={()=>{ setOfImgPreview(null); setOfForm(f=>({...f,imagenUrl:''})) }} style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,.6)', border:'none', color:'#fff', borderRadius:'50%', width:22, height:22, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                  {ofImgUploading && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'.78rem' }}>Subiendo...</div>}
                </div>
              ) : (
                <button onClick={()=>fileOfImgRef.current?.click()} style={{ display:'flex', alignItems:'center', gap:7, marginTop:6, padding:'8px 14px', background:'var(--surface2)', border:'1px dashed var(--border2)', borderRadius:8, color:'var(--text2)', cursor:'pointer', fontSize:'.8rem' }}>
                  <ImagePlus size={14}/> Agregar imagen
                </button>
              )}
            </div>

            {[['Cargo / Título del puesto','cargo'],['Especialidad requerida','especialidadRequerida'],['Comuna','comuna'],['Salario','salario'],['Horario','horario']].map(([label, key]) => (
              <div key={key} style={{ marginBottom:'.75rem' }}>
                <label style={lbl}>{label}</label>
                <input style={inp} value={ofForm[key]||''} onChange={e=>setOfForm({...ofForm,[key]:e.target.value})} placeholder={label}/>
              </div>
            ))}
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Disponibilidad</label>
              <input
                list="disp-oferta-opts"
                style={inp}
                value={ofForm.disponibilidad||''}
                onChange={e=>setOfForm({...ofForm,disponibilidad:e.target.value})}
                placeholder="Ej: Tiempo completo, lunes a viernes..."
              />
              <datalist id="disp-oferta-opts">
                {DISPONIBILIDAD_OPTS.map(o=><option key={o} value={o}/>)}
              </datalist>
            </div>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={lbl}>Descripción</label>
              <textarea style={{ ...inp, resize:'vertical', minHeight:80 }} value={ofForm.descripcion||''} onChange={e=>setOfForm({...ofForm,descripcion:e.target.value})} placeholder="Descripción del cargo..."/>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <BtnOutline onClick={() => { setModal(false); setOfForm(BLANK_OFERTA); setOfImgPreview(null) }}>Cancelar</BtnOutline>
              <BtnGreen onClick={handleCreateOferta} disabled={saving || !ofForm.cargo || ofImgUploading}>{saving ? 'Publicando...' : 'Publicar oferta'}</BtnGreen>
            </div>
          </div>
        </div>
      )}
    </div>
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
      <div className="g-3">
        <StatCard num={metrics?.trabajadores?.total||0} label="Estudiantes activos"/>
        <StatCard num={metrics?.empresas?.aprobadas||0} label="Empresas" color="var(--amber-lit)"/>
        <StatCard num={metrics?.ofertas||0} label="Ofertas activas"/>
      </div>

      <div className="admin-g2">
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

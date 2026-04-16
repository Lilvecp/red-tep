import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ClipboardList, Image, X, Trash2 } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { BtnGreen, BtnOutline, Badge, EmptyState } from '../../components/ui'
import { ofertaService, companyService, mediaService } from '../../services'

const BLANK = { cargo:'', descripcion:'', especialidadRequerida:'', comuna:'', disponibilidad:'', salario:'', horario:'', imagenUrl:'' }

const DISPONIBILIDAD_OPTS = ['Tiempo completo', 'Medio tiempo', 'Fines de semana', 'Por turnos', 'Por definir']

export default function MisOfertasPage() {
  const [ofertas,       setOfertas]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modal,         setModal]         = useState(false)
  const [form,          setForm]          = useState(BLANK)
  const [saving,        setSaving]        = useState(false)
  const [imgPreview,      setImgPreview]      = useState(null)
  const [imgUploading,    setImgUploading]    = useState(false)
  const [company,         setCompany]         = useState(null)
  const [candidatosModal, setCandidatosModal] = useState(null)
  const [candidatos,      setCandidatos]      = useState([])
  const [loadingCandidatos, setLoadingCandidatos] = useState(false)
  const imgRef = useRef()
  const navigate = useNavigate()

  const openCandidatos = async (o) => {
    setCandidatosModal({ ofertaId: o.id, cargo: o.cargo })
    setLoadingCandidatos(true)
    try {
      const res = await ofertaService.getPostulaciones(o.id)
      setCandidatos(res.data)
    } catch { toast.error('Error al cargar candidatos') }
    finally { setLoadingCandidatos(false) }
  }

  const load = () =>
    companyService.getMe()
      .then(r => { setCompany(r.data); setOfertas(r.data.ofertas || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleImgChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImgPreview(URL.createObjectURL(file))
    setImgUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const { data } = await mediaService.uploadUrl(fd)
      setForm(f => ({ ...f, imagenUrl: data.url }))
    } catch { toast.error('Error al subir imagen') }
    finally { setImgUploading(false); e.target.value = '' }
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      await ofertaService.create(form)
      toast.success('Oferta publicada')
      setModal(false); setForm(BLANK); setImgPreview(null); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error al publicar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (o) => {
    if (!window.confirm(`¿Eliminar la oferta "${o.cargo}"? Esta acción no se puede deshacer.`)) return
    try {
      await ofertaService.remove(o.id)
      toast.success('Oferta eliminada')
      setOfertas(prev => prev.filter(x => x.id !== o.id))
    } catch { toast.error('Error al eliminar la oferta') }
  }

  const toggleActiva = async (o) => {
    try {
      await ofertaService.update(o.id, { activa: !o.activa })
      toast.success(o.activa ? 'Oferta desactivada' : 'Oferta activada')
      load()
    } catch { toast.error('Error al actualizar') }
  }

  const handleDeleteFeedback = async () => {
    try {
      await companyService.deleteFeedback()
      setCompany(c => ({ ...c, adminFeedback: null }))
      toast.success('Retroalimentación eliminada')
    } catch { toast.error('Error al eliminar') }
  }

  const inp = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none', marginTop:3, boxSizing:'border-box' }
  const lbl = { fontSize:'.75rem', color:'var(--text2)', fontWeight:500 }

  return (
    <AppLayout title="Mis Ofertas Laborales"
      actions={<BtnGreen onClick={() => setModal(true)}>+ Nueva oferta</BtnGreen>}
    >
      {company?.adminFeedback && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(77,160,232,.07)', border:'1px solid rgba(77,160,232,.2)', borderRadius:10, padding:'.8rem 1rem', marginBottom:'1rem' }}>
          <div style={{ flex:1, fontSize:'.82rem', color:'var(--text2)', lineHeight:1.5 }}>
            <span style={{ fontWeight:600, color:'var(--text)', display:'block', fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>Comentario del administrador</span>
            {company.adminFeedback}
          </div>
          <button
            onClick={handleDeleteFeedback}
            title="Borrar retroalimentación"
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:2, display:'flex', alignItems:'center', flexShrink:0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {loading ? (
        <div style={{ color:'var(--text2)' }}>Cargando...</div>
      ) : ofertas.length === 0 ? (
        <EmptyState icon={ClipboardList} message="No has publicado ninguna oferta todavía."/>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ofertas.map(o => (
            <div key={o.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem' }}>
              {o.imagenUrl && (
                <img src={o.imagenUrl} alt="" style={{ width:52, height:52, borderRadius:8, objectFit:'cover', flexShrink:0 }}/>
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.9rem', color:'var(--text)', marginBottom:'.2rem' }}>{o.cargo}</div>
                <div style={{ fontSize:'.75rem', color:'var(--text2)' }}>
                  {[o.especialidadRequerida, o.disponibilidad, `${o._count?.postulaciones||0} postulantes`].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button
                onClick={() => openCandidatos(o)}
                style={{ padding:'5px 12px', borderRadius:7, border:'1px solid var(--border2)', background:'var(--surface2)', color:'var(--text2)', fontSize:'.75rem', cursor:'pointer', fontFamily:"'Figtree',sans-serif", flexShrink:0 }}
              >
                👥 {o._count?.postulaciones || 0} candidatos
              </button>
              <Badge label={o.activa ? 'Activa' : 'Inactiva'} color={o.activa ? 'green' : 'gray'}/>
              <BtnOutline onClick={() => toggleActiva(o)} style={{ fontSize:'.75rem', padding:'5px 12px' }}>
                {o.activa ? 'Desactivar' : 'Activar'}
              </BtnOutline>
              <button
                onClick={() => handleDelete(o)}
                title="Eliminar oferta"
                style={{ background:'none', border:'1px solid rgba(239,68,68,.3)', borderRadius:7, padding:'5px 8px', cursor:'pointer', color:'rgba(239,68,68,.8)', display:'flex', alignItems:'center', transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,.08)'; e.currentTarget.style.borderColor='rgba(239,68,68,.6)' }}
                onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='rgba(239,68,68,.3)' }}
              >
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal candidatos */}
      {candidatosModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setCandidatosModal(null) }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
        >
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:'1.5rem', width:'100%', maxWidth:540, maxHeight:'80vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)' }}>
                Candidatos — {candidatosModal.cargo}
              </div>
              <button onClick={() => setCandidatosModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'1.4rem', lineHeight:1 }}>×</button>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {loadingCandidatos ? (
                <div style={{ color:'var(--text2)', textAlign:'center', padding:'2rem' }}>Cargando...</div>
              ) : candidatos.length === 0 ? (
                <div style={{ color:'var(--text3)', textAlign:'center', padding:'2rem', fontSize:'.85rem' }}>Aún no hay postulantes.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {candidatos.map(p => (
                    <div key={p.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'.9rem 1rem', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.8rem', color:'#fff', flexShrink:0 }}>
                        {(p.worker?.user?.nombre || 'E').slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:'.85rem', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.worker?.user?.nombre}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>{p.worker?.especialidad || 'Sin especialidad'}</div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button
                          onClick={() => window.open(`/trabajadores/${p.worker?.id}`, '_blank')}
                          style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--border2)', background:'var(--surface2)', color:'var(--text2)', fontSize:'.75rem', cursor:'pointer', fontFamily:"'Figtree',sans-serif" }}
                        >
                          Ver perfil
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(p.worker?.user?.email || '')
                            toast.success('Correo copiado al portapapeles')
                          }}
                          style={{ padding:'5px 10px', borderRadius:7, border:'none', background:'var(--green-mid)', color:'#fff', fontSize:'.75rem', cursor:'pointer', fontFamily:"'Figtree',sans-serif" }}
                        >
                          Contactar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva oferta */}
      {modal && (
        <div onClick={e=>{ if(e.target===e.currentTarget){ setModal(false); setImgPreview(null) }}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:'2rem', width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.1rem', color:'var(--text)', marginBottom:'1.5rem' }}>Publicar nueva oferta</div>

            {/* Imagen opcional */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={lbl}>Imagen de portada (opcional)</label>
              <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImgChange}/>
              {imgPreview ? (
                <div style={{ position:'relative', marginTop:6, borderRadius:8, overflow:'hidden', height:120 }}>
                  <img src={imgPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                  <button onClick={()=>{ setImgPreview(null); setForm(f=>({...f,imagenUrl:''})) }} style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,.6)', border:'none', color:'#fff', borderRadius:'50%', width:22, height:22, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                  {imgUploading && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'.78rem' }}>Subiendo...</div>}
                </div>
              ) : (
                <button onClick={()=>imgRef.current?.click()} style={{ display:'flex', alignItems:'center', gap:7, marginTop:6, padding:'8px 14px', background:'var(--surface2)', border:'1px dashed var(--border2)', borderRadius:8, color:'var(--text2)', cursor:'pointer', fontSize:'.8rem' }}>
                  <Image size={14}/> Agregar imagen
                </button>
              )}
            </div>

            {[['Cargo / Título del puesto','cargo'],['Especialidad requerida','especialidadRequerida'],['Comuna','comuna'],['Salario','salario'],['Horario','horario']].map(([label, key]) => (
              <div key={key} style={{ marginBottom:'.75rem' }}>
                <label style={lbl}>{label}</label>
                <input style={inp} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={label}/>
              </div>
            ))}

            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Disponibilidad</label>
              <input
                list="disp-opts"
                style={inp}
                value={form.disponibilidad||''}
                onChange={e=>setForm({...form,disponibilidad:e.target.value})}
                placeholder="Ej: Tiempo completo, lunes a viernes..."
              />
              <datalist id="disp-opts">
                {DISPONIBILIDAD_OPTS.map(o=><option key={o} value={o}/>)}
              </datalist>
            </div>

            <div style={{ marginBottom:'1.25rem' }}>
              <label style={lbl}>Descripción</label>
              <textarea style={{ ...inp, resize:'vertical', minHeight:80 }} value={form.descripcion||''} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Descripción del cargo..."/>
            </div>

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <BtnOutline onClick={() => { setModal(false); setForm(BLANK); setImgPreview(null) }}>Cancelar</BtnOutline>
              <BtnGreen onClick={handleCreate} disabled={saving || !form.cargo || imgUploading}>{saving ? 'Publicando...' : 'Publicar oferta'}</BtnGreen>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

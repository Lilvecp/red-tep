import { useEffect, useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Award, Plus, Pencil, Trash2, X, Search, Medal, Eye, EyeOff, ImagePlus, Loader } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { BtnGreen, BtnOutline, EmptyState } from '../../components/ui'
import { badgeService, adminService, mediaService } from '../../services'
import BadgePill from '../../components/ui/BadgePill'

// ─── Tooltip badge (reutilizable) ─────────────────────────────────────────────
// Exported so profiles can import it too
export { BadgePill }

const inp = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'Figtree',sans-serif", fontSize:'.85rem', outline:'none', boxSizing:'border-box' }
const lbl = { display:'block', fontSize:'.73rem', fontWeight:500, color:'var(--text2)', marginBottom:4 }

// ─── Template Form Modal ──────────────────────────────────────────────────────
function TemplateModal({ initial, onSave, onClose }) {
  const [form,      setForm]      = useState({ nombre: initial?.nombre || '', descripcion: initial?.descripcion || '', imagenUrl: initial?.imagenUrl || '' })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const handleImgUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await mediaService.uploadUrl(fd)
      setForm(f => ({ ...f, imagenUrl: r.data.url }))
    } catch { toast.error('Error al subir imagen') }
    finally { setUploading(false); e.target.value = '' }
  }

  const handleSave = () => {
    if (!form.nombre.trim() || !form.descripcion.trim())
      return toast.error('Nombre y descripción son obligatorios')
    onSave(form)
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', backdropFilter:'blur(3px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
    >
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1.5rem', width:'100%', maxWidth:420 }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.95rem', color:'var(--text)', marginBottom:'1.25rem' }}>
          {initial ? 'Editar insignia' : 'Nueva insignia'}
        </div>

        {/* Image */}
        <div style={{ marginBottom:'1rem', display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ flexShrink:0 }}>
            <div style={{ width:64, height:64, borderRadius:12, border:'1px solid var(--border)', background:'var(--surface2)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {form.imagenUrl
                ? <img src={form.imagenUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <Award size={26} color="var(--text3)" />
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ marginTop:6, width:64, display:'flex', alignItems:'center', justifyContent:'center', gap:4, padding:'4px 0', background:'none', border:'1px solid var(--border)', borderRadius:7, color:'var(--text3)', fontSize:'.65rem', cursor:'pointer' }}
            >
              {uploading ? <Loader size={10}/> : <ImagePlus size={10}/>} {uploading ? '...' : 'Imagen'}
            </button>
            {form.imagenUrl && (
              <button
                onClick={() => setForm(f => ({ ...f, imagenUrl: '' }))}
                style={{ marginTop:3, width:64, display:'flex', alignItems:'center', justifyContent:'center', gap:4, padding:'4px 0', background:'none', border:'none', color:'rgba(239,68,68,.6)', fontSize:'.62rem', cursor:'pointer' }}
              >
                <X size={9}/> Quitar
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImgUpload} />
          </div>

          <div style={{ flex:1 }}>
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Nombre de la insignia *</label>
              <input style={inp} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Mejor Proyecto, Liderazgo..." />
            </div>
            <div>
              <label style={lbl}>Descripción (se muestra en tooltip) *</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Describe qué representa esta insignia..."
                style={{ ...inp, resize:'vertical', minHeight:72 }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop:'.25rem', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text2)', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', cursor:'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'var(--green-mid)', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', fontWeight:600, cursor:'pointer' }}
          >
            {initial ? 'Guardar cambios' : 'Crear insignia'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ValidacionesPage ─────────────────────────────────────────────────────────
export default function ValidacionesPage() {
  const [templates, setTemplates] = useState([])
  const [awards,    setAwards]    = useState([])
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)

  // Template modal
  const [tModal,  setTModal]  = useState(null)  // null | 'new' | { template }

  // Award form
  const [selTemplate, setSelTemplate] = useState(null)
  const [userQ,       setUserQ]       = useState('')
  const [awarding,    setAwarding]    = useState(false)

  // Tab
  const [tab, setTab] = useState('templates') // 'templates' | 'awards'

  const load = async () => {
    try {
      const [t, a, u] = await Promise.allSettled([
        badgeService.getTemplates(),
        badgeService.getAllAwards(),
        adminService.getAllUsers(),
      ])
      if (t.status === 'fulfilled') setTemplates(t.value.data)
      if (a.status === 'fulfilled') setAwards(a.value.data)
      if (u.status === 'fulfilled') setUsers(u.value.data)
      if (t.status === 'rejected' || a.status === 'rejected') {
        toast.error('Migración pendiente: ejecuta npx prisma migrate dev --name add_badge_system', { duration: 6000 })
      }
    } catch { toast.error('Error al cargar datos') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // ── Template handlers ──
  const handleCreateTemplate = async (form) => {
    try {
      const r = await badgeService.createTemplate(form)
      setTemplates(prev => [...prev, r.data])
      setTModal(null)
      toast.success('Insignia creada')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear') }
  }

  const handleUpdateTemplate = async (form) => {
    const id = tModal.template.id
    try {
      const r = await badgeService.updateTemplate(id, form)
      setTemplates(prev => prev.map(t => t.id === id ? r.data : t))
      setTModal(null)
      toast.success('Insignia actualizada')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al actualizar') }
  }

  const handleDeleteTemplate = async (t) => {
    if (!window.confirm(`¿Eliminar la insignia "${t.nombre}"? Se revocará de todos los usuarios.`)) return
    try {
      await badgeService.deleteTemplate(t.id)
      setTemplates(prev => prev.filter(x => x.id !== t.id))
      setAwards(prev => prev.filter(a => a.templateId !== t.id))
      toast.success('Insignia eliminada')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al eliminar') }
  }

  // ── Award handlers ──
  const handleAward = async (userId) => {
    if (!selTemplate) return toast.error('Selecciona una insignia primero')
    setAwarding(true)
    try {
      const r = await badgeService.awardBadge({ templateId: selTemplate.id, userId })
      setAwards(prev => {
        const exists = prev.find(a => a.id === r.data.id)
        return exists ? prev : [r.data, ...prev]
      })
      toast.success(`Insignia "${selTemplate.nombre}" otorgada`)
    } catch (err) { toast.error(err.response?.data?.error || 'Error al otorgar') }
    finally { setAwarding(false) }
  }

  const handleRevoke = async (award) => {
    if (!window.confirm(`¿Revocar "${award.template?.nombre}" de ${award.user?.nombre}?`)) return
    try {
      await badgeService.revokeAward(award.id)
      setAwards(prev => prev.filter(a => a.id !== award.id))
      toast.success('Insignia revocada')
    } catch (err) { toast.error(err.response?.data?.error || 'Error al revocar') }
  }

  // Filtered users for award
  const filteredUsers = users.filter(u =>
    !userQ.trim() ||
    u.nombre.toLowerCase().includes(userQ.toLowerCase()) ||
    u.email.toLowerCase().includes(userQ.toLowerCase())
  ).slice(0, 12)

  // Awards enriched with template name (for display)
  const awardsByTemplate = templates.map(t => ({
    ...t,
    recipients: awards.filter(a => a.templateId === t.id),
  }))

  if (loading) return <AppLayout title="Insignias"><div style={{ color:'var(--text2)', padding:'2rem' }}>Cargando...</div></AppLayout>

  return (
    <AppLayout title="Sistema de Insignias">
      {/* Modals */}
      {tModal === 'new' && (
        <TemplateModal onSave={handleCreateTemplate} onClose={() => setTModal(null)} />
      )}
      {tModal && tModal !== 'new' && (
        <TemplateModal initial={tModal.template} onSave={handleUpdateTemplate} onClose={() => setTModal(null)} />
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:'1.25rem', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'.35rem .5rem', width:'fit-content' }}>
        {[
          { key:'templates', label:`Insignias (${templates.length})` },
          { key:'awards',    label:`Otorgadas (${awards.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ padding:'6px 18px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', fontWeight:500, background: tab === t.key ? 'var(--green-mid)' : 'transparent', color: tab === t.key ? '#fff' : 'var(--text2)', transition:'all .15s' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Templates ── */}
      {tab === 'templates' && (
        <div className="validacion-grid">

          {/* Template list */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <div style={{ fontSize:'.82rem', color:'var(--text2)' }}>
                Define las insignias que puedes otorgar a estudiantes y empresas.
              </div>
              <BtnGreen onClick={() => setTModal('new')} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.8rem', padding:'7px 14px' }}>
                <Plus size={13}/> Nueva insignia
              </BtnGreen>
            </div>

            {templates.length === 0 ? (
              <EmptyState icon={Award} message="No hay insignias creadas. Crea la primera." />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {templates.map(t => (
                  <div key={t.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:12 }}>
                    {/* Badge icon */}
                    <div style={{ width:52, height:52, borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {t.imagenUrl
                        ? <img src={t.imagenUrl} alt={t.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <Award size={22} color="var(--amber-lit)" />
                      }
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.88rem', color:'var(--text)' }}>{t.nombre}</div>
                      <div style={{ fontSize:'.75rem', color:'var(--text2)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.descripcion}</div>
                      <div style={{ fontSize:'.68rem', color:'var(--text3)', marginTop:3 }}>{t._count?.awards || 0} usuario(s) la tienen</div>
                    </div>

                    <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                      <button
                        onClick={() => setTModal({ template: t })}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)', background:'none', color:'var(--text2)', fontSize:'.75rem', cursor:'pointer' }}
                      >
                        <Pencil size={12}/>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.06)', color:'#ef4444', fontSize:'.75rem', cursor:'pointer' }}
                      >
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Award panel */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem', position:'sticky', top:'1rem', height:'fit-content' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.88rem', color:'var(--text)', marginBottom:'1rem' }}>Otorgar insignia</div>

            {/* Select template */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={lbl}>1. Selecciona la insignia a otorgar</label>
              {templates.length === 0 ? (
                <div style={{ fontSize:'.78rem', color:'var(--text3)' }}>Crea al menos una insignia primero.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelTemplate(selTemplate?.id === t.id ? null : t)}
                      style={{
                        display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                        borderRadius:8, border:`1px solid ${selTemplate?.id === t.id ? 'var(--green-mid)' : 'var(--border)'}`,
                        background: selTemplate?.id === t.id ? 'var(--green-glo)' : 'var(--surface2)',
                        cursor:'pointer', textAlign:'left',
                      }}
                    >
                      <div style={{ width:28, height:28, borderRadius:6, background:'var(--surface)', border:'1px solid var(--border)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {t.imagenUrl ? <img src={t.imagenUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Award size={13} color="var(--amber-lit)" />}
                      </div>
                      <span style={{ fontSize:'.8rem', color: selTemplate?.id === t.id ? 'var(--green-lit)' : 'var(--text)', fontWeight: selTemplate?.id === t.id ? 600 : 400 }}>{t.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selTemplate && (
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                <label style={lbl}>2. Busca y selecciona el usuario</label>
                <input
                  value={userQ}
                  onChange={e => setUserQ(e.target.value)}
                  placeholder="Nombre o correo..."
                  style={{ ...inp, marginBottom:8 }}
                />
                <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:220, overflowY:'auto' }}>
                  {filteredUsers.length === 0 && (
                    <div style={{ fontSize:'.78rem', color:'var(--text3)', padding:'.5rem 0' }}>Sin resultados</div>
                  )}
                  {filteredUsers.map(u => {
                    const alreadyHas = awards.some(a => a.templateId === selTemplate.id && a.userId === u.id)
                    return (
                      <div key={u.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', borderRadius:8, padding:'.5rem .75rem' }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'.8rem', fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.nombre}</div>
                          <div style={{ fontSize:'.68rem', color:'var(--text3)' }}>{u.role}</div>
                        </div>
                        {alreadyHas ? (
                          <span style={{ fontSize:'.68rem', color:'var(--green-lit)', padding:'2px 8px', borderRadius:8, background:'var(--green-glo)', flexShrink:0 }}>Ya la tiene</span>
                        ) : (
                          <button
                            onClick={() => handleAward(u.id)}
                            disabled={awarding}
                            style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'var(--green-mid)', color:'#fff', fontSize:'.72rem', fontWeight:600, cursor:'pointer', flexShrink:0, opacity: awarding ? .6 : 1 }}
                          >
                            + Otorgar
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Awards ── */}
      {tab === 'awards' && (
        <div>
          {awards.length === 0 ? (
            <EmptyState icon={Medal} message="Ninguna insignia otorgada todavía." />
          ) : (
            awardsByTemplate.filter(t => t.recipients.length > 0).map(t => (
              <div key={t.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'.75rem' }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {t.imagenUrl ? <img src={t.imagenUrl} alt={t.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Award size={16} color="var(--amber-lit)" />}
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.87rem', color:'var(--text)' }}>{t.nombre}</div>
                    <div style={{ fontSize:'.7rem', color:'var(--text3)' }}>{t.recipients.length} usuario(s)</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {t.recipients.map(a => (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', borderRadius:8, padding:'.5rem .9rem' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text)' }}>{a.user?.nombre || '—'}</span>
                        <span style={{ fontSize:'.72rem', color:'var(--text3)', marginLeft:8 }}>{a.user?.email}</span>
                        {!a.visible && <span style={{ fontSize:'.65rem', color:'var(--text3)', marginLeft:8 }}>(oculta)</span>}
                      </div>
                      <button
                        onClick={() => handleRevoke(a)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:7, border:'1px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.06)', color:'#ef4444', fontSize:'.72rem', cursor:'pointer', flexShrink:0 }}
                      >
                        <X size={11}/> Revocar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </AppLayout>
  )
}

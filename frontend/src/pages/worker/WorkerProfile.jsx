import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Wrench, Briefcase } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { Avatar, Badge, Chip, BtnGreen, BtnOutline, ProgressBar, SectionTitle, StatCard, EmptyState } from '../../components/ui'
import { workerService } from '../../services'
import useAuthStore from '../../store/authStore'

const C = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }

export default function WorkerProfile() {
  const { user } = useAuthStore()
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    workerService.getMe()
      .then(r => { setWorker(r.data); setForm({ especialidad: r.data.especialidad||'', telefono: r.data.telefono||'', curso: r.data.curso||'', disponibilidad: r.data.disponibilidad||'', experienciaPractica: r.data.experienciaPractica||'' }) })
      .catch(() => toast.error('Error al cargar perfil'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      const res = await workerService.updateMe(form)
      setWorker(res.data)
      setEditing(false)
      toast.success('Perfil actualizado')
    } catch { toast.error('Error al guardar') }
  }

  if (loading) return <AppLayout title="Mi Perfil"><div style={{ color:'var(--text2)', padding:'2rem' }}>Cargando...</div></AppLayout>

  const nombre = user?.nombre || ''
  const initials = nombre.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()

  return (
    <AppLayout title="Mi Perfil Técnico"
      actions={
        editing
          ? <><BtnOutline onClick={()=>setEditing(false)}>Cancelar</BtnOutline><BtnGreen onClick={handleSave} style={{marginLeft:8}}>Guardar</BtnGreen></>
          : <BtnGreen onClick={()=>setEditing(true)}>Editar perfil</BtnGreen>
      }
    >
      <div style={{ display:'grid', gridTemplateColumns:'290px 1fr', gap:'1.25rem' }}>
        {/* Columna izquierda */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {/* Tarjeta principal */}
          <div style={{ ...C, padding:0, overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,var(--green) 0%,var(--bg3) 100%)', padding:'1.5rem', textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,.15)', border:'3px solid rgba(255,255,255,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:'1.2rem', color:'#fff', margin:'0 auto 1rem' }}>{initials}</div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1rem', color:'#fff' }}>{nombre}</div>
              <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.65)', marginTop:'.2rem' }}>{worker?.especialidad || 'Sin especialidad'} · {worker?.curso || 'Sin curso'}</div>
              <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:'.75rem' }}>
                {worker?.validaciones?.length > 0 && <Badge label="✓ Validado" color="green"/>}
                {worker?.perfilCompleto && <Badge label="Perfil completo" color="amber"/>}
              </div>
            </div>
            <div style={{ padding:'1.1rem' }}>
              {[['📍','Lo Espejo, Santiago'],['📧', user?.email],['📞', worker?.telefono||'No registrado'],['🕐', worker?.disponibilidad?.replace(/_/g,' ')||'Por definir']].map(([icon,val]) => (
                <div key={icon} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.78rem', color:'var(--text2)', marginBottom:'.5rem' }}>
                  <span style={{ fontSize:'.82rem' }}>{icon}</span>{val}
                </div>
              ))}
            </div>
          </div>

          {/* Progreso formativo */}
          <div style={C}>
            <SectionTitle>Progreso Formativo</SectionTitle>
            <ProgressBar label="Perfil técnico"    value={worker?.perfilCompleto ? 100 : 40}/>
            <ProgressBar label="Habilidades"        value={Math.min(worker?.habilidades?.length * 20, 100)}/>
            <ProgressBar label="Validaciones"       value={Math.min(worker?.validaciones?.length * 33, 100)}/>
            <ProgressBar label="Experiencia"        value={worker?.experienciaPractica ? 100 : 0}/>
          </div>

          {/* Insignias */}
          <div style={C}>
            <SectionTitle>Insignias</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
              {[
                { tipo:'PERFIL_COMPLETO',      icon:'🏅', label:'Perfil' },
                { tipo:'VALIDADO_POR_PROFESOR',icon:'✅', label:'Validado' },
                { tipo:'EXPERIENCIA_PRACTICA', icon:'🎬', label:'Práctica' },
                { tipo:'PRIMERA_POSTULACION',  icon:'💼', label:'1ª Post.' },
                { tipo:'TOP_CANDIDATO',        icon:'⭐', label:'Top' },
              ].map(({ tipo, icon, label }) => {
                const earned = worker?.insignias?.some(i => i.tipo === tipo)
                return (
                  <div key={tipo} style={{ background: earned ? 'var(--amber-bg)' : 'var(--surface2)', border:`1px solid ${earned ? 'rgba(212,160,23,.3)' : 'var(--border)'}`, borderRadius:8, padding:'.55rem', textAlign:'center' }}>
                    <div style={{ fontSize:'1.1rem' }}>{earned ? icon : '🔒'}</div>
                    <div style={{ fontSize:'.6rem', color: earned ? 'var(--amber-lit)' : 'var(--text3)', marginTop:2 }}>{label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {/* Habilidades técnicas */}
          <div style={C}>
            <SectionTitle>Habilidades Técnicas</SectionTitle>
            {worker?.habilidades?.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <tbody>
                  {worker.habilidades.map(h => (
                    <tr key={h.id}>
                      <td style={{ padding:'.45rem .25rem', fontSize:'.8rem', color:'var(--text)', width:'38%' }}>{h.nombre}</td>
                      <td style={{ padding:'.45rem .25rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:5, borderRadius:3, background:'var(--surface2)' }}>
                            <div style={{ height:5, borderRadius:3, background:'var(--green-mid)', width:`${(h.nivel||3)*20}%` }}/>
                          </div>
                          <span style={{ fontSize:'.65rem', color:'var(--text3)', minWidth:30 }}>{(h.nivel||3)*20}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'.45rem .25rem' }}><Chip label={h.categoria} active={h.categoria==='Técnica'}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState icon={Wrench} message="Sin habilidades registradas. Edita tu perfil para agregarlas."/>}
          </div>


          {/* Edición rápida */}
          {editing && (
            <div style={C}>
              <SectionTitle>Editar información</SectionTitle>
              {[
                { label:'Especialidad', key:'especialidad', placeholder:'Electricidad, Gastronomía...' },
                { label:'Curso',        key:'curso',        placeholder:'4to Medio TP, 3er EPJA...' },
                { label:'Teléfono',     key:'telefono',     placeholder:'+56 9 XXXX XXXX' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ marginBottom:'.75rem' }}>
                  <label style={{ display:'block', fontSize:'.75rem', fontWeight:500, marginBottom:4, color:'var(--text2)' }}>{label}</label>
                  <input style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none' }}
                    value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder}/>
                </div>
              ))}
              <div style={{ marginBottom:'.75rem' }}>
                <label style={{ display:'block', fontSize:'.75rem', fontWeight:500, marginBottom:4, color:'var(--text2)' }}>Disponibilidad</label>
                <select style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none' }}
                  value={form.disponibilidad||''} onChange={e=>setForm({...form,disponibilidad:e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {['TIEMPO_COMPLETO','MEDIO_TIEMPO','FINES_DE_SEMANA','POR_DEFINIR'].map(d=>(<option key={d} value={d}>{d.replace(/_/g,' ')}</option>))}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'.75rem', fontWeight:500, marginBottom:4, color:'var(--text2)' }}>Experiencia práctica</label>
                <textarea style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none', resize:'vertical', minHeight:80 }}
                  value={form.experienciaPractica||''} onChange={e=>setForm({...form,experienciaPractica:e.target.value})} placeholder="Describe tu experiencia práctica..."/>
              </div>
            </div>
          )}

          {/* Postulaciones recientes */}
          <div style={C}>
            <SectionTitle>Postulaciones Recientes</SectionTitle>
            {worker?.postulaciones?.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {worker.postulaciones.slice(0,5).map(p => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', borderRadius:8, padding:'.7rem 1rem' }}>
                    <div>
                      <div style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text)' }}>{p.oferta?.cargo}</div>
                      <div style={{ fontSize:'.72rem', color:'var(--text2)' }}>{p.oferta?.company?.nombreEmpresa}</div>
                    </div>
                    <Badge label={p.estado} color={p.estado==='ACEPTADO'?'green':p.estado==='RECHAZADO'?'red':'amber'}/>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={Briefcase} message="Aún no has postulado a ninguna oferta."/>}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

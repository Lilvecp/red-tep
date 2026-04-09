import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Users } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { Avatar, Badge, BtnGreen, BtnOutline, EmptyState } from '../../components/ui'
import { adminService } from '../../services'

const COMPETENCIAS = ['Responsabilidad','Proactividad','Trabajo en equipo','Puntualidad','Comunicación','Iniciativa','Resolución de problemas']
const NIVELES      = ['BAJO','MEDIO','ALTO']

export default function ValidacionesPage() {
  const [workers, setWorkers]   = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState({ competencia:'', nivel:'MEDIO', observacion:'' })
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    adminService.getWorkers()
      .then(r => setWorkers(r.data))
      .catch(() => toast.error('Error al cargar trabajadores'))
      .finally(() => setLoading(false))
  }, [])

  const handleValidar = async () => {
    if (!selected || !form.competencia) return toast.error('Selecciona un trabajador y una competencia')
    setSaving(true)
    try {
      await adminService.createValidacion({ workerId: selected.id, ...form })
      toast.success(`Competencia "${form.competencia}" validada para ${selected.user?.nombre}`)
      // Refrescar validaciones del seleccionado
      const updated = workers.map(w => w.id === selected.id
        ? { ...w, validaciones: [...(w.validaciones||[]), { competencia:form.competencia, nivel:form.nivel }] }
        : w)
      setWorkers(updated)
      setSelected(updated.find(w => w.id === selected.id))
      setForm({ competencia:'', nivel:'MEDIO', observacion:'' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al validar')
    } finally { setSaving(false) }
  }

  return (
    <AppLayout title="Validación de Competencias">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1.25rem' }}>
        {/* Lista de trabajadores */}
        <div>
          <div style={{ fontSize:'.82rem', color:'var(--text2)', marginBottom:'1rem' }}>
            Selecciona un trabajador para validar sus competencias.
          </div>
          {loading ? (
            <div style={{ color:'var(--text2)' }}>Cargando...</div>
          ) : workers.length === 0 ? (
            <EmptyState icon={Users} message="No hay trabajadores registrados."/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {workers.map(w => (
                <div key={w.id}
                  style={{ background:'var(--surface)', border:`1px solid ${selected?.id===w.id?'var(--green-mid)':'var(--border)'}`, borderRadius:12, padding:'1rem', cursor:'pointer', transition:'all .2s', display:'flex', alignItems:'center', gap:10 }}
                  onClick={() => setSelected(w)}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--green-mid)'}
                  onMouseLeave={e=>{ if(selected?.id!==w.id) e.currentTarget.style.borderColor='var(--border)' }}
                >
                  <Avatar nombre={w.user?.nombre} size={38}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'.85rem', color:'var(--text)' }}>{w.user?.nombre}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--text2)' }}>{w.especialidad} · {w.curso}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'flex-end' }}>
                    <Badge label={`${w.validaciones?.length||0} validaciones`} color={w.validaciones?.length>0?'green':'gray'}/>
                    {w.perfilCompleto && <Badge label="Perfil completo" color="amber"/>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de validación */}
        <div>
          {selected ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem', position:'sticky', top:'1rem' }}>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.88rem', color:'var(--text)', marginBottom:'1rem' }}>
                Validar a {selected.user?.nombre}
              </div>

              {/* Validaciones existentes */}
              {selected.validaciones?.length > 0 && (
                <div style={{ marginBottom:'1rem' }}>
                  <div style={{ fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.06em', color:'var(--text3)', marginBottom:'.5rem' }}>Ya validadas</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {selected.validaciones.map((v,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', background:'var(--surface2)', borderRadius:7, padding:'.45rem .75rem' }}>
                        <span style={{ fontSize:'.78rem', color:'var(--text2)' }}>{v.competencia}</span>
                        <Badge label={v.nivel} color={v.nivel==='ALTO'?'green':v.nivel==='MEDIO'?'amber':'gray'}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario */}
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                <div style={{ marginBottom:'.75rem' }}>
                  <label style={{ display:'block', fontSize:'.75rem', fontWeight:500, marginBottom:4, color:'var(--text2)' }}>Competencia</label>
                  <select value={form.competencia} onChange={e=>setForm({...form,competencia:e.target.value})}
                    style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none' }}>
                    <option value="">Seleccionar...</option>
                    {COMPETENCIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom:'.75rem' }}>
                  <label style={{ display:'block', fontSize:'.75rem', fontWeight:500, marginBottom:4, color:'var(--text2)' }}>Nivel</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {NIVELES.map(n => (
                      <button key={n} type="button" onClick={() => setForm({...form,nivel:n})}
                        style={{ flex:1, padding:'7px', borderRadius:7, border:`1px solid ${form.nivel===n?'var(--green-mid)':'var(--border)'}`, background: form.nivel===n?'var(--green-glo)':'var(--surface2)', color: form.nivel===n?'var(--green-lit)':'var(--text2)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.75rem', cursor:'pointer' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:'1rem' }}>
                  <label style={{ display:'block', fontSize:'.75rem', fontWeight:500, marginBottom:4, color:'var(--text2)' }}>Observación (opcional)</label>
                  <textarea value={form.observacion} onChange={e=>setForm({...form,observacion:e.target.value})}
                    style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none', resize:'vertical', minHeight:60 }}
                    placeholder="Comentario sobre el desempeño..."/>
                </div>

                <BtnGreen onClick={handleValidar} disabled={saving || !form.competencia} style={{ width:'100%', padding:'10px' }}>
                  {saving ? 'Validando...' : 'Registrar validación'}
                </BtnGreen>
              </div>
            </div>
          ) : (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'2rem', textAlign:'center' }}>
              <div style={{ fontSize:'2rem', marginBottom:'1rem' }}>👈</div>
              <div style={{ fontSize:'.88rem', color:'var(--text2)' }}>Selecciona un trabajador de la lista para validar sus competencias.</div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

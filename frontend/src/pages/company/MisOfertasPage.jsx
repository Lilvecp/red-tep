import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { ClipboardList } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { BtnGreen, BtnOutline, Badge, EmptyState } from '../../components/ui'
import { ofertaService } from '../../services'

const BLANK = { cargo:'', descripcion:'', especialidadRequerida:'', comuna:'', disponibilidad:'', salario:'', horario:'' }

export default function MisOfertasPage() {
  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(BLANK)
  const [saving, setSaving]   = useState(false)

  const load = () => ofertaService.getAll().then(r => setOfertas(r.data)).catch(()=>{}).finally(()=>setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await ofertaService.create(form)
      toast.success('Oferta publicada')
      setModal(false); setForm(BLANK); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error al publicar') }
    finally { setSaving(false) }
  }

  const toggleActiva = async (o) => {
    try {
      await ofertaService.update(o.id, { activa: !o.activa })
      toast.success(o.activa ? 'Oferta desactivada' : 'Oferta activada')
      load()
    } catch { toast.error('Error al actualizar') }
  }

  const inputStyle = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none', marginTop:3 }

  return (
    <AppLayout title="Mis Ofertas Laborales"
      actions={<BtnGreen onClick={() => setModal(true)}>+ Nueva oferta</BtnGreen>}
    >
      {loading ? (
        <div style={{ color:'var(--text2)' }}>Cargando...</div>
      ) : ofertas.length === 0 ? (
        <EmptyState icon={ClipboardList} message="No has publicado ninguna oferta todavía."/>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ofertas.map(o => (
            <div key={o.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.9rem', color:'var(--text)', marginBottom:'.2rem' }}>{o.cargo}</div>
                <div style={{ fontSize:'.75rem', color:'var(--text2)' }}>{o.especialidadRequerida} · {o.disponibilidad?.replace(/_/g,' ')} · {o.postulaciones?.length||0} postulantes</div>
              </div>
              <Badge label={o.activa ? 'Activa' : 'Inactiva'} color={o.activa ? 'green' : 'gray'}/>
              <BtnOutline onClick={() => toggleActiva(o)} style={{ fontSize:'.75rem', padding:'5px 12px' }}>
                {o.activa ? 'Desactivar' : 'Activar'}
              </BtnOutline>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva oferta */}
      {modal && (
        <div onClick={e=>{ if(e.target===e.currentTarget) setModal(false) }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:'2rem', width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.1rem', color:'var(--text)', marginBottom:'1.5rem' }}>Publicar nueva oferta</div>
            {[['Cargo / Título del puesto','cargo','text'],['Especialidad requerida','especialidadRequerida','text'],['Comuna','comuna','text'],['Salario','salario','text'],['Horario','horario','text']].map(([lbl,key]) => (
              <div key={key} style={{ marginBottom:'.75rem' }}>
                <label style={{ fontSize:'.75rem', color:'var(--text2)', fontWeight:500 }}>{lbl}</label>
                <input style={inputStyle} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={lbl}/>
              </div>
            ))}
            <div style={{ marginBottom:'.75rem' }}>
              <label style={{ fontSize:'.75rem', color:'var(--text2)', fontWeight:500 }}>Disponibilidad</label>
              <select style={inputStyle} value={form.disponibilidad||''} onChange={e=>setForm({...form,disponibilidad:e.target.value})}>
                <option value="">Seleccionar...</option>
                {['TIEMPO_COMPLETO','MEDIO_TIEMPO','FINES_DE_SEMANA'].map(d=><option key={d} value={d}>{d.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:'.75rem', color:'var(--text2)', fontWeight:500 }}>Descripción</label>
              <textarea style={{ ...inputStyle, resize:'vertical', minHeight:80 }} value={form.descripcion||''} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Descripción del cargo..."/>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <BtnOutline onClick={() => { setModal(false); setForm(BLANK) }}>Cancelar</BtnOutline>
              <BtnGreen onClick={handleCreate} disabled={saving || !form.cargo}>{saving ? 'Publicando...' : 'Publicar oferta'}</BtnGreen>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

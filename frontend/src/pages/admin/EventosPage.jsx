import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Calendar } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { BtnGreen, BtnOutline, EmptyState } from '../../components/ui'
import { eventoService } from '../../services'

const BLANK = { titulo:'', descripcion:'', fecha:'', lugar:'' }

export default function EventosPage() {
  const [eventos, setEventos] = useState([])
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(BLANK)
  const [saving, setSaving]   = useState(false)

  const load = () => eventoService.getAll().then(r => setEventos(r.data)).catch(()=>{})
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.titulo || !form.fecha) return toast.error('Título y fecha son requeridos')
    setSaving(true)
    try {
      await eventoService.create(form)
      toast.success('Evento creado')
      setModal(false); setForm(BLANK); load()
    } catch (err) { toast.error(err.response?.data?.error||'Error al crear evento') }
    finally { setSaving(false) }
  }

  const handleRemove = async (id) => {
    try {
      await eventoService.remove(id)
      toast.success('Evento eliminado')
      load()
    } catch { toast.error('Error al eliminar') }
  }

  const inp = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:7, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.85rem', outline:'none', marginTop:3 }
  const lbl = { fontSize:'.75rem', color:'var(--text2)', fontWeight:500 }

  return (
    <AppLayout title="Gestión de Eventos"
      actions={<BtnGreen onClick={() => setModal(true)}>+ Crear evento</BtnGreen>}
    >
      {eventos.length === 0 ? (
        <EmptyState icon={Calendar} message="No hay eventos programados."/>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
          {eventos.map(e => {
            const d = new Date(e.fecha)
            return (
              <div key={e.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }}>
                <div style={{ display:'flex', gap:10, marginBottom:'1rem' }}>
                  <div style={{ background:'var(--green)', borderRadius:8, padding:'.4rem .65rem', textAlign:'center', minWidth:44, flexShrink:0 }}>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.1rem', color:'#fff' }}>{d.getDate()}</div>
                    <div style={{ fontSize:'.6rem', color:'rgba(255,255,255,.65)' }}>{d.toLocaleString('es',{month:'short'}).toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.88rem', color:'var(--text)' }}>{e.titulo}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--text2)' }}>{e.lugar}</div>
                  </div>
                </div>
                {e.descripcion && <p style={{ fontSize:'.78rem', color:'var(--text2)', lineHeight:1.6, marginBottom:'.75rem' }}>{e.descripcion}</p>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'.65rem', color:'var(--text3)' }}>Por: {e.creadoPor}</span>
                  <button onClick={() => handleRemove(e.id)} style={{ background:'var(--red-bg)', border:'1px solid rgba(224,82,82,.3)', color:'var(--red)', fontSize:'.7rem', padding:'3px 9px', borderRadius:6, cursor:'pointer', fontFamily:"'Figtree','DM Sans',sans-serif" }}>Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div onClick={e=>{ if(e.target===e.currentTarget) setModal(false) }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:'2rem', width:'100%', maxWidth:460 }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.1rem', color:'var(--text)', marginBottom:'1.5rem' }}>Crear nuevo evento</div>
            {[['Título del evento','titulo','text'],['Lugar','lugar','text']].map(([l,k,t])=>(
              <div key={k} style={{ marginBottom:'.75rem' }}>
                <label style={lbl}>{l}</label>
                <input type={t} style={inp} value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l}/>
              </div>
            ))}
            <div style={{ marginBottom:'.75rem' }}>
              <label style={lbl}>Fecha y hora</label>
              <input type="datetime-local" style={inp} value={form.fecha||''} onChange={e=>setForm({...form,fecha:e.target.value})}/>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={lbl}>Descripción</label>
              <textarea style={{ ...inp, resize:'vertical', minHeight:70 }} value={form.descripcion||''} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Descripción del evento..."/>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <BtnOutline onClick={()=>{ setModal(false); setForm(BLANK) }}>Cancelar</BtnOutline>
              <BtnGreen onClick={handleCreate} disabled={saving}>{saving?'Creando...':'Crear evento'}</BtnGreen>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

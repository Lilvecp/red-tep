import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { BtnGreen, EmptyState } from '../../components/ui'
import { ofertaService } from '../../services'

export default function OfertasPage() {
  const nav = useNavigate()
  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ especialidad:'' })

  const load = () => {
    setLoading(true)
    ofertaService.getAll(filters)
      .then(r => setOfertas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <AppLayout title="Oportunidades Laborales">
      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <input placeholder="Especialidad..." value={filters.especialidad} onChange={e=>setFilters({...filters,especialidad:e.target.value})}
          style={{ padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.82rem', outline:'none', width:180 }}/>
<BtnGreen onClick={load} style={{ padding:'8px 16px' }}>Buscar</BtnGreen>
        <span style={{ marginLeft:'auto', fontSize:'.8rem', color:'var(--text2)', alignSelf:'center' }}>{ofertas.length} resultados</span>
      </div>

      {loading ? (
        <div style={{ color:'var(--text2)', padding:'2rem' }}>Cargando...</div>
      ) : ofertas.length === 0 ? (
        <EmptyState icon={Briefcase} message="No hay ofertas disponibles con esos filtros."/>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ofertas.map(o => (
            <div key={o.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem', cursor:'pointer', transition:'border-color .2s' }}
              onClick={() => nav(`/ofertas/${o.id}`)}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--green-mid)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
            >
              <div style={{ width:42, height:42, borderRadius:10, background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.8rem', color:'#fff', flexShrink:0 }}>
                {(o.company?.nombreEmpresa||'E').slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.9rem', color:'var(--text)', marginBottom:'.2rem' }}>{o.cargo}</div>
                <div style={{ fontSize:'.75rem', color:'var(--text2)' }}>{o.company?.nombreEmpresa} · {o.comuna||'Lo Espejo'}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {o.salario && <span style={{ background:'var(--amber-bg)', border:'1px solid rgba(212,160,23,.3)', color:'var(--amber-lit)', fontSize:'.68rem', padding:'3px 8px', borderRadius:8 }}>{o.salario}</span>}
                {o.disponibilidad && <span style={{ background:'var(--surface2)', color:'var(--text2)', fontSize:'.68rem', padding:'3px 8px', borderRadius:8 }}>{o.disponibilidad}</span>}
              </div>
              <span style={{ color:'var(--green-lit)', fontSize:'.8rem', flexShrink:0 }}>Ver →</span>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}

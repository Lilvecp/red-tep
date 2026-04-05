import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import AppLayout from '../../components/layout/AppLayout'
import { BtnGreen, BtnOutline, Badge, EmptyState } from '../../components/ui'
import { ofertaService } from '../../services'

export default function OfertaDetalle() {
  const { id } = useParams()
  const nav     = useNavigate()
  const [oferta, setOferta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    ofertaService.getById(id)
      .then(r => setOferta(r.data))
      .catch(() => toast.error('Oferta no encontrada'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePostular = async () => {
    setPosting(true)
    try {
      await ofertaService.postular(id)
      toast.success('¡Postulación enviada!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al postular')
    } finally { setPosting(false) }
  }

  if (loading) return <AppLayout title="Oferta"><div style={{ color:'var(--text2)', padding:'2rem' }}>Cargando...</div></AppLayout>
  if (!oferta) return <AppLayout title="Oferta"><EmptyState icon="❌" message="Oferta no encontrada"/></AppLayout>

  return (
    <AppLayout title="Oportunidad Laboral"
      actions={<BtnOutline onClick={() => nav('/ofertas')}>← Volver</BtnOutline>}
    >
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'1.25rem' }}>
        {/* Main */}
        <div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'1.75rem' }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
              <div
                style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}
                onClick={() => nav(`/empresas/${oferta.company?.userId}`)}
              >
                <div style={{ width:44, height:44, borderRadius:10, background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.85rem', color:'#fff', overflow:'hidden' }}>
                  {oferta.company?.logoUrl
                    ? <img src={oferta.company.logoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : (oferta.company?.nombreEmpresa||'E').slice(0,2).toUpperCase()
                  }
                </div>
                <div>
                  <div style={{ fontSize:'.82rem', fontWeight:600, color:'var(--text)' }}>{oferta.company?.nombreEmpresa}</div>
                  <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>{oferta.company?.comuna || 'Lo Espejo'}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <BtnOutline onClick={() => nav(`/empresas/${oferta.company?.userId}`)}>Ver empresa</BtnOutline>
                <BtnGreen onClick={handlePostular} disabled={posting}>{posting ? 'Enviando...' : 'Postular Ahora'}</BtnGreen>
              </div>
            </div>

            <h1 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:'1.6rem', color:'#fff', marginBottom:'.6rem' }}>{oferta.cargo}</h1>

            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1.25rem' }}>
              {oferta.salario && <span style={{ background:'var(--amber-bg)', border:'1px solid rgba(212,160,23,.3)', color:'var(--amber-lit)', fontSize:'.72rem', padding:'4px 10px', borderRadius:8 }}>{oferta.salario}</span>}
              {oferta.disponibilidad && <span style={{ background:'var(--surface2)', color:'var(--text2)', fontSize:'.72rem', padding:'4px 10px', borderRadius:8 }}>{oferta.disponibilidad.replace(/_/g,' ')}</span>}
              {oferta.horario && <span style={{ background:'var(--surface2)', color:'var(--text2)', fontSize:'.72rem', padding:'4px 10px', borderRadius:8 }}>{oferta.horario}</span>}
              {oferta.especialidadRequerida && <span style={{ background:'var(--green-glo)', border:'1px solid rgba(82,183,136,.25)', color:'var(--green-lit)', fontSize:'.72rem', padding:'4px 10px', borderRadius:8 }}>{oferta.especialidadRequerida}</span>}
            </div>

            {oferta.descripcion && (
              <>
                <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.88rem', color:'var(--text)', margin:'.8rem 0 .5rem' }}>Descripción</div>
                <p style={{ fontSize:'.85rem', color:'var(--text2)', lineHeight:1.7 }}>{oferta.descripcion}</p>
              </>
            )}

            {oferta.requisitos?.length > 0 && (
              <>
                <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.88rem', color:'var(--text)', margin:'.9rem 0 .5rem' }}>Requisitos técnicos</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {oferta.requisitos.map((r, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.82rem', color:'var(--text2)' }}>
                      <span style={{ color:'var(--green-lit)', flexShrink:0 }}>✓</span>{r}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.82rem', color:'var(--text)', marginBottom:'.75rem' }}>Detalles del cargo</div>
            {[
              ['Tipo', oferta.disponibilidad?.replace(/_/g,' ')],
              ['Horario', oferta.horario || 'Por definir'],
              ['Salario', oferta.salario || 'A convenir'],
              ['Especialidad', oferta.especialidadRequerida || 'Cualquiera'],
              ['Postulantes', oferta.postulaciones?.length || 0],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', padding:'.35rem 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ color:'var(--text3)' }}>{k}</span>
                <span style={{ color:'var(--text)', fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
          <BtnGreen onClick={handlePostular} disabled={posting} style={{ width:'100%', padding:12, fontSize:'.88rem' }}>
            {posting ? 'Enviando postulación...' : 'Postular a esta oferta'}
          </BtnGreen>
        </div>
      </div>
    </AppLayout>
  )
}

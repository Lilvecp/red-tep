import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import AppLayout from '../../components/layout/AppLayout'
import { Avatar, Badge, Chip, BtnGreen, EmptyState } from '../../components/ui'
import { workerService, filterService } from '../../services'

const DISP = ['TIEMPO_COMPLETO','MEDIO_TIEMPO','FINES_DE_SEMANA']

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CandidatosPage() {
  const navigate = useNavigate()
  const [workers,  setWorkers]  = useState([])
  const [specs,    setSpecs]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filters,  setFilters]  = useState({ especialidad: '', disponibilidad: '', nombre: '' })
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    workerService.search(filters)
      .then(r => setWorkers(r.data.results))
      .catch(() => toast.error('Error al cargar candidatos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    filterService.getAll('especialidad')
      .then(r => setSpecs(r.data.map(f => f.valor)))
      .catch(() => {})
    load()
  }, [])

  return (
    <AppLayout
      title="Explorar Candidatos"
      actions={<span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{workers.length} candidatos</span>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 252px', gap: '1.25rem' }}>

        {/* ── Lista de candidatos ── */}
        <div>
          {/* Búsqueda */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            <input
              placeholder="Buscar por nombre..."
              value={filters.nombre}
              onChange={e => setFilters({ ...filters, nombre: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') load() }}
              style={{
                flex: 1, padding: '8px 12px',
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: 8, color: 'var(--text)',
                fontFamily: "'Figtree','DM Sans',sans-serif", fontSize: '.82rem', outline: 'none',
              }}
            />
            <BtnGreen onClick={load} style={{ padding: '8px 16px' }}>Buscar</BtnGreen>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text2)', padding: '2rem', textAlign: 'center' }}>Cargando...</div>
          ) : workers.length === 0 ? (
            <EmptyState icon="👥" message="No hay candidatos con esos filtros." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {workers.map(w => (
                <div
                  key={w.id}
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${selected?.id === w.id ? 'var(--green-mid)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '1rem', cursor: 'pointer', transition: 'all .2s',
                  }}
                  onClick={() => setSelected(w)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-mid)'}
                  onMouseLeave={e => { if (selected?.id !== w.id) e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '.7rem' }}>
                    <Avatar nombre={w.user?.nombre} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.user?.nombre}
                      </div>
                      <div style={{ fontSize: '.7rem', color: 'var(--text2)' }}>
                        {w.especialidad}{w.curso ? ` · ${w.curso}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '.65rem' }}>
                    {w.habilidades?.slice(0, 2).map(h => <Chip key={h.id} label={h.nombre} />)}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.68rem', color: 'var(--green-lit)' }}>
                      {w.disponibilidad?.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/trabajadores/' + w.id) }}
                      style={{
                        background: 'var(--green-mid)', color: '#fff',
                        border: 'none', fontSize: '.7rem', padding: '4px 11px',
                        borderRadius: 7, cursor: 'pointer',
                        fontFamily: "'Figtree','DM Sans',sans-serif", fontWeight: 500,
                      }}
                    >
                      Ver perfil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar: filtros + preview ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Filtros */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem' }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', marginBottom: '1rem' }}>
              Filtros
            </div>

            <div style={{ marginBottom: '.9rem' }}>
              <div style={{ fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)', marginBottom: '.4rem' }}>
                Especialidad
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['Todos', ...specs].map(s => {
                  const val    = s === 'Todos' ? '' : s
                  const active = filters.especialidad === val
                  return (
                    <span
                      key={s}
                      onClick={() => setFilters({ ...filters, especialidad: val })}
                      style={{
                        background: active ? 'var(--green-glo)' : 'var(--surface2)',
                        border: `1px solid ${active ? 'rgba(77,160,232,.3)' : 'var(--border)'}`,
                        color: active ? 'var(--green-lit)' : 'var(--text2)',
                        fontSize: '.68rem', padding: '3px 8px', borderRadius: 10, cursor: 'pointer',
                      }}
                    >
                      {s}
                    </span>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)', marginBottom: '.4rem' }}>
                Disponibilidad
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['Todos', ...DISP].map(d => {
                  const val    = d === 'Todos' ? '' : d
                  const active = filters.disponibilidad === val
                  return (
                    <span
                      key={d}
                      onClick={() => setFilters({ ...filters, disponibilidad: val })}
                      style={{
                        background: active ? 'var(--green-glo)' : 'var(--surface2)',
                        border: `1px solid ${active ? 'rgba(77,160,232,.3)' : 'var(--border)'}`,
                        color: active ? 'var(--green-lit)' : 'var(--text2)',
                        fontSize: '.65rem', padding: '3px 8px', borderRadius: 10, cursor: 'pointer',
                      }}
                    >
                      {d.replace(/_/g, ' ')}
                    </span>
                  )
                })}
              </div>
            </div>

            <BtnGreen onClick={load} style={{ width: '100%', padding: '8px' }}>Aplicar filtros</BtnGreen>
          </div>

          {/* Preview del seleccionado */}
          {selected && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--green-mid)', borderRadius: 12, padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '.75rem' }}>
                <Avatar nombre={selected.user?.nombre} size={44} bg="var(--green)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text)' }}>{selected.user?.nombre}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{selected.especialidad}</div>
                </div>
              </div>
              {selected.experienciaPractica && (
                <p style={{ margin: '0 0 .75rem', fontSize: '.76rem', color: 'var(--text2)', lineHeight: 1.55 }}>
                  {selected.experienciaPractica.slice(0, 110)}{selected.experienciaPractica.length > 110 ? '...' : ''}
                </p>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => navigate('/trabajadores/' + selected.id)}
                  style={{
                    flex: 1, padding: '7px', borderRadius: 8, border: 'none',
                    background: 'var(--green-mid)', color: '#fff',
                    fontSize: '.78rem', cursor: 'pointer',
                    fontFamily: "'Figtree','DM Sans',sans-serif",
                  }}
                >
                  Ver perfil completo
                </button>
                <a
                  href={`mailto:${selected.user?.email}`}
                  style={{
                    flex: 1, padding: '7px', borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text2)',
                    fontSize: '.78rem', cursor: 'pointer', textAlign: 'center',
                    textDecoration: 'none', fontFamily: "'Figtree','DM Sans',sans-serif",
                  }}
                >
                  Contactar
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

    </AppLayout>
  )
}

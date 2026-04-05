import { useNavigate } from 'react-router-dom'

/* ─── Marca RT ──────────────────────────────────────────────────────────────── */
function BrandMark({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: 'linear-gradient(135deg, #2665b5, #ec4899)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Sora',sans-serif", fontWeight: 800,
      fontSize: size * 0.32, color: '#fff',
      flexShrink: 0, boxShadow: '0 4px 14px rgba(38,101,181,.45)',
    }}>RT</div>
  )
}

/* ─── Chip de badge ─────────────────────────────────────────────────────────── */
function Chip({ children, color = 'blue' }) {
  const styles = {
    blue: { bg: 'rgba(77,160,232,.12)', border: 'rgba(77,160,232,.28)', text: '#4da0e8' },
    pink: { bg: 'rgba(236,72,153,.12)', border: 'rgba(236,72,153,.28)', text: '#ec4899' },
    gold: { bg: 'rgba(240,188,56,.12)', border: 'rgba(240,188,56,.28)', text: '#f0bc38' },
  }
  const s = styles[color] || styles.blue
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.text, fontSize: '.67rem', fontWeight: 600,
      padding: '3px 10px', borderRadius: 20, letterSpacing: '.04em',
    }}>{children}</span>
  )
}

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Navegación ──────────────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem', height: 62,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(7,16,30,0.92)', backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={32} />
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.92rem', color: 'var(--text)' }}>RED TEP</div>
            <div style={{ fontSize: '.54rem', color: 'var(--text3)', lineHeight: 1, letterSpacing: '.02em' }}>C.E. Cardenal José María Caro</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => nav('/auth')} style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontFamily: "'Figtree',sans-serif", fontSize: '.83rem', cursor: 'pointer' }}>
            Iniciar sesión
          </button>
          <button onClick={() => nav('/auth?tab=register')} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'var(--green-mid)', color: '#fff', fontFamily: "'Figtree',sans-serif", fontSize: '.83rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(38,101,181,.35)' }}>
            Registrarse
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="bg-grid" style={{ position: 'relative', padding: '5rem 2.5rem 4rem', maxWidth: 1140, margin: '0 auto' }}>
        {/* Orb de luz azul */}
        <div style={{
          position: 'absolute', top: -60, right: '5%',
          width: 560, height: 560, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(38,101,181,.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>
        {/* Orb magenta */}
        <div style={{
          position: 'absolute', bottom: 0, left: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(190,24,93,.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'center', position: 'relative' }}>
          {/* Columna texto */}
          <div className="fade-up">
            {/* Badge institucional */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.4rem' }}>
              <Chip color="pink">Lo Espejo · Santiago</Chip>
              <Chip color="blue">Red Técnico · Empresa · Profesor</Chip>
            </div>

            <h1 style={{
              fontFamily: "'Sora',sans-serif", fontWeight: 800,
              fontSize: 'clamp(2.1rem,4.5vw,3.4rem)', lineHeight: 1.04,
              color: '#fff', marginBottom: '1.2rem', letterSpacing: '-.02em',
            }}>
              Tu talento técnico,<br />
              <span style={{
                background: 'linear-gradient(90deg, #4da0e8, #ec4899)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>visible y validado</span>
            </h1>

            <p style={{
              fontSize: '.98rem', fontWeight: 300, color: 'var(--text2)',
              lineHeight: 1.8, marginBottom: '2rem', maxWidth: 470,
            }}>
              La plataforma del C.E. Cardenal José María Caro que conecta
              estudiantes técnicos con empresas del territorio —
              con el respaldo de sus profesores.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: '2.8rem' }}>
              <button
                onClick={() => nav('/auth?tab=register')}
                style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #2665b5, #1a4f8c)',
                  color: '#fff', fontFamily: "'Figtree',sans-serif",
                  fontSize: '.92rem', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(38,101,181,.4)',
                  transition: 'transform .15s, box-shadow .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(38,101,181,.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';   e.currentTarget.style.boxShadow='0 6px 20px rgba(38,101,181,.4)' }}
              >
                Crear mi perfil
              </button>
              <button
                onClick={() => nav('/auth')}
                style={{
                  padding: '12px 28px', borderRadius: 10,
                  border: '1px solid var(--border2)',
                  background: 'rgba(255,255,255,.04)',
                  color: 'var(--text2)', fontFamily: "'Figtree',sans-serif",
                  fontSize: '.92rem', cursor: 'pointer', transition: 'border-color .15s, color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--green-lit)'; e.currentTarget.style.color='var(--green-lit)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border2)';   e.currentTarget.style.color='var(--text2)' }}
              >
                Ya tengo cuenta
              </button>
            </div>

            {/* Estadísticas */}
            <div style={{ display: 'flex', gap: '2.5rem' }}>
              {[['250+', 'Estudiantes', '#4da0e8'], ['50+', 'Empresas', '#ec4899'], ['4', 'Especialidades', '#f0bc38']].map(([n, l, c]) => (
                <div key={l}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: '1.6rem', fontWeight: 700, color: c }}>{n}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: 1 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna cards preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp .55s cubic-bezier(.16,1,.3,1) .12s forwards', opacity: 0 }}>

            {/* Card estudiante */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '1.2rem',
              boxShadow: '0 8px 32px rgba(0,0,0,.35)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '.85rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.85rem', color: '#fff' }}>AV</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.85rem', color: '#fff' }}>Andrés Ignacio Valenzuela</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text2)' }}>Técnico en Telecomunicaciones · Lo Espejo</div>
                </div>
                <Chip color="blue">✓ Validado</Chip>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {['Electricidad SCADA', 'Fibra Óptica', 'Redes TCP/IP', 'Ciberseguridad'].map(s => (
                  <span key={s} style={{ background: 'var(--surface2)', color: 'var(--text2)', fontSize: '.66rem', padding: '3px 9px', borderRadius: 10 }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Card métricas */}
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '1.2rem',
              boxShadow: '0 8px 32px rgba(0,0,0,.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.85rem' }}>
                <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.85rem', color: '#fff' }}>Panel RED TEP</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.65rem', color: '#4da0e8' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4da0e8', display: 'inline-block', animation: 'pulse-soft 2s infinite' }}/>
                  En vivo
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['452', 'Estudiantes', '#4da0e8'], ['58', 'Empresas', '#ec4899'], ['1.284', 'Postulaciones', '#f0bc38']].map(([n, l, c]) => (
                  <div key={l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.65rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '1rem', color: c }}>{n}</div>
                    <div style={{ fontSize: '.58rem', color: 'var(--text3)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insignia card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(38,101,181,.2), rgba(190,24,93,.12))',
              border: '1px solid rgba(77,160,232,.2)',
              borderRadius: 14, padding: '1rem 1.2rem',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: '1.6rem' }}>🏅</div>
              <div>
                <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#fff', marginBottom: 2 }}>Perfil Técnico Validado</div>
                <div style={{ fontSize: '.7rem', color: 'var(--text2)' }}>Certificado por el C.E. Cardenal José María Caro</div>
              </div>
              <Chip color="gold" style={{ marginLeft: 'auto' }}>Obtenida</Chip>
            </div>
          </div>
        </div>
      </div>

      {/* ── Divisor con gradiente ────────────────────────────────────────────── */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(77,160,232,.3), rgba(190,24,93,.3), transparent)' }}/>

      {/* ── Tres perfiles ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '4rem 2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.8rem' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--accent-lit)', marginBottom: '.6rem' }}>
            Para toda la comunidad educativa
          </div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(1.5rem,3vw,2.1rem)', fontWeight: 700, color: '#fff', letterSpacing: '-.015em' }}>
            Una red, tres perfiles
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {[
            { icon: '👷', title: 'Estudiante / Técnico', desc: 'Crea tu perfil técnico, sube evidencias de práctica, recibe validaciones de tus profesores y accede a oportunidades reales.', color: '#4da0e8', border: 'rgba(77,160,232,.25)' },
            { icon: '🏢', title: 'Empresa',              desc: 'Publica ofertas laborales, encuentra candidatos técnicos validados por el colegio y filtra por especialidad o disponibilidad.', color: '#ec4899', border: 'rgba(236,72,153,.25)' },
            { icon: '🏫', title: 'Administración',       desc: 'Gestiona la plataforma, valida competencias de estudiantes, aprueba empresas y monitorea el progreso académico.', color: '#f0bc38', border: 'rgba(240,188,56,.25)' },
          ].map(({ icon, title, desc, color, border }) => (
            <div
              key={title}
              style={{
                background: 'var(--surface)', border: `1px solid ${border}`,
                borderRadius: 16, padding: '1.75rem', cursor: 'default',
                transition: 'transform .2s, box-shadow .2s',
                boxShadow: '0 4px 20px rgba(0,0,0,.25)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 32px rgba(0,0,0,.35), 0 0 0 1px ${border}` }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.25)' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '1.1rem' }}>{icon}</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.9rem', color: '#fff', marginBottom: '.5rem' }}>{title}</div>
              <div style={{ fontSize: '.83rem', color: 'var(--text2)', lineHeight: 1.65 }}>{desc}</div>
              <div style={{ marginTop: '1.1rem', height: 2, borderRadius: 1, background: color, opacity: .5 }}/>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA final ────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(38,101,181,.12), rgba(190,24,93,.08))',
        border: '1px solid var(--border)',
        borderLeft: 'none', borderRight: 'none',
        padding: '4rem 2.5rem', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '.7rem', letterSpacing: '-.01em' }}>
            Únete a RED TEP hoy
          </div>
          <p style={{ color: 'var(--text2)', marginBottom: '1.75rem', fontSize: '.9rem', lineHeight: 1.7 }}>
            Centro Educacional Cardenal José María Caro · Lo Espejo, Santiago
          </p>
          <button
            onClick={() => nav('/auth?tab=register')}
            style={{
              padding: '13px 36px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #2665b5, #be185d)',
              color: '#fff', fontFamily: "'Figtree',sans-serif",
              fontSize: '.95rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(38,101,181,.4)',
              transition: 'opacity .15s, transform .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity='.9'; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)' }}
          >
            Crear mi cuenta gratis
          </button>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '1.25rem 2.5rem',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '.72rem', color: 'var(--text3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrandMark size={22} />
          <span>RED TEP — Red Técnico · Empresa · Profesor</span>
        </div>
        <span>C.E. Cardenal José María Caro · Lo Espejo · 2026</span>
      </footer>
    </div>
  )
}

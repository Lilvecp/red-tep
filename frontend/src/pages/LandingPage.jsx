import { useNavigate } from 'react-router-dom'
import { ArrowRight, GraduationCap, Building2, Shield, CheckCircle, Award, Users, Briefcase } from 'lucide-react'
import RedTEPLogo from '../components/brand/RedTEPLogo'

/* ─── Paleta unificada al feed ────────────────────────────────────────────────── */
const BLUE      = '#3B6EDC'   // azul principal (botones, highlights)
const BLUE_DARK = '#2F4FA3'   // azul navbar/hover
const BLUE_TEXT = '#3B6EDC'   // azul legible sobre fondo claro
const TEAL      = '#059669'

/* ─── Pill ────────────────────────────────────────────────────────────────────── */
function Pill({ children, variant = 'blue' }) {
  const v = {
    blue:  { bg: 'rgba(59,110,220,.08)',  bd: 'rgba(59,110,220,.22)', tx: BLUE_TEXT },
    teal:  { bg: 'rgba(5,150,105,.07)',  bd: 'rgba(5,150,105,.2)',  tx: '#059669' },
    gray:  { bg: 'rgba(0,0,0,.05)',      bd: 'rgba(0,0,0,.1)',      tx: '#6E6E73' },
    amber: { bg: 'rgba(217,119,6,.07)',  bd: 'rgba(217,119,6,.2)',  tx: '#D97706' },
  }[variant] || {}
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background:v.bg, border:`1px solid ${v.bd}`, color:v.tx,
      fontSize:'.67rem', fontWeight:600, padding:'3px 11px',
      borderRadius:20, letterSpacing:'.04em',
    }}>{children}</span>
  )
}

/* ─── Stat ────────────────────────────────────────────────────────────────────── */
function Stat({ n, label, accent }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{
        fontFamily:"'Sora',sans-serif", fontWeight:800,
        fontSize:'1.8rem', color: accent ? BLUE_TEXT : '#1F2937',
        lineHeight:1, letterSpacing:'-.02em',
      }}>{n}</div>
      <div style={{ fontSize:'.68rem', color:'#86868B', marginTop:5, letterSpacing:'.05em', textTransform:'uppercase' }}>{label}</div>
    </div>
  )
}

/* ─── Profile card (sección PARA TODA LA COMUNIDAD) ─────────────────────────── */
function ProfileCard({ icon: Icon, title, desc, active }) {
  return (
    <div style={{
      background: active ? 'rgba(59,110,220,.04)' : '#FFFFFF',
      border: `1px solid ${active ? 'rgba(59,110,220,.25)' : '#E5E7EB'}`,
      borderRadius: 20, padding: '2rem 1.75rem',
      boxShadow: active
        ? '0 4px 24px rgba(59,110,220,.12)'
        : '0 2px 12px rgba(0,0,0,.05)',
      transition: 'transform .25s, box-shadow .25s',
      cursor: 'default', position:'relative', overflow:'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,.10)' }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow = active ? '0 4px 24px rgba(59,110,220,.12)' : '0 2px 12px rgba(0,0,0,.05)' }}
    >
      <div style={{
        width:44, height:44, borderRadius:14, marginBottom:'1.25rem',
        background: active ? 'rgba(59,110,220,.1)' : '#F3F4F6',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon size={20} color={active ? BLUE_TEXT : '#6E6E73'} strokeWidth={1.6}/>
      </div>
      <div style={{
        fontFamily:"'Sora',sans-serif", fontWeight:700,
        fontSize:'.92rem', color:'#1F2937', marginBottom:'.65rem', letterSpacing:'-.01em',
      }}>{title}</div>
      <div style={{ fontSize:'.82rem', color:'#6E6E73', lineHeight:1.75, fontWeight:300 }}>{desc}</div>
    </div>
  )
}

/* ─── Mini feature (4 iconos inferiores) ────────────────────────────────────── */
function MiniFeature({ icon: Icon, label, sub }) {
  return (
    <div style={{
      background:'#FFFFFF', border:'1px solid #E5E7EB',
      borderRadius:14, padding:'1.25rem',
      boxShadow:'0 1px 6px rgba(0,0,0,.04)',
      transition:'box-shadow .2s, border-color .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(59,110,220,.1)'; e.currentTarget.style.borderColor='rgba(59,110,220,.2)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,.04)'; e.currentTarget.style.borderColor='#E5E7EB' }}
    >
      <Icon size={18} color={BLUE_TEXT} strokeWidth={1.6} style={{ marginBottom:'.7rem', display:'block' }}/>
      <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.83rem', color:'#1F2937', marginBottom:'.28rem' }}>{label}</div>
      <div style={{ fontSize:'.76rem', color:'#86868B', lineHeight:1.6 }}>{sub}</div>
    </div>
  )
}

/* ─── LandingPage ─────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div style={{ minHeight:'100vh', background:'#F5F7FB', overflow:'hidden', fontFamily:"'Figtree','DM Sans',sans-serif" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position:'sticky', top:0, zIndex:50,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 clamp(1.5rem,5vw,3rem)', height:64,
        background:'rgba(255,255,255,.88)', backdropFilter:'blur(24px)',
        borderBottom:'1px solid rgba(0,0,0,.07)',
      }}>
        <RedTEPLogo size={34} mode="inline" theme="light" />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => nav('/auth')} style={{
            padding:'7px 20px', borderRadius:8,
            border:'1px solid rgba(0,0,0,.1)',
            background:'transparent', color:'#6E6E73',
            fontFamily:"'Figtree',sans-serif", fontSize:'.83rem', cursor:'pointer',
            transition:'border-color .15s, color .15s',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(59,110,220,.3)'; e.currentTarget.style.color=BLUE_TEXT }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(0,0,0,.1)'; e.currentTarget.style.color='#6E6E73' }}
          >Iniciar sesión</button>
          <button onClick={() => nav('/auth?tab=register')} style={{
            padding:'7px 20px', borderRadius:8, border:'none',
            background:BLUE, color:'#fff',
            fontFamily:"'Figtree',sans-serif", fontSize:'.83rem', fontWeight:600,
            cursor:'pointer', boxShadow:`0 4px 14px rgba(59,130,246,.35)`,
            transition:'opacity .15s, transform .15s, box-shadow .15s',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.opacity='.9'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 6px 20px rgba(59,130,246,.5)` }}
            onMouseLeave={e=>{ e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 14px rgba(59,130,246,.35)` }}
          >Registrarse</button>
        </div>
      </nav>

      {/* ══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section style={{ position:'relative', zIndex:1, maxWidth:1140, margin:'0 auto', padding:'clamp(4rem,8vw,7rem) clamp(1.5rem,5vw,2.5rem) clamp(3rem,6vw,5rem)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(2rem,5vw,4.5rem)', alignItems:'center' }}>

          {/* ── Texto hero ── */}
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:'1.75rem', flexWrap:'wrap' }}>
              <Pill variant="blue">Red Técnico · Empresa · Profesor</Pill>
              <Pill variant="gray">Lo Espejo · Santiago</Pill>
            </div>

            <h1 style={{
              fontFamily:"'Sora',sans-serif", fontWeight:900,
              fontSize:'clamp(2.1rem,4.2vw,3.5rem)', lineHeight:1.04,
              color:'#1F2937', marginBottom:'1.3rem', letterSpacing:'-.035em',
            }}>
              Tu talento técnico,<br/>
              <span style={{ color: BLUE }}>visible y validado</span>
            </h1>

            <p style={{
              fontSize:'1rem', color:'#6E6E73', lineHeight:1.9,
              marginBottom:'2.5rem', maxWidth:490, fontWeight:300,
            }}>
              La plataforma del{' '}
              <strong style={{ color:'#1F2937', fontWeight:500 }}>C.E. Cardenal José María Caro</strong>{' '}
              que conecta estudiantes técnicos con empresas del territorio, con el respaldo de sus profesores y validación institucional.
            </p>

            <div style={{ display:'flex', gap:10, marginBottom:'3.25rem', flexWrap:'wrap' }}>
              <button onClick={() => nav('/auth?tab=register')} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'13px 28px', borderRadius:10, border:'none',
                background:BLUE, color:'#fff',
                fontFamily:"'Figtree',sans-serif", fontSize:'.95rem', fontWeight:700,
                cursor:'pointer', boxShadow:`0 6px 22px rgba(59,130,246,.4)`,
                transition:'transform .15s, box-shadow .15s',
              }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 10px 28px rgba(59,130,246,.55)` }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 6px 22px rgba(59,130,246,.4)` }}
              >
                Crear mi perfil <ArrowRight size={15}/>
              </button>
              <button onClick={() => nav('/auth')} style={{
                padding:'13px 28px', borderRadius:10,
                border:'1px solid rgba(0,0,0,.12)',
                background:'transparent',
                color:'#6E6E73', fontFamily:"'Figtree',sans-serif",
                fontSize:'.95rem', cursor:'pointer',
                transition:'border-color .15s, color .15s',
              }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(59,110,220,.3)'; e.currentTarget.style.color=BLUE_TEXT }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(0,0,0,.12)'; e.currentTarget.style.color='#6E6E73' }}
              >
                Ya tengo cuenta
              </button>
            </div>

            {/* Stats */}
            <div style={{ display:'flex', gap:'clamp(1.5rem,3.5vw,2.75rem)', borderTop:'1px solid rgba(0,0,0,.07)', paddingTop:'2rem' }}>
              <Stat n="250+" label="Estudiantes"/>
              <Stat n="50+"  label="Empresas"/>
              <Stat n="4"    label="Especialidades"/>
              <Stat n="100%" label="Validado" accent/>
            </div>
          </div>

          {/* ── Cards preview ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Card: perfil validado */}
            <div style={{
              background:'#FFFFFF', border:'1px solid #E5E7EB',
              borderRadius:18, padding:'1.35rem',
              boxShadow:'0 4px 24px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:13, marginBottom:'1.1rem' }}>
                <div style={{
                  width:48, height:48, borderRadius:'50%', flexShrink:0,
                  background:`linear-gradient(135deg, ${BLUE_DARK}, ${BLUE})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:'.9rem', color:'#fff',
                  boxShadow:`0 4px 14px rgba(59,130,246,.3)`,
                  letterSpacing:'-.01em',
                }}>AV</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.88rem', color:'#1F2937', letterSpacing:'-.01em' }}>Andrés Ignacio Valenzuela</div>
                  <div style={{ fontSize:'.67rem', color:'#86868B', marginTop:2 }}>Técnico en Telecomunicaciones · Lo Espejo</div>
                </div>
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:4,
                  background:'rgba(59,110,220,.08)', border:`1px solid rgba(59,110,220,.2)`,
                  color:BLUE_TEXT, fontSize:'.65rem', fontWeight:700,
                  padding:'3px 10px', borderRadius:20, flexShrink:0, letterSpacing:'.03em',
                }}>✓ Validado</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {[
                  ['Perfil técnico', 95, BLUE],
                  ['Habilidades',    80, BLUE_TEXT],
                  ['Prácticas',     100, TEAL],
                ].map(([l, v, c]) => (
                  <div key={l}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.63rem', color:'#86868B', marginBottom:4 }}>
                      <span>{l}</span>
                      <span style={{ color:c, fontWeight:600 }}>{v}%</span>
                    </div>
                    <div style={{ height:3, borderRadius:2, background:'#E5E7EB' }}>
                      <div style={{ height:3, borderRadius:2, background:c, width:`${v}%` }}/>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:5, marginTop:'1rem', flexWrap:'wrap' }}>
                {['Fibra Óptica','Redes TCP/IP','SCADA','Ciberseguridad'].map(s => (
                  <span key={s} style={{ background:'#F3F4F6', color:'#6E6E73', fontSize:'.62rem', padding:'2px 9px', borderRadius:10 }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Card: insignia */}
            <div style={{
              background:'#FFFBEB', border:'1px solid rgba(217,119,6,.18)',
              borderRadius:14, padding:'1rem 1.25rem',
              display:'flex', alignItems:'center', gap:13,
              boxShadow:'0 2px 10px rgba(217,119,6,.08)',
            }}>
              <div style={{
                width:42, height:42, borderRadius:12, flexShrink:0,
                background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Award size={20} color="#D97706" strokeWidth={1.5}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'.82rem', fontWeight:600, color:'#1F2937', marginBottom:2, letterSpacing:'-.005em' }}>Insignia aprobada por admin</div>
                <div style={{ fontSize:'.68rem', color:'#86868B', lineHeight:1.5 }}>Perfil técnico completado · C.E. Cardenal J.M. Caro</div>
              </div>
              <span style={{
                background:'rgba(5,150,105,.09)', border:'1px solid rgba(5,150,105,.2)',
                color:TEAL, fontSize:'.63rem', fontWeight:600,
                padding:'3px 9px', borderRadius:20, flexShrink:0,
              }}>Activa</span>
            </div>

            {/* Card: panel RED TEP */}
            <div style={{
              background:'#FFFFFF', border:'1px solid #E5E7EB',
              borderRadius:14, padding:'1rem 1.25rem',
              boxShadow:'0 2px 10px rgba(0,0,0,.05)',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.9rem' }}>
                <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.82rem', color:'#1F2937', letterSpacing:'-.01em' }}>Panel RED TEP</span>
                <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.63rem', color:TEAL, fontWeight:500 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:TEAL, display:'inline-block' }}/>
                  En vivo
                </span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
                {[['452','Estudiantes',BLUE_TEXT],['58','Empresas','#6E6E73'],['1.284','Postulaciones','#86868B']].map(([n,l,c]) => (
                  <div key={l} style={{ background:'#F5F7FB', borderRadius:9, padding:'.65rem', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.95rem', color:c, lineHeight:1 }}>{n}</div>
                    <div style={{ fontSize:'.57rem', color:'#86868B', marginTop:3, letterSpacing:'.02em' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divisor ─────────────────────────────────────────────────────────── */}
      <div style={{ height:1, background:'linear-gradient(90deg, transparent, rgba(0,0,0,.07), transparent)', position:'relative', zIndex:1 }}/>

      {/* ══ FEATURES ═══════════════════════════════════════════════════════════ */}
      <section style={{ position:'relative', zIndex:1, maxWidth:1140, margin:'0 auto', padding:'clamp(4rem,7vw,5.5rem) clamp(1.5rem,5vw,2.5rem)' }}>
        <div style={{ textAlign:'center', marginBottom:'3.75rem' }}>
          <div style={{ fontSize:'.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.14em', color:BLUE_TEXT, marginBottom:'.9rem' }}>
            PARA TODA LA COMUNIDAD EDUCATIVA
          </div>
          <h2 style={{
            fontFamily:"'Sora',sans-serif", fontWeight:800,
            fontSize:'clamp(1.65rem,3vw,2.5rem)', color:'#1F2937',
            letterSpacing:'-.025em', lineHeight:1.1,
          }}>Una red, tres perfiles</h2>
          <p style={{ fontSize:'.9rem', color:'#6E6E73', marginTop:'.85rem', maxWidth:460, margin:'.85rem auto 0', lineHeight:1.75, fontWeight:300 }}>
            Cada perfil tiene acceso diferenciado según su rol en el ecosistema educativo-laboral.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem', marginBottom:'3.25rem' }}>
          <ProfileCard icon={GraduationCap} title="Estudiante Activo o Egresado"
            desc="Crea tu perfil técnico validado, genera tu CV en 1 clic, recibe insignias aprobadas por el admin y accede a oportunidades reales del territorio."
            active />
          <ProfileCard icon={Building2} title="Empresa"
            desc="Publica ofertas laborales, filtra candidatos técnicos validados por el Centro Educacional, conecta directamente y verifica sus competencias." />
          <ProfileCard icon={Shield} title="Administración"
            desc="Gestiona la plataforma, valida inscripciones de alumnos, aprueba insignias, verifica empresas e importa usuarios masivamente desde Excel." />
        </div>

        {/* Mini features */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
          <MiniFeature icon={CheckCircle} label="Registro estudiantil"   sub="Admin aprueba cada estudiante"/>
          <MiniFeature icon={Award}       label="Insignias con control" sub="El admin aprueba cada logro"/>
          <MiniFeature icon={Users}       label="Importación masiva"    sub="Carga Excel/CSV de usuarios"/>
          <MiniFeature icon={Briefcase}   label="Tu CV en 1 clic"       sub="Se genera solo desde tu perfil, sin Word ni plantillas"/>
        </div>
      </section>

      {/* ── Divisor ─────────────────────────────────────────────────────────── */}
      <div style={{ height:1, background:'linear-gradient(90deg, transparent, rgba(0,0,0,.07), transparent)', position:'relative', zIndex:1 }}/>

      {/* ══ CTA ════════════════════════════════════════════════════════════════ */}
      <section style={{ position:'relative', zIndex:1 }}>
        <div style={{
          background:'#FFFFFF',
          padding:'clamp(4rem,8vw,6rem) clamp(1.5rem,5vw,2.5rem)',
          textAlign:'center', position:'relative',
        }}>
          {/* Logo del liceo — esquina inferior izquierda */}
          <div style={{ position:'absolute', bottom:'2rem', left:'clamp(1.5rem,5vw,3rem)', opacity:.15, display:'flex', alignItems:'center', gap:10 }}>
            <img
              src="/logo.png" alt="C.E. Cardenal José María Caro"
              style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover', filter:'grayscale(1)' }}
              onError={e => e.currentTarget.style.display='none'}
            />
          </div>

          {/* Marca RED TEP grande */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.75rem' }}>
            <RedTEPLogo size={64} mode="icon" />
          </div>

          <h2 style={{
            fontFamily:"'Sora',sans-serif", fontWeight:800,
            fontSize:'clamp(1.55rem,3vw,2.35rem)', color:'#1F2937',
            marginBottom:'.8rem', letterSpacing:'-.025em', lineHeight:1.15,
          }}>Únete a RED TEP hoy</h2>

          <p style={{ color:'#86868B', marginBottom:'2.25rem', fontSize:'.88rem', letterSpacing:'.02em', fontWeight:300 }}>
            Centro Educacional Cardenal José María Caro · Lo Espejo, Santiago · 2026
          </p>

          <button onClick={() => nav('/auth?tab=register')} style={{
            display:'inline-flex', alignItems:'center', gap:9,
            padding:'14px 38px', borderRadius:12, border:'none',
            background:BLUE, color:'#fff',
            fontFamily:"'Figtree',sans-serif", fontSize:'.95rem', fontWeight:700,
            cursor:'pointer', boxShadow:`0 8px 28px rgba(59,130,246,.45)`,
            transition:'opacity .15s, transform .15s, box-shadow .15s',
            letterSpacing:'.01em',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.opacity='.9'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 12px 36px rgba(59,130,246,.6)` }}
            onMouseLeave={e=>{ e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 8px 28px rgba(59,130,246,.45)` }}
          >
            Crear mi cuenta gratis <ArrowRight size={15}/>
          </button>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════════════════════ */}
      <footer style={{
        position:'relative', zIndex:1,
        padding:'.9rem clamp(1.5rem,5vw,3rem)',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8,
        borderTop:'1px solid rgba(0,0,0,.07)',
        background:'#F5F7FB',
      }}>
        <RedTEPLogo size={28} mode="inline" theme="light" />
        <span style={{ fontSize:'.7rem', color:'#86868B', letterSpacing:'.03em' }}>
          RED TEP — Red Técnico · Empresa · Profesor — Lo Espejo — 2026
        </span>
      </footer>

      {/* ── Animaciones ─────────────────────────────────────────────────────── */}
      <style>{`
        @media(max-width:768px){
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns:1fr !important;
          }
          section > div > div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns:1fr !important;
          }
          section > div > div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns:1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

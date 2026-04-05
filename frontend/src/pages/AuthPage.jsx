import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { authService } from '../services'
import useAuthStore from '../store/authStore'

const inp = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,.05)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 9, color: '#e2edf8',
  fontFamily: "'Figtree',sans-serif", fontSize: '.875rem',
  outline: 'none', transition: 'border-color .2s',
}
const lbl = {
  display: 'block', fontSize: '.74rem',
  fontWeight: 500, marginBottom: 5,
  color: 'rgba(255,255,255,.55)',
}

export default function AuthPage() {
  const nav          = useNavigate()
  const [params]     = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') === 'register' ? 'register' : 'login')
  const loginStore   = useAuthStore(s => s.login)

  const lf = useForm()
  const rf = useForm()

  const onLogin = async (data) => {
    try {
      const res = await authService.login(data)
      loginStore(res.data.user, res.data.token)
      toast.success(`Bienvenido, ${res.data.user.nombre}`)
      nav(res.data.user.role === 'ADMIN' ? '/admin' : '/feed')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciales incorrectas')
    }
  }

  const onRegister = async (data) => {
    try {
      const res = await authService.register(data)
      loginStore(res.data.user, res.data.token)
      toast.success('¡Cuenta creada! Bienvenido a RED TEP')
      nav('/feed')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrarse')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Orbs de fondo */}
      <div style={{ position:'absolute', top:-80, right:'15%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(38,101,181,.15) 0%, transparent 65%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-60, left:'10%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(190,24,93,.1) 0%, transparent 65%)', pointerEvents:'none' }}/>

      <div style={{ width: '100%', maxWidth: 900, position: 'relative' }}>
        {/* Volver */}
        <button
          onClick={() => nav('/')}
          style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.8rem', color:'var(--text2)', background:'none', border:'none', cursor:'pointer', marginBottom:'1.5rem', padding:0, fontFamily:"'Figtree',sans-serif", transition:'color .15s' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--green-lit)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text2)'}
        >
          ← Volver al inicio
        </button>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          borderRadius: 20, overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 40px 100px rgba(0,0,0,.6)',
        }}>
          {/* ── Panel izquierdo — Identidad institucional ─────────────────── */}
          <div style={{
            background: 'linear-gradient(160deg, #1a4f8c 0%, #0b1729 50%, #0f1020 100%)',
            padding: '3rem', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
          }}>
            {/* Patrón geométrico decorativo */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 220, height: 220, borderRadius: '50%',
              border: '1px solid rgba(77,160,232,.15)',
            }}/>
            <div style={{
              position: 'absolute', top: 20, right: 20,
              width: 120, height: 120, borderRadius: '50%',
              border: '1px solid rgba(190,24,93,.2)',
            }}/>
            <div style={{
              position: 'absolute', bottom: -30, left: -30,
              width: 180, height: 180, borderRadius: '50%',
              border: '1px solid rgba(77,160,232,.1)',
            }}/>

            <div style={{ position: 'relative' }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #2665b5, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 12, color: '#fff',
                  boxShadow: '0 4px 14px rgba(38,101,181,.5)',
                }}>RT</div>
                <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.95rem', color:'#fff' }}>RED TEP</span>
              </div>

              <h2 style={{
                fontFamily: "'Sora',sans-serif", fontWeight: 800,
                fontSize: '1.75rem', color: '#fff', lineHeight: 1.1,
                marginBottom: '1rem', letterSpacing: '-.02em',
              }}>
                Conecta tu<br/>talento con<br/>oportunidades<br/>
                <span style={{ background: 'linear-gradient(90deg, #4da0e8, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>reales</span>
              </h2>

              <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.7, marginBottom: '1.75rem' }}>
                La plataforma del C.E. Cardenal José María Caro que valida y visibiliza las habilidades técnicas de sus estudiantes.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['🎓', 'Perfil técnico validado por profesores'],
                  ['🏢', 'Conexión directa con empresas'],
                  ['🏅', 'Sistema de insignias y progreso'],
                  ['📸', 'Portafolio de prácticas y evidencias'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.8rem', color:'rgba(255,255,255,.75)' }}>
                    <span style={{ fontSize: '.9rem' }}>{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer institucional */}
            <div style={{ position:'relative', paddingTop:'1.5rem', borderTop:'1px solid rgba(255,255,255,.08)' }}>
              <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.3)', lineHeight:1.6 }}>
                Centro Educacional<br/>
                <span style={{ color:'rgba(255,255,255,.5)', fontWeight:500 }}>Cardenal José María Caro</span><br/>
                Lo Espejo · Santiago · Chile
              </div>
            </div>
          </div>

          {/* ── Panel derecho — Formulario ────────────────────────────────── */}
          <div style={{ background: 'var(--bg2)', padding: '3rem' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.2rem', color:'#fff', marginBottom:'.25rem' }}>
              Bienvenido a RED TEP
            </div>
            <div style={{ fontSize:'.82rem', color:'var(--text2)', marginBottom:'1.75rem', fontFamily:"'Figtree',sans-serif" }}>
              Ingresa o crea tu cuenta para continuar
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', background:'var(--surface)', borderRadius:10, padding:3, marginBottom:'1.75rem' }}>
              {['login','register'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex:1, padding:'8px', textAlign:'center',
                    fontSize:'.82rem', fontWeight:500,
                    background: tab===t ? 'var(--green-mid)' : 'transparent',
                    border:'none', cursor:'pointer',
                    color: tab===t ? '#fff' : 'var(--text3)',
                    borderRadius:8, fontFamily:"'Figtree',sans-serif",
                    transition: 'all .2s',
                    boxShadow: tab===t ? '0 3px 10px rgba(38,101,181,.4)' : 'none',
                  }}
                >
                  {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>

            {tab === 'login' ? (
              <form onSubmit={lf.handleSubmit(onLogin)}>
                <div style={{ marginBottom:'.85rem' }}>
                  <label style={lbl}>Correo electrónico</label>
                  <input style={inp} type="email" placeholder="correo@ejemplo.cl"
                    onFocus={e=>e.target.style.borderColor='var(--green-lit)'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                    {...lf.register('email', { required:true })}
                  />
                </div>
                <div style={{ marginBottom:'1.1rem' }}>
                  <label style={lbl}>Contraseña</label>
                  <input style={inp} type="password" placeholder="••••••••"
                    onFocus={e=>e.target.style.borderColor='var(--green-lit)'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                    {...lf.register('password', { required:true })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={lf.formState.isSubmitting}
                  style={{
                    width:'100%', padding:12, borderRadius:10, border:'none',
                    background:'var(--green-mid)', color:'#fff',
                    fontFamily:"'Figtree',sans-serif", fontSize:'.9rem', fontWeight:600,
                    cursor:'pointer', transition:'opacity .15s, transform .15s',
                    boxShadow:'0 4px 16px rgba(38,101,181,.35)',
                    opacity: lf.formState.isSubmitting ? .7 : 1,
                  }}
                  onMouseEnter={e=>{ if(!lf.formState.isSubmitting){ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(38,101,181,.45)' }}}
                  onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(38,101,181,.35)' }}
                >
                  {lf.formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
                </button>

                {/* Acceso rápido demo */}
                <div style={{ marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'.68rem', color:'var(--text3)', marginBottom:'.5rem', textTransform:'uppercase', letterSpacing:'.06em' }}>Acceso rápido (demo)</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {[
                      ['admin@redtep.cl',          'admin123', '🏫 Admin Colegio'],
                      ['juan@redtep.cl',            'est123',   '👷 Estudiante'],
                      ['empresa@constructora.cl',   'emp123',   '🏢 Empresa'],
                    ].map(([e, p, l]) => (
                      <button
                        key={e} type="button"
                        onClick={() => { lf.setValue('email',e); lf.setValue('password',p) }}
                        style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'7px 10px', background:'rgba(255,255,255,.03)',
                          border:'1px solid var(--border)', borderRadius:7,
                          color:'var(--text2)', fontFamily:"'Figtree',sans-serif",
                          fontSize:'.74rem', cursor:'pointer', transition:'border-color .15s',
                        }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(77,160,232,.3)'}
                        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                      >
                        <span>{l}</span>
                        <span style={{ color:'var(--text3)', fontSize:'.68rem' }}>{e}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={rf.handleSubmit(onRegister)}>
                {[
                  ['Nombre completo', 'nombre', 'text', 'Juan Pérez González', 'nombre'],
                  ['Correo electrónico', 'email', 'email', 'correo@ejemplo.cl', 'email'],
                  ['Contraseña', 'password', 'password', 'Mínimo 6 caracteres', 'password'],
                ].map(([label, key, type, placeholder, regKey]) => (
                  <div key={key} style={{ marginBottom:'.85rem' }}>
                    <label style={lbl}>{label}</label>
                    <input
                      style={{ ...inp, ...(rf.formState.errors[regKey] && { borderColor:'rgba(239,68,68,.6)' }) }}
                      type={type} placeholder={placeholder}
                      onFocus={e=>e.target.style.borderColor='var(--green-lit)'}
                      onBlur={e=>e.target.style.borderColor=rf.formState.errors[regKey]?'rgba(239,68,68,.6)':'rgba(255,255,255,.1)'}
                      {...rf.register(regKey, {
                      required: 'Campo requerido',
                      ...(regKey === 'email' && { pattern: { value:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message:'Correo inválido (debe tener .com, .cl, etc.)' } }),
                      ...(regKey === 'password' && { minLength: { value:8, message:'Mínimo 8 caracteres' } }),
                    })}
                    />
                    {rf.formState.errors[regKey] && (
                      <span style={{ fontSize:'.7rem', color:'rgba(239,68,68,.9)', marginTop:3, display:'block' }}>
                        {rf.formState.errors[regKey].message}
                      </span>
                    )}
                  </div>
                ))}
                <div style={{ marginBottom:'1.1rem' }}>
                  <label style={lbl}>¿Cómo ingresas?</label>
                  <select
                    style={{ ...inp, cursor:'pointer' }}
                    onFocus={e=>e.target.style.borderColor='var(--green-lit)'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                    {...rf.register('role', { required:true })}
                  >
                    <option value="">Selecciona tu perfil...</option>
                    <option value="STUDENT_TP">Estudiante técnico</option>
                    <option value="COMPANY">Empresa del sector</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={rf.formState.isSubmitting}
                  style={{
                    width:'100%', padding:12, borderRadius:10, border:'none',
                    background:'linear-gradient(135deg, #2665b5, #be185d)',
                    color:'#fff', fontFamily:"'Figtree',sans-serif",
                    fontSize:'.9rem', fontWeight:600, cursor:'pointer',
                    boxShadow:'0 4px 16px rgba(38,101,181,.35)',
                    opacity: rf.formState.isSubmitting ? .7 : 1,
                    transition:'opacity .15s, transform .15s',
                  }}
                  onMouseEnter={e=>{ if(!rf.formState.isSubmitting) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 22px rgba(38,101,181,.45)' }}}
                  onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(38,101,181,.35)' }}
                >
                  {rf.formState.isSubmitting ? 'Creando cuenta...' : 'Crear mi cuenta'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

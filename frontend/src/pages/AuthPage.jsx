import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { GraduationCap, Building2, Medal, Camera, School, CheckCircle, XCircle } from 'lucide-react'
import { authService, workerService } from '../services'
import useAuthStore from '../store/authStore'
import RedTEPLogo from '../components/brand/RedTEPLogo'

const inp = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surface)',
  border: '1px solid var(--border2)',
  borderRadius: 9, color: 'var(--text)',
  fontFamily: "'Figtree',sans-serif", fontSize: '.875rem',
  outline: 'none', transition: 'border-color .2s',
  boxSizing: 'border-box',
}
const lbl = { display: 'block', fontSize: '.74rem', fontWeight: 500, marginBottom: 5, color: 'var(--text2)' }

function calcEdad(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  const nac = new Date(fecha)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const mes = hoy.getMonth() - nac.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad >= 0 ? edad : null
}

// ─── Modal onboarding para STUDENT (2 pasos) ─────────────────────────────────
function StudentOnboardingModal({ onClose }) {
  const [step,         setStep]         = useState(1)
  const [saving,       setSaving]       = useState(false)
  const [liceoLoading, setLiceoLoading] = useState(false)
  const [liceoDone,    setLiceoDone]    = useState(false)
  const [form, setForm] = useState({
    especialidad:    '',
    fechaNacimiento: '',
    direccion:       '',
    sobreMi:         '',
  })

  const edad = calcEdad(form.fechaNacimiento)

  const handleStep1 = async (skip = false) => {
    if (!skip) {
      setSaving(true)
      try {
        await workerService.updateMe({
          especialidad:        form.especialidad  || undefined,
          edad:                edad               ?? undefined,
          direccion:           form.direccion     || undefined,
          experienciaPractica: form.sobreMi       || undefined,
        })
      } catch {
        toast.error('No se pudo guardar. Puedes editar esto desde tu perfil.')
      } finally { setSaving(false) }
    }
    setStep(2)
  }

  const handleLiceoSi = async () => {
    setLiceoLoading(true)
    try {
      await workerService.requestLiceo()
      setLiceoDone(true)
      toast.success('Solicitud enviada. El admin la revisará pronto.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar solicitud')
    } finally { setLiceoLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:20, padding:'2.5rem', maxWidth:460, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,.15)', maxHeight:'90vh', overflowY:'auto' }}>

        {/* Indicador de pasos */}
        <div style={{ display:'flex', gap:6, marginBottom:'1.75rem', justifyContent:'center' }}>
          {[1,2].map(n => (
            <div key={n} style={{ height:4, width:40, borderRadius:2, background: step >= n ? 'var(--green-mid)' : 'var(--surface2)', transition:'background .3s' }}/>
          ))}
        </div>

        {/* ── Paso 1: datos del perfil ── */}
        {step === 1 && (
          <>
            <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', margin:'0 auto 1rem', background:'rgba(47,62,110,0.10)', border:'1px solid rgba(47,62,110,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <GraduationCap size={26} color="#3B6EDC" />
              </div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.05rem', color:'var(--text)', marginBottom:'.4rem' }}>
                ¡Bienvenido a RED TEP!
              </div>
              <p style={{ fontSize:'.84rem', color:'var(--text2)', lineHeight:1.7 }}>
                Cuéntanos un poco sobre ti para armar tu perfil técnico. Podrás editarlo cuando quieras.
              </p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'.8rem' }}>
              <div>
                <label style={lbl}>Especialidad técnica</label>
                <input style={inp} value={form.especialidad}
                  onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
                  placeholder="Ej: Electricidad, Gastronomía, Telecomunicaciones..."
                  onFocus={e => e.target.style.borderColor='var(--green-lit)'}
                  onBlur={e => e.target.style.borderColor='var(--border2)'}
                />
              </div>

              <div>
                <label style={lbl}>Fecha de nacimiento</label>
                <input style={inp} type="date" value={form.fechaNacimiento}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, fechaNacimiento: e.target.value }))}
                  onFocus={e => e.target.style.borderColor='var(--green-lit)'}
                  onBlur={e => e.target.style.borderColor='var(--border2)'}
                />
                {form.fechaNacimiento && edad !== null && (
                  <span style={{ fontSize:'.72rem', color:'var(--green-lit)', marginTop:3, display:'block' }}>
                    → {edad} años
                  </span>
                )}
              </div>

              <div>
                <label style={lbl}>Dirección / Comuna</label>
                <input style={inp} value={form.direccion}
                  onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                  placeholder="Ej: Lo Espejo, Santiago"
                  onFocus={e => e.target.style.borderColor='var(--green-lit)'}
                  onBlur={e => e.target.style.borderColor='var(--border2)'}
                />
              </div>

              <div>
                <label style={lbl}>
                  Sobre mí <span style={{ fontWeight:400, color:'var(--text3)' }}>— opcional</span>
                </label>
                <textarea
                  style={{ ...inp, resize:'vertical', minHeight:76 }}
                  value={form.sobreMi}
                  onChange={e => setForm(f => ({ ...f, sobreMi: e.target.value }))}
                  placeholder="Cuéntanos sobre tu experiencia, habilidades y qué buscas..."
                  onFocus={e => e.target.style.borderColor='var(--green-lit)'}
                  onBlur={e => e.target.style.borderColor='var(--border2)'}
                />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'.75rem', marginTop:'1.25rem' }}>
              <button
                onClick={() => handleStep1(true)}
                style={{ padding:'12px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text2)', fontFamily:"'Figtree',sans-serif", fontSize:'.85rem', cursor:'pointer' }}
              >
                Omitir
              </button>
              <button
                onClick={() => handleStep1(false)}
                disabled={saving}
                style={{ padding:'12px', borderRadius:10, border:'none', background:'var(--green-mid)', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.88rem', fontWeight:600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}
              >
                {saving ? 'Guardando...' : 'Continuar →'}
              </button>
            </div>
          </>
        )}

        {/* ── Paso 2: pregunta liceo ── */}
        {step === 2 && !liceoDone && (
          <>
            <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 1rem', background:'rgba(47,62,110,0.10)', border:'1px solid rgba(47,62,110,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <School size={28} color="#3B6EDC" />
              </div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.05rem', color:'var(--text)', marginBottom:'.5rem' }}>
                Una pregunta más
              </div>
              <p style={{ fontSize:'.87rem', color:'var(--text2)', lineHeight:1.7 }}>
                ¿Cuál es tu relación con el<br/>
                <strong style={{ color:'var(--text)' }}>C.E. Cardenal José María Caro</strong>?
              </p>
              <p style={{ fontSize:'.75rem', color:'var(--text3)', lineHeight:1.6, marginTop:'.6rem' }}>
                El admin validará tu cuenta y tu CV incluirá la información del Centro Educacional.
              </p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
              <button
                onClick={handleLiceoSi}
                disabled={liceoLoading}
                style={{ padding:'13px', borderRadius:12, border:'none', background:'#3B6EDC', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.88rem', fontWeight:600, cursor: liceoLoading ? 'not-allowed' : 'pointer', opacity: liceoLoading ? .7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}
              >
                <CheckCircle size={16} /> {liceoLoading ? 'Enviando...' : 'Soy estudiante activo del Centro Educacional'}
              </button>
              <button
                onClick={handleLiceoSi}
                disabled={liceoLoading}
                style={{ padding:'13px', borderRadius:12, border:'1px solid rgba(59,110,220,.35)', background:'transparent', color:'#3B6EDC', fontFamily:"'Figtree',sans-serif", fontSize:'.88rem', fontWeight:600, cursor: liceoLoading ? 'not-allowed' : 'pointer', opacity: liceoLoading ? .7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}
              >
                <CheckCircle size={16} /> {liceoLoading ? 'Enviando...' : 'Soy egresado del Centro Educacional'}
              </button>
              <button
                onClick={onClose}
                disabled={liceoLoading}
                style={{ padding:'12px', borderRadius:12, border:'1px solid var(--border2)', background:'transparent', color:'var(--text2)', fontFamily:"'Figtree',sans-serif", fontSize:'.85rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              >
                <XCircle size={14} /> No pertenezco al Centro Educacional
              </button>
            </div>
          </>
        )}

        {/* ── Paso 2 completado ── */}
        {step === 2 && liceoDone && (
          <div style={{ textAlign:'center' }}>
            <CheckCircle size={52} color="#3B6EDC" style={{ marginBottom:'1rem' }} />
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.1rem', color:'var(--text)', marginBottom:'.5rem' }}>
              ¡Todo listo!
            </div>
            <p style={{ fontSize:'.85rem', color:'var(--text2)', lineHeight:1.7, marginBottom:'1.5rem' }}>
              Tu solicitud de validación fue enviada. El administrador la revisará pronto. Mientras tanto puedes explorar la plataforma.
            </p>
            <button
              onClick={onClose}
              style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'var(--green-mid)', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.9rem', fontWeight:600, cursor:'pointer' }}
            >
              Ir a RED TEP
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AuthPage ─────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const nav           = useNavigate()
  const [params]      = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') === 'register' ? 'register' : 'login')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const loginStore    = useAuthStore(s => s.login)

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
      if (data.role === 'STUDENT') {
        setShowOnboarding(true)
      } else {
        nav('/feed')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrarse')
    }
  }

  const handleOnboardingClose = () => {
    setShowOnboarding(false)
    nav('/feed')
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', position:'relative', overflow:'hidden' }}>

      {showOnboarding && <StudentOnboardingModal onClose={handleOnboardingClose} />}

      {/* Orbs de fondo */}
      <div style={{ position:'absolute', top:-80, right:'15%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 65%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-60, left:'10%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(190,24,93,.06) 0%,transparent 65%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:900, position:'relative' }}>
        {/* Volver */}
        <button onClick={() => nav('/')} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.8rem', color:'var(--text2)', background:'none', border:'none', cursor:'pointer', marginBottom:'1.5rem', padding:0, fontFamily:"'Figtree',sans-serif" }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--green-lit)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text2)'}
        >
          ← Volver al inicio
        </button>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderRadius:20, overflow:'hidden', border:'1px solid var(--border)', boxShadow:'0 20px 60px rgba(0,0,0,.10)' }}
          className="auth-grid"
        >

          {/* ── Panel izquierdo ── */}
          <div style={{ background:'linear-gradient(160deg, #2F4FA3 0%, #3B6EDC 60%, #2F4FA3 100%)', padding:'3rem', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}
            className="auth-left"
          >
            <div style={{ position:'absolute', top:-40, right:-40, width:220, height:220, borderRadius:'50%', border:'1px solid rgba(255,255,255,.08)' }}/>
            <div style={{ position:'absolute', bottom:-30, left:-30, width:180, height:180, borderRadius:'50%', border:'1px solid rgba(255,255,255,.05)' }}/>

            <div style={{ position:'relative' }}>
              <div style={{ marginBottom:'2.5rem' }}>
                <RedTEPLogo size={44} mode="inline" />
              </div>

              <h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:'1.75rem', color:'#ffffff', lineHeight:1.1, marginBottom:'1rem', letterSpacing:'-.02em' }}>
                Conecta tu<br/>talento con<br/>oportunidades<br/>
                <span style={{ color:'#7DD3FA' }}>reales</span>
              </h2>

              <p style={{ fontSize:'.85rem', color:'rgba(255,255,255,.65)', lineHeight:1.7, marginBottom:'1.75rem' }}>
                La plataforma del C.E. Cardenal José María Caro que valida y visibiliza las habilidades técnicas de sus estudiantes.
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  [GraduationCap, 'Perfil técnico validado por admin'],
                  [Building2,     'Conexión directa con empresas'],
                  [Medal,         'Insignias aprobadas por el colegio'],
                  [Camera,        'CV automático + portafolio de prácticas'],
                ].map(([Icon, text]) => (
                  <div key={text} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.8rem', color:'rgba(255,255,255,.8)' }}>
                    <Icon size={14} strokeWidth={2} color="#7DD3FA"/>{text}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position:'relative', paddingTop:'1.5rem', borderTop:'1px solid rgba(255,255,255,.1)' }}>
              <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.35)', lineHeight:1.6 }}>
                Centro Educacional<br/>
                <span style={{ color:'rgba(255,255,255,.55)', fontWeight:500 }}>Cardenal José María Caro</span><br/>
                Lo Espejo · Santiago · Chile
              </div>
            </div>
          </div>

          {/* ── Panel derecho ── */}
          <div style={{ background:'var(--bg2)', padding:'3rem' }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.2rem', color:'var(--text)', marginBottom:'.25rem' }}>
              Bienvenido a RED TEP
            </div>
            <div style={{ fontSize:'.82rem', color:'var(--text2)', marginBottom:'1.75rem', fontFamily:"'Figtree',sans-serif" }}>
              Ingresa o crea tu cuenta para continuar
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', background:'var(--surface)', borderRadius:10, padding:3, marginBottom:'1.75rem' }}>
              {['login','register'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'8px', textAlign:'center', fontSize:'.82rem', fontWeight:500, background: tab===t ? '#3B6EDC' : 'transparent', border:'none', cursor:'pointer', color: tab===t ? '#fff' : 'var(--text3)', borderRadius:8, fontFamily:"'Figtree',sans-serif", transition:'all .2s', boxShadow: tab===t ? '0 3px 10px rgba(47,62,110,0.30)' : 'none' }}>
                  {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>

            {tab === 'login' ? (
              /* ── Formulario de login ── */
              <form onSubmit={lf.handleSubmit(onLogin)}>
                <div style={{ marginBottom:'.85rem' }}>
                  <label style={lbl}>Correo electrónico</label>
                  <input style={inp} type="email" placeholder="correo@ejemplo.cl"
                    onFocus={e=>e.target.style.borderColor='var(--green-lit)'}
                    onBlur={e=>e.target.style.borderColor='var(--border2)'}
                    {...lf.register('email', { required:true })}
                  />
                </div>
                <div style={{ marginBottom:'1.1rem' }}>
                  <label style={lbl}>Contraseña</label>
                  <input style={inp} type="password" placeholder="••••••••"
                    onFocus={e=>e.target.style.borderColor='var(--green-lit)'}
                    onBlur={e=>e.target.style.borderColor='var(--border2)'}
                    {...lf.register('password', { required:true })}
                  />
                </div>
                <button type="submit" disabled={lf.formState.isSubmitting}
                  style={{ width:'100%', padding:12, borderRadius:10, border:'none', background:'#3B6EDC', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.9rem', fontWeight:600, cursor:'pointer', boxShadow:'0 4px 16px rgba(47,62,110,0.30)', opacity: lf.formState.isSubmitting ? .7 : 1 }}
                >
                  {lf.formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
                </button>

                {/* Demo */}
                <div style={{ marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'.68rem', color:'var(--text3)', marginBottom:'.5rem', textTransform:'uppercase', letterSpacing:'.06em' }}>Acceso rápido (demo)</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {[
                      ['admin@redtep.cl',        'admin123', 'Admin Colegio'],
                      ['juan@redtep.cl',          'est123',   'Estudiante'],
                      ['empresa@constructora.cl', 'emp123',   'Empresa'],
                    ].map(([e, p, l]) => (
                      <button key={e} type="button"
                        onClick={() => { lf.setValue('email',e); lf.setValue('password',p) }}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:7, color:'var(--text2)', fontFamily:"'Figtree',sans-serif", fontSize:'.74rem', cursor:'pointer' }}
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
              /* ── Formulario de registro ── */
              <form onSubmit={rf.handleSubmit(onRegister)}>
                {[
                  ['Nombre completo',   'nombre',   'text',     'Juan Pérez González',  'nombre'],
                  ['Correo electrónico','email',    'email',    'correo@ejemplo.cl',     'email'],
                  ['Contraseña',        'password', 'password', 'Mínimo 8 caracteres',  'password'],
                ].map(([label, key, type, placeholder, regKey]) => (
                  <div key={key} style={{ marginBottom:'.85rem' }}>
                    <label style={lbl}>{label}</label>
                    <input
                      style={{ ...inp, ...(rf.formState.errors[regKey] && { borderColor:'rgba(239,68,68,.6)' }) }}
                      type={type} placeholder={placeholder}
                      onFocus={e=>e.target.style.borderColor='var(--green-lit)'}
                      onBlur={e=>e.target.style.borderColor=rf.formState.errors[regKey]?'rgba(239,68,68,.6)':'var(--border2)'}
                      {...rf.register(regKey, {
                        required: 'Campo requerido',
                        ...(regKey === 'email'    && { pattern: { value:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message:'Correo inválido' } }),
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

                {/* Selector de rol */}
                <div style={{ marginBottom:'1.1rem' }}>
                  <label style={lbl}>¿Cómo participas en RED TEP?</label>
                  <select
                    style={{ ...inp, cursor:'pointer' }}
                    onFocus={e=>e.target.style.borderColor='var(--green-lit)'}
                    onBlur={e=>e.target.style.borderColor='var(--border2)'}
                    {...rf.register('role', { required: 'Debes seleccionar un tipo de usuario' })}
                  >
                    <option value="">Selecciona tu perfil...</option>
                    <option value="STUDENT">Estudiante técnico</option>
                    <option value="COMPANY">Empresa / Reclutadora</option>
                    <option value="TEACHER">Profesor / Docente</option>
                  </select>
                  {rf.formState.errors.role && (
                    <span style={{ fontSize:'.7rem', color:'rgba(239,68,68,.9)', marginTop:3, display:'block' }}>
                      {rf.formState.errors.role.message}
                    </span>
                  )}
                </div>

                <button type="submit" disabled={rf.formState.isSubmitting}
                  style={{ width:'100%', padding:12, borderRadius:10, border:'none', background:'#3B6EDC', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.9rem', fontWeight:600, cursor:'pointer', boxShadow:'0 4px 16px rgba(47,62,110,0.30)', opacity: rf.formState.isSubmitting ? .7 : 1 }}
                >
                  {rf.formState.isSubmitting ? 'Creando cuenta...' : 'Crear mi cuenta'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-left { display: none !important; }
        }
      `}</style>
    </div>
  )
}

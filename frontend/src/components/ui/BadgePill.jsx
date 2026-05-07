import { useState } from 'react'
import { Award } from 'lucide-react'

/**
 * BadgePill — muestra una insignia con tooltip al hacer hover.
 * Props:
 *   award  — { id, visible, template: { nombre, descripcion, imagenUrl } }
 *   onToggle — opcional, callback(awardId) para toggle visible/hidden (solo perfil propio)
 */
export default function BadgePill({ award, onToggle }) {
  const [hover, setHover] = useState(false)
  const { template } = award

  return (
    <div
      style={{ position:'relative', display:'inline-flex', flexDirection:'column', alignItems:'center', gap:5 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Badge circle */}
      <div
        style={{
          width:56, height:56, borderRadius:12,
          border:`2px solid ${award.visible === false ? 'var(--border)' : 'rgba(240,188,56,.4)'}`,
          background: award.visible === false ? 'var(--surface2)' : 'linear-gradient(135deg, rgba(240,188,56,.12) 0%, rgba(240,188,56,.03) 100%)',
          overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
          cursor: onToggle ? 'pointer' : 'default',
          opacity: award.visible === false ? .55 : 1,
          transition:'all .15s',
          flexShrink:0,
        }}
        onClick={() => onToggle && onToggle(award.id)}
        title={onToggle ? (award.visible ? 'Hacer invisible en tu perfil' : 'Mostrar en tu perfil') : undefined}
      >
        {template.imagenUrl
          ? <img src={template.imagenUrl} alt={template.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <AppLogoFallback />
        }
      </div>

      {/* Name */}
      <div style={{ fontSize:'.65rem', fontWeight:500, color: award.visible === false ? 'var(--text3)' : 'var(--text2)', maxWidth:68, textAlign:'center', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
        {template.nombre}
      </div>

      {/* Visibility icon (own profile only) */}
      {onToggle && (
        <div style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background: award.visible ? 'var(--green-mid)' : 'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {award.visible
            ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          }
        </div>
      )}

      {/* Tooltip */}
      {hover && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 10px)', left:'50%', transform:'translateX(-50%)',
          background:'var(--bg2)', border:'1px solid var(--border)',
          borderRadius:10, padding:'.6rem .85rem',
          minWidth:160, maxWidth:220, zIndex:999,
          boxShadow:'0 4px 20px rgba(0,0,0,.2)',
          pointerEvents:'none',
        }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.78rem', color:'var(--text)', marginBottom:4 }}>
            {template.nombre}
          </div>
          <div style={{ fontSize:'.73rem', color:'var(--text2)', lineHeight:1.45 }}>
            {template.descripcion}
          </div>
          {/* Arrow */}
          <div style={{ position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)', width:10, height:10, background:'var(--bg2)', border:'1px solid var(--border)', borderTop:'none', borderLeft:'none', rotate:'45deg' }} />
        </div>
      )}
    </div>
  )
}

// App logo as fallback SVG (hexagon network mark from RedTEPLogo)
function AppLogoFallback() {
  const s = 36, cx = 18, cy = 18, R = 12.96
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60) - 90) * (Math.PI / 180)
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)]
  })
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <rect x={0} y={0} width={s} height={s} rx={s * 0.22} fill="#3B6EDC" />
      {hex.map((p, i) => {
        const next = hex[(i + 1) % 6]
        return <line key={i} x1={p[0]} y1={p[1]} x2={next[0]} y2={next[1]} stroke="white" strokeWidth="0.6" strokeOpacity="0.5" />
      })}
      {[0, 2, 4].map(i => <line key={`r${i}`} x1={cx} y1={cy} x2={hex[i][0]} y2={hex[i][1]} stroke="white" strokeWidth="0.6" strokeOpacity="0.5" />)}
      {[0, 2, 4].map(i => <circle key={`c${i}`} cx={hex[i][0]} cy={hex[i][1]} r="2.24" fill="white" />)}
      <circle cx={cx} cy={cy} r="2.7" fill="white" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#3B6EDC" fontWeight="800" fontSize="4.2" fontFamily="'Sora',sans-serif">R</text>
    </svg>
  )
}

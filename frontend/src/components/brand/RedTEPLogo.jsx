/* ─── RED TEP Logo Component ──────────────────────────────────────────────────
 *
 * Modes:
 *   "icon"   — solo el squircle (sidebar, favicon-like contexts)
 *   "inline" — squircle + "RED TEP" texto a la derecha (navbar)
 *   "full"   — composición completa: squircle + texto centrado abajo (auth, landing hero)
 */

/* ─── Squircle icon SVG ───────────────────────────────────────────────────── */
function RedTEPMark({ size = 36 }) {
  const s    = size
  const cx   = s / 2
  const cy   = s / 2
  const R    = s * 0.36          // radio del hexágono
  const nodeR = s * 0.062        // radio nodos cyan exteriores
  const centR = s * 0.075        // radio nodo central
  const sw    = Math.max(0.6, s * 0.013)  // strokeWidth líneas

  // Vértices del hexágono (punta arriba: 0° = top)
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60) - 90) * (Math.PI / 180)
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)]
  })

  // Índices con nodo cyan: top (0), bottom-right (2), bottom-left (4)
  const cyanIdx = new Set([0, 2, 4])

  return (
    <svg
      width={s} height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* Squircle fondo — azul institucional */}
      <rect x={0} y={0} width={s} height={s} rx={s * 0.22} fill="#3B6EDC" />

      {/* Aristas del hexágono — blanco suave */}
      {hex.map((p, i) => {
        const next = hex[(i + 1) % 6]
        return (
          <line key={`e${i}`}
            x1={p[0]} y1={p[1]}
            x2={next[0]} y2={next[1]}
            stroke="white" strokeWidth={sw} strokeOpacity={0.45}
            strokeLinecap="round"
          />
        )
      })}

      {/* Líneas del centro a los tres nodos principales */}
      {[0, 2, 4].map(i => (
        <line key={`r${i}`}
          x1={cx} y1={cy}
          x2={hex[i][0]} y2={hex[i][1]}
          stroke="white" strokeWidth={sw} strokeOpacity={0.45}
          strokeLinecap="round"
        />
      ))}

      {/* Nodos pequeños en vértices secundarios */}
      {hex.map((p, i) => !cyanIdx.has(i) && (
        <circle key={`wn${i}`}
          cx={p[0]} cy={p[1]}
          r={nodeR * 0.45}
          fill="white" fillOpacity={0.5}
        />
      ))}

      {/* Nodos principales — blanco sólido */}
      {[0, 2, 4].map(i => (
        <circle key={`cn${i}`}
          cx={hex[i][0]} cy={hex[i][1]}
          r={nodeR}
          fill="white"
        />
      ))}

      {/* Nodo central con letra R */}
      <circle cx={cx} cy={cy} r={centR} fill="white" />
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#3B6EDC"
        fontWeight="800"
        fontSize={centR * 1.55}
        fontFamily="'Sora', 'Inter', system-ui, sans-serif"
        letterSpacing="-0.02em"
      >R</text>
    </svg>
  )
}

/* ─── Logo exportable ─────────────────────────────────────────────────────── */
export default function RedTEPLogo({ size = 36, mode = 'inline', theme = 'dark' }) {
  const textColor    = theme === 'light' ? '#1F2937'          : '#ffffff'
  const subtextColor = theme === 'light' ? '#6B7280'          : 'rgba(255,255,255,.55)'

  /* ── Solo el icono ── */
  if (mode === 'icon') {
    return <RedTEPMark size={size} />
  }

  /* ── Icono + texto a la derecha (navbar) ── */
  if (mode === 'inline') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <RedTEPMark size={size} />
        <div>
          <div style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 800,
            fontSize: size * 0.3 + 'px',
            color: textColor,
            letterSpacing: '.01em',
            lineHeight: 1.2,
          }}>
            RED TEP
          </div>
          <div style={{
            fontSize: Math.max(8, size * 0.16) + 'px',
            color: subtextColor,
            letterSpacing: '.04em',
            lineHeight: 1.2,
            marginTop: 1,
          }}>
            C.E. Cardenal José María Caro
          </div>
        </div>
      </div>
    )
  }

  /* ── Composición completa centrada (auth, landing hero) ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <RedTEPMark size={size} />

      {/* Nombre principal */}
      <div style={{
        fontFamily: "'Sora', sans-serif",
        fontWeight: 800,
        fontSize: size * 0.48 + 'px',
        color: '#1F2937',
        letterSpacing: '.04em',
        marginTop: size * 0.22 + 'px',
        lineHeight: 1,
      }}>
        RED TEP
      </div>

      {/* Línea decorativa */}
      <div style={{
        width: size * 1.4 + 'px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(59,110,220,.3), transparent)',
        margin: `${size * 0.14}px 0`,
      }} />

      {/* Subtítulos */}
      <div style={{
        fontFamily: "'Sora', 'Inter', sans-serif",
        fontWeight: 400,
        fontSize: Math.max(7, size * 0.13) + 'px',
        color: '#9CA3AF',
        letterSpacing: '.1em',
        textAlign: 'center',
        lineHeight: 1.9,
        textTransform: 'uppercase',
      }}>
        Red Técnico • Empresa • Profesor
        <br />
        C.E. Cardenal José María Caro
      </div>
    </div>
  )
}

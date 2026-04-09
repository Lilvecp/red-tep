// Componentes UI reutilizables RED TEP

// ─── Estilos base ─────────────────────────────────────────────────────────────
export const card = {
  background:'var(--surface)', border:'1px solid var(--border)',
  borderRadius:12, padding:'1.25rem',
}

export const cardLg = { ...card, padding:'1.5rem', borderRadius:16 }

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ nombre, size=40, bg='var(--green)', photoUrl=null }) {
  const initials = (nombre||'').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase() || '??'
  if (photoUrl) {
    return (
      <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, overflow:'hidden', border:'2px solid rgba(255,255,255,.1)' }}>
        <img src={photoUrl} alt={nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
      </div>
    )
  }
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:bg, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Sora',sans-serif", fontWeight:700,
      fontSize: size > 44 ? '1.1rem' : '.78rem', color:'#fff',
    }}>{initials}</div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, color='green' }) {
  const colors = {
    green: { bg:'var(--green-glo)', border:'rgba(82,183,136,.3)', color:'var(--green-lit)' },
    amber: { bg:'var(--amber-bg)',  border:'rgba(212,160,23,.3)', color:'var(--amber-lit)' },
    gray:  { bg:'var(--surface2)', border:'var(--border)',        color:'var(--text2)' },
    red:   { bg:'var(--red-bg)',   border:'rgba(224,82,82,.3)',   color:'var(--red)' },
  }
  const c = colors[color] || colors.gray
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      background:c.bg, border:`1px solid ${c.border}`,
      color:c.color, fontSize:'.68rem', fontWeight:600,
      padding:'3px 9px', borderRadius:20,
    }}>{label}</span>
  )
}

// ─── Chip (pill) ──────────────────────────────────────────────────────────────
export function Chip({ label, active=false }) {
  return (
    <span style={{
      background: active ? 'var(--green-glo)' : 'var(--surface2)',
      border: `1px solid ${active ? 'rgba(82,183,136,.25)' : 'var(--border)'}`,
      color: active ? 'var(--green-lit)' : 'var(--text2)',
      fontSize:'.68rem', padding:'3px 9px', borderRadius:20,
    }}>{label}</span>
  )
}

// ─── Botón principal ──────────────────────────────────────────────────────────
export function BtnGreen({ children, onClick, style={}, disabled=false, type='button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      padding:'9px 18px', borderRadius:8, border:'none',
      background: disabled ? 'var(--surface2)' : 'var(--green-mid)',
      color: disabled ? 'var(--text3)' : '#fff',
      fontFamily:"'Figtree','Figtree','DM Sans',sans-serif", fontSize:'.85rem', fontWeight:500,
      cursor: disabled ? 'not-allowed' : 'pointer', transition:'all .18s',
      boxShadow: disabled ? 'none' : '0 3px 10px rgba(38,101,181,.28)',
      ...style,
    }}
      onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.background='var(--green-lit)'; e.currentTarget.style.transform='translateY(-1px)' }}}
      onMouseLeave={e=>{ if(!disabled){ e.currentTarget.style.background='var(--green-mid)'; e.currentTarget.style.transform='translateY(0)' }}}
    >{children}</button>
  )
}

// ─── Botón outline ────────────────────────────────────────────────────────────
export function BtnOutline({ children, onClick, style={} }) {
  return (
    <button onClick={onClick} style={{
      padding:'9px 18px', borderRadius:8,
      border:'1px solid var(--border2)', background:'transparent',
      color:'var(--text2)', fontFamily:"'Figtree','DM Sans',sans-serif",
      fontSize:'.85rem', fontWeight:500, cursor:'pointer', transition:'all .2s',
      ...style,
    }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--green-lit)'; e.currentTarget.style.color='var(--green-lit)' }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border2)';  e.currentTarget.style.color='var(--text2)' }}
    >{children}</button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, style={}, ...props }) {
  return (
    <div style={{ marginBottom:'.85rem' }}>
      {label && <label style={{ display:'block', fontSize:'.75rem', fontWeight:500, marginBottom:4, color:'var(--text2)' }}>{label}</label>}
      <input style={{
        width:'100%', padding:'10px 12px',
        background:'var(--surface)', border:`1px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
        borderRadius:8, color:'var(--text)',
        fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.875rem', outline:'none',
        ...style,
      }} {...props}/>
      {error && <span style={{ fontSize:'.72rem', color:'var(--red)', marginTop:3, display:'block' }}>{error}</span>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:'.85rem' }}>
      {label && <label style={{ display:'block', fontSize:'.75rem', fontWeight:500, marginBottom:4, color:'var(--text2)' }}>{label}</label>}
      <select style={{
        width:'100%', padding:'10px 12px',
        background:'var(--surface)', border:'1px solid var(--border2)',
        borderRadius:8, color:'var(--text)',
        fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.875rem', outline:'none',
      }} {...props}>{children}</select>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ label, value, max=100 }) {
  const pct = Math.round((value/max)*100)
  return (
    <div style={{ marginBottom:'.75rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', marginBottom:'.3rem', color:'var(--text2)' }}>
        <span>{label}</span><span style={{ color:'var(--green-lit)', fontWeight:600 }}>{pct}%</span>
      </div>
      <div style={{ height:6, borderRadius:3, background:'var(--surface2)' }}>
        <div style={{ height:6, borderRadius:3, background:'linear-gradient(to right,var(--green-mid),var(--green-lit))', width:`${pct}%` }}/>
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ num, label, sub, color='var(--green-lit)' }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.1rem', textAlign:'center' }}>
      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:'1.8rem', fontWeight:800, color, marginBottom:2 }}>{num}</div>
      <div style={{ fontSize:'.75rem', color:'var(--text2)' }}>{label}</div>
      {sub && <div style={{ fontSize:'.65rem', color:'var(--text3)', marginTop:'.2rem' }}>{sub}</div>}
    </div>
  )
}

// ─── Sección título ───────────────────────────────────────────────────────────
export function SectionTitle({ children, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
      <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.9rem', color:'var(--text)' }}>{children}</div>
      {action}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, message='Sin datos disponibles' }) {
  return (
    <div style={{ textAlign:'center', padding:'3rem 1rem', color:'var(--text3)' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'1rem', opacity:0.5 }}>
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <div style={{ fontSize:'.9rem' }}>{message}</div>
    </div>
  )
}

import { useEffect, useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import AppLayout from '../../components/layout/AppLayout'
import { BtnGreen, EmptyState } from '../../components/ui'
import { mediaService, workerService } from '../../services'

export default function PracticasPage() {
  const [feed, setFeed]       = useState([])
  const [tipo, setTipo]       = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const load = () => mediaService.getFeed({ tipo }).then(r => setFeed(r.data)).catch(()=>{})

  useEffect(() => { load() }, [tipo])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('descripcion', 'Práctica')
    try {
      await workerService.uploadMedia(fd)
      toast.success('Archivo subido correctamente')
      load()
    } catch { toast.error('Error al subir archivo') }
    finally { setUploading(false) }
  }

  return (
    <AppLayout title="Mis Prácticas"
      actions={<><input ref={fileRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={handleUpload}/><BtnGreen onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Subiendo...' : '+ Subir archivo'}</BtnGreen></>}
    >
      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:'1.25rem' }}>
        {[['','Todos'],['VIDEO','Videos'],['FOTO','Fotos']].map(([v,l]) => (
          <button key={v} onClick={() => setTipo(v)} style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${tipo===v?'var(--green-mid)':'var(--border)'}`, background: tipo===v?'var(--green-glo)':'transparent', color: tipo===v?'var(--green-lit)':'var(--text2)', fontSize:'.78rem', cursor:'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {feed.length === 0 ? (
        <EmptyState icon="🎬" message="Aún no has subido videos ni fotos de tus prácticas."/>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
          {feed.map(m => (
            <div key={m.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', position:'relative' }}>
              {m.tipo === 'VIDEO' ? (
                <video src={m.url} style={{ width:'100%', aspectRatio:'9/12', objectFit:'cover' }} controls/>
              ) : (
                <img src={m.url} alt={m.descripcion} style={{ width:'100%', aspectRatio:'9/12', objectFit:'cover' }}/>
              )}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,.7))', padding:'.6rem .75rem' }}>
                <div style={{ fontSize:'.75rem', fontWeight:500, color:'#fff' }}>{m.worker?.user?.nombre}</div>
                <div style={{ fontSize:'.65rem', color:'rgba(255,255,255,.6)' }}>{m.worker?.especialidad}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}

import { useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Video, Image, PenLine, X } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { postService, mediaService } from '../../services/index'
import { Avatar, BtnGreen } from '../ui/index'

export default function CreatePost({ onCreated }) {
  const { user } = useAuthStore()
  const [content,   setContent]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [focused,   setFocused]   = useState(false)
  const [preview,   setPreview]   = useState(null)   // { url, mediaType, file }
  const [uploading, setUploading] = useState(false)
  const videoRef = useRef()
  const photoRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const localUrl  = URL.createObjectURL(file)
    const mediaType = file.type.startsWith('video') ? 'video' : 'image'
    setPreview({ localUrl, mediaType, file })
    setFocused(true)
    e.target.value = ''
  }

  const removePreview = () => {
    if (preview?.localUrl) URL.revokeObjectURL(preview.localUrl)
    setPreview(null)
  }

  const handleSubmit = async () => {
    if (!content.trim() && !preview) return
    setLoading(true)
    try {
      let mediaUrl  = null
      let mediaType = null

      if (preview) {
        setUploading(true)
        const fd = new FormData()
        fd.append('file', preview.file)
        const { data } = await mediaService.uploadUrl(fd)
        mediaUrl  = data.url
        mediaType = data.mediaType
        setUploading(false)
      }

      const body = { content: content.trim() || ' ' }
      if (mediaUrl)  body.mediaUrl  = mediaUrl
      if (mediaType) body.mediaType = mediaType

      const { data: post } = await postService.create(body)
      toast.success('Publicado')
      setContent('')
      setFocused(false)
      removePreview()
      onCreated(post)
    } catch (err) {
      setUploading(false)
      toast.error(err.response?.data?.error || 'Error al publicar')
    } finally {
      setLoading(false)
    }
  }

  const avColor = user?.role === 'ADMIN' || user?.role === 'TEACHER'
    ? 'var(--amber)'
    : user?.role === 'COMPANY' ? '#40916c' : 'var(--green)'

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:'1rem' }}>
      {/* Input area */}
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'1rem 1.25rem .75rem' }}>
        <Avatar nombre={user?.nombre} size={38} bg={avColor} />
        <div style={{ flex:1 }}>
          <textarea
            placeholder="¿Qué quieres compartir con la red?"
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            rows={focused ? 3 : 2}
            style={{
              width:'100%', padding:'9px 12px', borderRadius:20, resize:'none',
              background:'var(--surface2)', border:'1px solid var(--border2)',
              color:'var(--text)', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.875rem',
              outline:'none', transition:'all .2s', boxSizing:'border-box',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit() }}
          />

          {/* Preview de media adjunta */}
          {preview && (
            <div style={{ position:'relative', marginTop:8, borderRadius:8, overflow:'hidden', maxHeight:240, border:'1px solid var(--border)' }}>
              {preview.mediaType === 'video'
                ? <video src={preview.localUrl} style={{ width:'100%', maxHeight:240, objectFit:'cover' }} controls/>
                : <img src={preview.localUrl} alt="preview" style={{ width:'100%', maxHeight:240, objectFit:'cover', display:'block' }}/>
              }
              <button onClick={removePreview} style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,.6)', border:'none', color:'#fff', borderRadius:'50%', width:24, height:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={13} /></button>
            </div>
          )}

          {/* Publish button (only when focused or has content) */}
          {(focused || content.trim() || preview) && (
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
              <BtnGreen onClick={handleSubmit} disabled={loading || (!content.trim() && !preview)} style={{ fontSize:'.82rem', padding:'7px 18px' }}>
                {uploading ? 'Subiendo...' : loading ? 'Publicando...' : 'Publicar'}
              </BtnGreen>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar — siempre visible */}
      <div style={{ display:'flex', alignItems:'center', gap:0, padding:'.45rem .75rem', borderTop:'1px solid var(--border)', background:'var(--bg2)' }}>
        <input ref={videoRef} type="file" accept="video/*" style={{ display:'none' }} onChange={handleFile}/>
        <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
        {[
          { icon: Video,   label:'Video',    ref: videoRef },
          { icon: Image,   label:'Foto',     ref: photoRef },
          { icon: PenLine, label:'Artículo', action: () => setFocused(true) },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={() => btn.ref ? btn.ref.current?.click() : btn.action?.()}
            style={{
              display:'flex', alignItems:'center', gap:5,
              background:'none', border:'none', color:'var(--text2)',
              padding:'5px 12px', borderRadius:7, cursor:'pointer',
              fontSize:'.78rem', fontWeight:500, transition:'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--surface)'; e.currentTarget.style.color='var(--green-lit)' }}
            onMouseLeave={e => { e.currentTarget.style.background='none';           e.currentTarget.style.color='var(--text2)' }}
          >
            <btn.icon size={15} strokeWidth={2} />
            <span>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

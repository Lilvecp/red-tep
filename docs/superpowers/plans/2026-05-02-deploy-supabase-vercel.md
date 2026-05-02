# Deploy Supabase + Vercel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desplegar RED TEP completo en la nube usando Supabase (PostgreSQL + Realtime) y Vercel (frontend + backend serverless), eliminando Socket.io y Railway.

**Architecture:** El backend Express se expone como serverless function en Vercel via `vercel.json`. Socket.io se reemplaza con Supabase Realtime (subscripción a cambios en la tabla `messages`). El chat sigue enviando mensajes via HTTP al backend, Supabase los empuja automáticamente al frontend.

**Tech Stack:** `@supabase/supabase-js` v2, Vercel CLI, Prisma con connection pooling (pgbouncer), Express sin `http.createServer`.

**Prerequisito:** El plan `2026-05-02-modalidad-perfil.md` debe estar completado y funcionando localmente antes de este plan.

---

### Task 1: Crear proyecto Supabase y obtener credenciales

> Este task es manual — no hay código que escribir.

- [ ] **Step 1: Crear cuenta y proyecto en Supabase**

1. Ir a [supabase.com](https://supabase.com) → "Start your project"
2. Crear cuenta (o entrar con GitHub)
3. Crear nuevo proyecto:
   - Nombre: `red-tep`
   - Password de base de datos: generar una segura y **guardarla**
   - Región: South America (São Paulo) — más cercana a Chile
4. Esperar que el proyecto se inicialice (~2 minutos)

- [ ] **Step 2: Obtener las credenciales**

En el panel de Supabase → Settings → Database:
- Sección **Transaction pooler** → copiar la URL. Se ve así:
  ```
  postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
  ```
- Agregar `?pgbouncer=true` al final si no está.

En Settings → API:
- Copiar **Project URL** (ej: `https://xxxxxxxxxxxx.supabase.co`)
- Copiar **anon public** key

- [ ] **Step 3: Guardar credenciales temporalmente**

Anotar en un lugar seguro (NO commitear):
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Task 2: Migrar la base de datos a Supabase

- [ ] **Step 1: Apuntar DATABASE_URL local a Supabase**

En `backend/.env`, reemplazar `DATABASE_URL` con la del Transaction pooler de Supabase obtenida en Task 1.

- [ ] **Step 2: Ejecutar todas las migraciones**

```bash
cd backend
npx prisma migrate deploy
```
Expected: `All migrations have been successfully applied.`

- [ ] **Step 3: Ejecutar el seed**

```bash
cd backend
node prisma/seed.js
```
Expected: mensajes de éxito sin errores.

- [ ] **Step 4: Verificar en Supabase**

En el panel de Supabase → Table Editor: confirmar que existen las tablas `users`, `workers`, `companies`, etc. con datos del seed.

- [ ] **Step 5: Habilitar Realtime en la tabla messages**

En Supabase → Table Editor → tabla `messages` → clic en el ícono de Replication/Realtime → habilitar para esta tabla.

O bien desde el SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

- [ ] **Step 6: Verificar conexión local funciona con Supabase**

```bash
cd backend
npm run dev
```
Abrir en browser: `http://localhost:8080/api/health`
Expected: `{ "status": "ok", "project": "RED TEP" }`

---

### Task 3: Eliminar Socket.io del backend

**Files:**
- Modify: `backend/src/index.js`
- Modify: `backend/package.json`
- Delete: `backend/src/socket/` (directorio completo)

- [ ] **Step 1: Reemplazar backend/src/index.js**

Reemplazar el contenido completo del archivo con la versión sin Socket.io:
```js
require('dotenv').config()

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length) {
  console.error(`\n❌  Variables de entorno faltantes: ${missing.join(', ')}\n   Revisa tu archivo .env\n`)
  process.exit(1)
}
if (process.env.JWT_SECRET === 'CAMBIA_ESTO_POR_CLAVE_SEGURA_64_CHARS') {
  console.error('\n❌  JWT_SECRET no ha sido cambiado del valor por defecto. Actualiza tu .env\n')
  process.exit(1)
}

const express    = require('express')
const cors       = require('cors')

const authRoutes         = require('./routes/auth.routes')
const workerRoutes       = require('./routes/worker.routes')
const companyRoutes      = require('./routes/company.routes')
const ofertaRoutes       = require('./routes/oferta.routes')
const adminRoutes        = require('./routes/admin.routes')
const mediaRoutes        = require('./routes/media.routes')
const eventoRoutes       = require('./routes/evento.routes')
const postRoutes         = require('./routes/post.routes')
const followRoutes       = require('./routes/follow.routes')
const notificationRoutes = require('./routes/notification.routes')
const filterRoutes       = require('./routes/filter.routes')
const progresoRoutes     = require('./routes/progreso.routes')
const chatRoutes         = require('./routes/chat.routes')
const badgeRoutes        = require('./routes/badge.routes')

const app = express()

const corsOptions = {
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/workers',       workerRoutes)
app.use('/api/companies',     companyRoutes)
app.use('/api/ofertas',       ofertaRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/media',         mediaRoutes)
app.use('/api/eventos',       eventoRoutes)
app.use('/api/posts',         postRoutes)
app.use('/api/follows',       followRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/filters',       filterRoutes)
app.use('/api/progreso',      progresoRoutes)
app.use('/api/chat',          chatRoutes)
app.use('/api/badges',        badgeRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'RED TEP' }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`🚀 RED TEP API corriendo en http://localhost:${PORT}`))

module.exports = app
```

Diferencias clave respecto al original:
- Eliminado `http`, `socket.io`, `http.createServer`, `io`, `require('./socket/chat.socket')`
- `app.listen()` en lugar de `server.listen()`
- `module.exports = app` al final (necesario para Vercel serverless)

- [ ] **Step 2: Eliminar el directorio socket**

```bash
rm -rf backend/src/socket
```

- [ ] **Step 3: Desinstalar socket.io del backend**

```bash
cd backend
npm uninstall socket.io
```

- [ ] **Step 4: Verificar que el backend arranca sin errores**

```bash
cd backend
npm run dev
```
Expected: `🚀 RED TEP API corriendo en http://localhost:8080` sin errores de módulo.

- [ ] **Step 5: Commit**

```bash
git add backend/src/index.js backend/package.json backend/package-lock.json
git rm -r backend/src/socket/
git commit -m "feat: eliminar Socket.io del backend — Express serverless-ready"
```

---

### Task 4: Configurar Vercel para el backend

**Files:**
- Create: `backend/vercel.json`
- Modify: `backend/.env.example`

- [ ] **Step 1: Crear backend/vercel.json**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

- [ ] **Step 2: Actualizar backend/.env.example**

Reemplazar el contenido:
```bash
# ─── Base de datos (Supabase) ──────────────────────────────────────────────────
# Usar Transaction pooler URL de Supabase → Settings → Database
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# ─── JWT ──────────────────────────────────────────────────────────────────────
# Genera: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=CAMBIA_ESTO_POR_CLAVE_SEGURA_64_CHARS
JWT_EXPIRES_IN=24h

# ─── Cloudinary ───────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# ─── Servidor ─────────────────────────────────────────────────────────────────
PORT=8080
NODE_ENV=development

# ─── CORS ─────────────────────────────────────────────────────────────────────
# En producción: URL del frontend en Vercel
FRONTEND_URL=http://localhost:5173
```

- [ ] **Step 3: Instalar Vercel CLI**

```bash
npm install -g vercel
```

- [ ] **Step 4: Deploy del backend**

```bash
cd backend
vercel
```
Seguir el wizard interactivo:
- Set up and deploy → Yes
- Which scope → seleccionar tu cuenta
- Link to existing project → No
- Project name → `red-tep-backend`
- In which directory is your code located? → `./` (ya estamos en backend/)
- Want to modify settings? → No

Anotar la URL de producción que aparece al final, ej: `https://red-tep-backend.vercel.app`

- [ ] **Step 5: Configurar variables de entorno en Vercel**

```bash
vercel env add DATABASE_URL production
# pegar: postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

vercel env add JWT_SECRET production
# pegar: tu clave segura de 64 chars

vercel env add JWT_EXPIRES_IN production
# pegar: 24h

vercel env add CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production

vercel env add NODE_ENV production
# pegar: production

vercel env add FRONTEND_URL production
# pegar: https://red-tep-frontend.vercel.app (se actualizará luego con la URL real)
```

O bien: configurar todas desde el panel web → proyecto → Settings → Environment Variables.

- [ ] **Step 6: Re-deploy con las env vars**

```bash
cd backend
vercel --prod
```

- [ ] **Step 7: Verificar health endpoint en producción**

```bash
curl https://red-tep-backend.vercel.app/api/health
```
Expected: `{"status":"ok","project":"RED TEP"}`

- [ ] **Step 8: Commit**

```bash
git add backend/vercel.json backend/.env.example
git commit -m "feat: backend — vercel.json serverless config, env.example actualizado"
```

---

### Task 5: Instalar Supabase JS y crear cliente

**Files:**
- Create: `frontend/src/lib/supabase.js`
- Modify: `frontend/package.json`
- Modify: `frontend/.env.example`

- [ ] **Step 1: Instalar @supabase/supabase-js**

```bash
cd frontend
npm install @supabase/supabase-js
```

- [ ] **Step 2: Crear frontend/src/lib/supabase.js**

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase env vars no configuradas — Realtime deshabilitado')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')
```

- [ ] **Step 3: Agregar al .env local de desarrollo**

En `frontend/.env` (no commitear), agregar:
```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] **Step 4: Actualizar frontend/.env.example**

Reemplazar el contenido:
```bash
# Backend API
VITE_API_URL=http://localhost:8080/api

# Supabase (para Realtime del chat)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/supabase.js frontend/.env.example frontend/package.json frontend/package-lock.json
git commit -m "feat: frontend — cliente Supabase para Realtime"
```

---

### Task 6: Reemplazar Socket.io por Supabase Realtime en ChatContext

**Files:**
- Modify: `frontend/src/context/ChatContext.jsx`
- Modify: `frontend/package.json`

- [ ] **Step 1: Desinstalar socket.io-client**

```bash
cd frontend
npm uninstall socket.io-client
```

- [ ] **Step 2: Reescribir ChatContext.jsx completo**

Reemplazar el contenido completo de `frontend/src/context/ChatContext.jsx`:

```jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { chatService } from '../services'
import useAuthStore from '../store/authStore'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { user } = useAuthStore()

  const [conversations, setConversations] = useState([])
  const [activeConvId,  setActiveConvId]  = useState(null)
  const [messages,      setMessages]      = useState({})   // { [convId]: Message[] }
  const [widgetOpen,    setWidgetOpen]    = useState(false)
  const [loadingMsgs,   setLoadingMsgs]   = useState(false)

  const loadedConvs     = useRef(new Set())
  const activeConvIdRef = useRef(activeConvId)
  const channelRef      = useRef(null)

  useEffect(() => { activeConvIdRef.current = activeConvId }, [activeConvId])

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  // ── Cargar lista de conversaciones ───────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!user) return
    try {
      const res = await chatService.getConversations()
      setConversations(res.data)
    } catch {}
  }, [user])

  // ── Suscripción Supabase Realtime a tabla messages ────────────────────────────
  useEffect(() => {
    if (!user) return

    loadConversations()

    // Suscribirse a INSERT en tabla messages
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new
          const cid = Number(message.conversation_id)
          // Mapear snake_case de Supabase a camelCase del frontend
          const msg = {
            id:             message.id,
            conversationId: cid,
            senderId:       message.sender_id,
            contenido:      message.contenido,
            mediaUrl:       message.media_url,
            eliminado:      message.eliminado,
            creadoEn:       message.creado_en,
          }
          setMessages(prev => ({ ...prev, [cid]: [...(prev[cid] || []), msg] }))
          setConversations(prev => prev.map(c => {
            if (c.id !== cid) return c
            return {
              ...c,
              lastMessage: msg,
              unreadCount: activeConvIdRef.current === cid ? 0 : (c.unreadCount || 0) + 1,
            }
          }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new
          const cid = Number(message.conversation_id)
          setMessages(prev => ({
            ...prev,
            [cid]: (prev[cid] || []).map(m =>
              m.id === message.id
                ? { ...m, eliminado: message.eliminado, contenido: message.contenido, mediaUrl: message.media_url }
                : m
            ),
          }))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      loadedConvs.current.clear()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cargar mensajes de una conversación ──────────────────────────────────────
  const loadMessages = useCallback(async (convId) => {
    if (loadedConvs.current.has(convId)) return
    setLoadingMsgs(true)
    try {
      const res = await chatService.getMessages(convId)
      setMessages(prev => ({ ...prev, [convId]: res.data }))
      loadedConvs.current.add(convId)
    } catch {} finally { setLoadingMsgs(false) }
  }, [])

  // ── Cargar más mensajes ───────────────────────────────────────────────────────
  const loadMoreMessages = useCallback(async (convId) => {
    const current = messages[convId] || []
    if (current.length === 0) return
    const oldest = current[0].id
    try {
      const res = await chatService.getMessages(convId, oldest)
      if (res.data.length > 0)
        setMessages(prev => ({ ...prev, [convId]: [...res.data, ...(prev[convId] || [])] }))
    } catch {}
  }, [messages])

  // ── Abrir chat 1:1 ────────────────────────────────────────────────────────────
  const openConversation = useCallback(async (targetUserId) => {
    try {
      const res  = await chatService.createConversation({ userIds: [targetUserId] })
      const conv = res.data
      setConversations(prev => {
        if (prev.find(c => c.id === conv.id)) return prev
        return [{ ...conv, unreadCount: 0 }, ...prev]
      })
      setActiveConvId(conv.id)
      setWidgetOpen(true)
      if (!loadedConvs.current.has(conv.id)) {
        const msgs = await chatService.getMessages(conv.id)
        setMessages(prev => ({ ...prev, [conv.id]: msgs.data }))
        loadedConvs.current.add(conv.id)
      }
    } catch {}
  }, [])

  // ── Crear grupo ───────────────────────────────────────────────────────────────
  const createGroup = useCallback(async (userIds, nombre) => {
    try {
      const res  = await chatService.createConversation({ userIds, nombre })
      const conv = res.data
      setConversations(prev => [{ ...conv, unreadCount: 0 }, ...prev])
      setActiveConvId(conv.id)
      setWidgetOpen(true)
      setMessages(prev => ({ ...prev, [conv.id]: [] }))
      loadedConvs.current.add(conv.id)
    } catch {}
  }, [])

  // ── Seleccionar conversación ──────────────────────────────────────────────────
  const selectConv = useCallback(async (convId) => {
    setActiveConvId(convId)
    // Marcar como leído vía API
    chatService.markRead(convId).catch(() => {})
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c))
    await loadMessages(convId)
  }, [loadMessages])

  // ── Enviar mensaje — vía HTTP, Supabase Realtime lo empujará de vuelta ────────
  const sendMessage = useCallback(async (convId, contenido, mediaUrl) => {
    try {
      await chatService.sendMessage(convId, { contenido, mediaUrl })
    } catch {}
  }, [])

  // ── Eliminar mensaje ──────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId, convId) => {
    try {
      await chatService.deleteMessage(messageId)
    } catch {}
  }, [])

  const value = {
    conversations,
    activeConvId,
    messages,
    totalUnread,
    widgetOpen,
    setWidgetOpen,
    loadingMsgs,
    openConversation,
    createGroup,
    selectConv,
    sendMessage,
    deleteMessage,
    loadMoreMessages,
    setActiveConvId,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>')
  return ctx
}
```

- [ ] **Step 3: Verificar que chatService tenga los métodos usados**

En `frontend/src/services/index.js`, buscar `chatService`. Debe tener al menos:
- `getConversations()`
- `getMessages(convId, beforeId?)`
- `createConversation(data)`
- `sendMessage(convId, data)`
- `deleteMessage(messageId)`
- `markRead(convId)` — si no existe, agregar: `markRead: (convId) => api.post(`/chat/conversations/${convId}/read`)`

Si algún método falta, agregarlo al objeto `chatService` en services/index.js siguiendo el patrón existente.

- [ ] **Step 4: Revisar componentes de chat que usaban socketRef**

Buscar usos de `socketRef.current?.emit(` en otros archivos de chat:
```bash
grep -r "socketRef\|socket\.emit\|socket\.on" frontend/src/
```
Si hay componentes que llaman `sendMessage(convId, contenido)` con 2 args, verificar que siguen funcionando (el nuevo `sendMessage` también acepta 2 args: `convId, contenido, mediaUrl`).

Si algún componente llama `deleteMessage(messageId)` sin `convId`, está bien — el nuevo también acepta solo `messageId`.

- [ ] **Step 5: Probar el chat localmente**

```bash
cd frontend && npm run dev
```
1. Abrir dos pestañas del browser, login con usuarios distintos
2. En una pestaña, abrir chat con el otro usuario
3. Enviar un mensaje
4. Verificar que aparece en tiempo real en la otra pestaña (vía Supabase Realtime)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/context/ChatContext.jsx frontend/package.json frontend/package-lock.json
git commit -m "feat: chat — reemplaza Socket.io con Supabase Realtime"
```

---

### Task 7: Configurar backend — chatRoutes para HTTP send/delete/markRead

**Files:**
- Modify: `backend/src/controllers/chat.controller.js`
- Modify: `backend/src/routes/chat.routes.js`

> El chat antes dependía de Socket.io para enviar mensajes (`send-message` event). Ahora usa HTTP. Hay que asegurarse de que existan los endpoints REST para enviar, eliminar y marcar como leído.

- [ ] **Step 1: Revisar chat.controller.js actual**

```bash
cat backend/src/controllers/chat.controller.js
```

Verificar que existen los siguientes handlers:
- `sendMessage` — POST /api/chat/conversations/:id/messages
- `deleteMessage` — DELETE /api/chat/messages/:id
- `markRead` — POST /api/chat/conversations/:id/read (o similar)

- [ ] **Step 2: Si sendMessage no existe, crearlo**

En `chat.controller.js`, agregar:
```js
// POST /api/chat/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    const { contenido, mediaUrl } = req.body
    const conversationId = Number(req.params.id)

    // Verificar que el usuario es miembro de la conversación
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: req.user.id },
    })
    if (!member) return res.status(403).json({ error: 'No eres miembro de esta conversación' })

    const message = await prisma.message.create({
      data: { conversationId, senderId: req.user.id, contenido: contenido || '', mediaUrl: mediaUrl || null },
    })
    res.status(201).json(message)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al enviar mensaje' }) }
}
```

- [ ] **Step 3: Si deleteMessage no existe vía REST, crearlo**

```js
// DELETE /api/chat/messages/:id
const deleteMessage = async (req, res) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: Number(req.params.id) } })
    if (!message) return res.status(404).json({ error: 'Mensaje no encontrado' })
    if (message.senderId !== req.user.id)
      return res.status(403).json({ error: 'No puedes eliminar este mensaje' })
    await prisma.message.update({
      where: { id: message.id },
      data:  { eliminado: true, contenido: '', mediaUrl: null },
    })
    res.json({ message: 'Mensaje eliminado' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al eliminar mensaje' }) }
}
```

- [ ] **Step 4: Si markRead no existe, crearlo**

```js
// POST /api/chat/conversations/:id/read
const markRead = async (req, res) => {
  try {
    await prisma.conversationMember.updateMany({
      where: { conversationId: Number(req.params.id), userId: req.user.id },
      data:  { unreadCount: 0 },
    })
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}
```

- [ ] **Step 5: Registrar rutas en chat.routes.js**

Verificar que las rutas existan. Agregar las faltantes:
```js
r.post('/conversations/:id/messages', verifyToken, isAny, c.sendMessage)
r.delete('/messages/:id',             verifyToken, isAny, c.deleteMessage)
r.post('/conversations/:id/read',     verifyToken, isAny, c.markRead)
```

- [ ] **Step 6: Actualizar chatService en services/index.js con rutas correctas**

```js
export const chatService = {
  getConversations: ()                     => api.get('/chat/conversations'),
  createConversation: (data)               => api.post('/chat/conversations', data),
  getMessages: (convId, before)            => api.get(`/chat/conversations/${convId}/messages`, { params: before ? { before } : {} }),
  sendMessage: (convId, data)              => api.post(`/chat/conversations/${convId}/messages`, data),
  deleteMessage: (messageId)               => api.delete(`/chat/messages/${messageId}`),
  markRead: (convId)                       => api.post(`/chat/conversations/${convId}/read`),
}
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/chat.controller.js backend/src/routes/chat.routes.js frontend/src/services/index.js
git commit -m "feat: chat — endpoints HTTP para send/delete/markRead (reemplaza socket events)"
```

---

### Task 8: Configurar Vercel para el frontend

**Files:**
- Create: `frontend/vercel.json`

- [ ] **Step 1: Crear frontend/vercel.json**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Deploy del frontend**

```bash
cd frontend
vercel
```
Seguir el wizard:
- Project name → `red-tep-frontend`
- Directory → `./`
- Want to override settings? → No (Vite se detecta automáticamente)

Anotar la URL de producción, ej: `https://red-tep-frontend.vercel.app`

- [ ] **Step 3: Configurar variables de entorno del frontend en Vercel**

```bash
vercel env add VITE_API_URL production
# pegar: https://red-tep-backend.vercel.app/api

vercel env add VITE_SUPABASE_URL production
# pegar: https://xxxxxxxxxxxx.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# pegar: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] **Step 4: Re-deploy frontend con env vars**

```bash
cd frontend
vercel --prod
```

- [ ] **Step 5: Actualizar FRONTEND_URL en el backend**

```bash
cd backend
vercel env rm FRONTEND_URL production
vercel env add FRONTEND_URL production
# pegar: https://red-tep-frontend.vercel.app

vercel --prod
```

- [ ] **Step 6: Verificar la app completa en producción**

1. Abrir `https://red-tep-frontend.vercel.app`
2. Registrarse como estudiante y empresa
3. Probar login, ver feed, ver perfil
4. Probar el chat en tiempo real entre dos usuarios
5. Probar subir foto (Cloudinary)

- [ ] **Step 7: Commit**

```bash
git add frontend/vercel.json
git commit -m "feat: frontend — vercel.json SPA rewrite para producción"
```

---

### Task 9: Verificación final y limpieza

- [ ] **Step 1: Verificar que no queda ninguna referencia a socket.io**

```bash
grep -r "socket\.io\|socketRef\|socket\.emit\|socket\.on\|io(" frontend/src/ backend/src/
```
Expected: sin resultados (o solo en comentarios de código eliminado).

- [ ] **Step 2: Verificar variables de entorno de producción**

```bash
# Backend
cd backend && vercel env ls production

# Frontend
cd frontend && vercel env ls production
```
Confirmar que están: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, CLOUDINARY_*, FRONTEND_URL, NODE_ENV para backend. Y VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY para frontend.

- [ ] **Step 3: Smoke test en producción**

```bash
# Health check backend
curl https://red-tep-backend.vercel.app/api/health
# Expected: {"status":"ok","project":"RED TEP"}

# Login
curl -X POST https://red-tep-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@redtep.cl","password":"password123"}'
# Expected: { "user": {...}, "token": "eyJ..." }
```

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "chore: deploy completo — Supabase + Vercel en producción"
```

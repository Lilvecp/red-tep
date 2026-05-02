# Spec: Modalidad de perfil estudiantil + Deploy Supabase/Vercel

**Fecha:** 2026-05-02  
**Autor:** Valentín Castro  
**Estado:** Aprobado

---

## 1. Contexto

RED TEP actualmente tiene un único perfil para todos los estudiantes con un toggle binario `buscandoTrabajo`. Se necesita:

1. Separar los perfiles entre alumnos que buscan **práctica** y los que buscan **trabajo**, con distintos campos visibles en cada modalidad.
2. Agregar el estado **egresado** como evolución natural del perfil estudiantil, confirmado por el admin.
3. Desplegar la aplicación completa en **Supabase** (base de datos + realtime) y **Vercel** (frontend + backend serverless), eliminando Railway y Socket.io.

---

## 2. Cambios de schema

### 2.1 Modelo `Worker`

Agregar los siguientes campos:

```prisma
modalidad          String?  // null | BUSCANDO_PRACTICA | BUSCANDO_TRABAJO | EGRESADO
anioEgreso         Int?     // se llena al confirmar egreso
egresadoSolicitado Boolean  @default(false)
pretensionRenta    String?  // solo relevante en modalidad TRABAJO / EGRESADO
```

Eliminar `buscandoTrabajo Boolean`. En la migración:
- `buscandoTrabajo: true` → `modalidad = 'BUSCANDO_TRABAJO'`
- `buscandoTrabajo: false` → `modalidad = null`

### 2.2 Tabla `admin_notifications`

Agregar nuevo tipo `EGRESO_REQUEST` al campo `tipo` (ya es String libre, no requiere migración de enum).

---

## 3. Backend

### 3.1 Nuevos endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| PATCH | `/api/workers/me/modalidad` | Cambia modalidad a PRACTICA o TRABAJO (o null) |
| POST | `/api/workers/me/request-egreso` | Solicita egreso → crea AdminNotification tipo EGRESO_REQUEST |
| PUT | `/api/admin/egreso-requests/:id/approve` | Admin aprueba: setea `modalidad = EGRESADO`, `anioEgreso = año actual`, `egresadoSolicitado = false` |
| PUT | `/api/admin/egreso-requests/:id/reject` | Admin rechaza: setea `egresadoSolicitado = false` |

### 3.2 Endpoint existente a actualizar

- `GET /api/workers` (feed/candidatos): reemplazar filtro `buscandoTrabajo` por filtro `modalidad`. Acepta `?modalidad=BUSCANDO_PRACTICA`, `?modalidad=BUSCANDO_TRABAJO`, o sin filtro (devuelve todos con modalidad no nula).
- `PATCH /api/workers/me`: eliminar campo `buscandoTrabajo` del body permitido, agregar `pretensionRenta`.

### 3.3 Eliminar Socket.io

- Eliminar directorio `backend/src/socket/`
- Eliminar dependencias `socket.io` del `package.json`
- Eliminar inicialización de Socket.io en `backend/src/index.js`

---

## 4. Frontend

### 4.1 Selector de modalidad (reemplaza el toggle)

En `ProfilePage.jsx > StudentProfile`, el toggle `buscandoTrabajo` se reemplaza por:

- Selector de 3 opciones: `No disponible` / `Buscando práctica` / `Buscando trabajo`
- Sección separada "Estado de egreso" con botón "Solicitar egreso" (visible si `modalidad !== 'EGRESADO'` y `!egresadoSolicitado`). Si `egresadoSolicitado = true`, muestra "Egreso en revisión".

### 4.2 Campos por modalidad

| Campo | Sin modalidad | PRACTICA | TRABAJO | EGRESADO |
|-------|--------------|----------|---------|---------|
| Curso actual | visible | destacado | visible | oculto |
| Progreso formativo | visible | prominente | visible | oculto |
| Validaciones docente | visible | prominente | visible | visible |
| Disponibilidad | visible | días/horas | horario completo | horario completo |
| Pretensión de renta | oculto | oculto | opcional | opcional |
| Año de egreso | — | — | — | badge dorado |
| CV | visible | visible | destacado | destacado |

### 4.3 Badges visuales en tarjeta de perfil

- `BUSCANDO_PRACTICA` → pill azul "Buscando práctica"
- `BUSCANDO_TRABAJO` → pill verde "Buscando trabajo"
- `EGRESADO` → pill dorado "Egresado [anioEgreso] ✓"
- `null` → sin badge de modalidad

Aplica en: `ProfilePage`, `PublicWorkerProfile`, `PostCard` (avatar con badge).

### 4.4 Filtros en feed y candidatos

Reemplazar el filtro de disponibilidad actual por selector de modalidad:
- Todos | Buscando práctica | Buscando trabajo | Egresados

### 4.5 AdminDashboard

Agregar sección "Solicitudes de Egreso" (misma estructura que liceo y badges):
- Lista de workers con `egresadoSolicitado = true`
- Botones Aprobar / Rechazar

### 4.6 Chat: Socket.io → Supabase Realtime

- Instalar `@supabase/supabase-js` en frontend
- Reescribir `frontend/src/hooks/useChat.js` para suscribirse a cambios en la tabla `messages` via Supabase Realtime
- El backend sigue guardando mensajes vía HTTP (`chat.controller.js`), Supabase los empuja automáticamente al frontend
- Eliminar cliente `socket.io-client` del frontend

---

## 5. Deploy

### 5.1 Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar **Transaction pooler URL** como `DATABASE_URL` (formato: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`)
3. Copiar `Project URL` y `anon public key` para las variables de Supabase Realtime
4. Habilitar Realtime en la tabla `messages` desde el panel de Supabase (Table Editor → Replication)
5. Ejecutar `npx prisma migrate deploy` apuntando a Supabase
6. Ejecutar `node prisma/seed.js` para datos iniciales

### 5.2 Backend en Vercel

Agregar `backend/vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "src/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/index.js" }]
}
```

Variables de entorno en Vercel (backend):
- `DATABASE_URL` — Transaction pooler URL de Supabase
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `FRONTEND_URL` — URL del frontend en Vercel (se agrega después del primer deploy)
- `NODE_ENV=production`

### 5.3 Frontend en Vercel

Agregar `frontend/vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Variables de entorno en Vercel (frontend):
- `VITE_API_URL` — URL del backend en Vercel (se conoce tras el primer deploy del backend)
- `VITE_SUPABASE_URL` — Project URL de Supabase
- `VITE_SUPABASE_ANON_KEY` — anon public key de Supabase

### 5.4 Orden de deploy

1. Crear proyecto Supabase → migrar BD → seed
2. Deploy backend en Vercel → obtener URL
3. Actualizar `FRONTEND_URL` en backend con URL del frontend (después del paso 4)
4. Deploy frontend en Vercel → obtener URL → actualizar `FRONTEND_URL` en backend

---

## 6. Archivos clave a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/prisma/schema.prisma` | Agregar campos modalidad, anioEgreso, egresadoSolicitado, pretensionRenta; eliminar buscandoTrabajo |
| `backend/prisma/seed.js` | Actualizar workers seed con modalidad |
| `backend/src/controllers/auth.controller.js` | Eliminar buscandoTrabajo en create worker |
| `backend/src/controllers/worker.controller.js` | Agregar endpoint modalidad, request-egreso; actualizar filtro |
| `backend/src/controllers/admin.controller.js` | Agregar approve/reject egreso |
| `backend/src/routes/worker.routes.js` | Nuevas rutas modalidad y egreso |
| `backend/src/routes/admin.routes.js` | Nuevas rutas egreso |
| `backend/src/index.js` | Eliminar Socket.io |
| `backend/vercel.json` | Nuevo — config serverless |
| `frontend/src/hooks/useChat.js` | Reescribir con Supabase Realtime |
| `frontend/src/pages/ProfilePage.jsx` | Selector modalidad, campos condicionales, botón egreso |
| `frontend/src/pages/worker/PublicWorkerProfile.jsx` | Badges de modalidad |
| `frontend/src/pages/FeedPage.jsx` | Filtro por modalidad |
| `frontend/src/components/feed/PostCard.jsx` | Badge modalidad en avatar |
| `frontend/src/pages/AdminDashboard` o sección admin | Sección solicitudes de egreso |
| `frontend/vercel.json` | Nuevo — SPA rewrite |
| `frontend/src/lib/supabase.js` | Nuevo — cliente Supabase |

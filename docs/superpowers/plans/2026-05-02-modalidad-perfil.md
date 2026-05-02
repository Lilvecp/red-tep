# Modalidad de Perfil Estudiantil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar los perfiles de estudiantes en tres modalidades (práctica, trabajo, egresado), con flujo de solicitud de egreso confirmado por el admin.

**Architecture:** Se agrega el campo `modalidad` al modelo `Worker` reemplazando el booleano `buscandoTrabajo`. El perfil del estudiante muestra secciones distintas según modalidad. El egreso sigue el patrón existente de `liceoValidado`: el alumno solicita, el admin aprueba/rechaza.

**Tech Stack:** Prisma (migration manual con data migration), Express, React 18, Tailwind + CSS variables del proyecto.

---

### Task 1: Migración de schema Prisma

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260502000000_add_modalidad_worker/migration.sql`

- [ ] **Step 1: Modificar schema.prisma**

En `backend/prisma/schema.prisma`, en el modelo `Worker`, reemplazar:
```prisma
  buscandoTrabajo          Boolean          @default(true)
```
Por:
```prisma
  // Modalidad de búsqueda — reemplaza buscandoTrabajo
  modalidad                String?          // null | BUSCANDO_PRACTICA | BUSCANDO_TRABAJO | EGRESADO
  anioEgreso               Int?
  egresadoSolicitado       Boolean          @default(false)
  pretensionRenta          String?
```

- [ ] **Step 2: Crear el archivo de migración manual**

Crear `backend/prisma/migrations/20260502000000_add_modalidad_worker/migration.sql`:
```sql
-- AddColumn modalidad, anioEgreso, egresadoSolicitado, pretensionRenta
ALTER TABLE "workers" ADD COLUMN "modalidad" TEXT;
ALTER TABLE "workers" ADD COLUMN "anio_egreso" INTEGER;
ALTER TABLE "workers" ADD COLUMN "egresado_solicitado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workers" ADD COLUMN "pretension_renta" TEXT;

-- Data migration: convertir buscandoTrabajo a modalidad
UPDATE "workers" SET "modalidad" = 'BUSCANDO_TRABAJO' WHERE "buscando_trabajo" = true;

-- Drop columna antigua
ALTER TABLE "workers" DROP COLUMN "buscando_trabajo";
```

- [ ] **Step 3: Aplicar la migración**

```bash
cd backend
npx prisma migrate resolve --applied 20260502000000_add_modalidad_worker
npx prisma generate
```

Si la BD está limpia (desarrollo), también puedes usar:
```bash
npx prisma migrate dev --name add_modalidad_worker
```
(En ese caso, Prisma generará la migración automáticamente, pero NO incluirá el `UPDATE` de data migration. Agrégalo manualmente al archivo generado antes de aplicar.)

- [ ] **Step 4: Verificar que Prisma Client se regeneró sin errores**

```bash
node -e "const p = require('./src/utils/prisma'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 5: Actualizar seed.js**

En `backend/prisma/seed.js`, buscar todos los usos de `buscandoTrabajo` y reemplazarlos por `modalidad`. Por ejemplo:
```js
// Antes:
{ buscandoTrabajo: true }
// Después:
{ modalidad: 'BUSCANDO_TRABAJO' }

// Para workers sin disponibilidad:
{ modalidad: null }
```

- [ ] **Step 6: Commit**

```bash
cd backend
git add prisma/schema.prisma prisma/migrations/20260502000000_add_modalidad_worker/migration.sql prisma/seed.js
git commit -m "feat: schema Worker — reemplaza buscandoTrabajo por modalidad"
```

---

### Task 2: Backend — worker.controller.js

**Files:**
- Modify: `backend/src/controllers/worker.controller.js`

- [ ] **Step 1: Actualizar WORKER_FIELDS**

Reemplazar la línea:
```js
const WORKER_FIELDS = [
  'edad','telefono','direccion','fotoUrl','curso','especialidad','establecimiento',
  'experienciaPractica','disponibilidad','videoUrl','bannerColor','evaluacionSocioem',
  'buscandoTrabajo','progreso','cvUrl',
]
```
Por:
```js
const WORKER_FIELDS = [
  'edad','telefono','direccion','fotoUrl','curso','especialidad','establecimiento',
  'experienciaPractica','disponibilidad','videoUrl','bannerColor','evaluacionSocioem',
  'progreso','cvUrl','pretensionRenta',
]
```

- [ ] **Step 2: Agregar función setModalidad**

Agregar después de `uploadCv`:
```js
// PATCH /api/workers/me/modalidad
const setModalidad = async (req, res) => {
  try {
    const { modalidad } = req.body
    const valid = [null, 'BUSCANDO_PRACTICA', 'BUSCANDO_TRABAJO']
    if (!valid.includes(modalidad ?? null))
      return res.status(400).json({ error: 'modalidad inválida. Opciones: null, BUSCANDO_PRACTICA, BUSCANDO_TRABAJO' })

    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })
    if (worker.modalidad === 'EGRESADO')
      return res.status(400).json({ error: 'Los egresados no pueden cambiar de modalidad' })

    const updated = await prisma.worker.update({
      where: { id: worker.id },
      data:  { modalidad: modalidad || null },
    })
    res.json(updated)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

- [ ] **Step 3: Agregar función requestEgreso**

Agregar después de `setModalidad`:
```js
// POST /api/workers/me/request-egreso
const requestEgreso = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })
    if (worker.modalidad === 'EGRESADO')
      return res.status(400).json({ error: 'Ya eres egresado' })
    if (worker.egresadoSolicitado)
      return res.status(400).json({ error: 'Tu solicitud ya está en revisión' })

    const updated = await prisma.worker.update({
      where: { id: worker.id },
      data:  { egresadoSolicitado: true },
    })

    const workerNombre = req.user.nombre || 'Estudiante'
    prisma.adminNotification.create({
      data: {
        tipo:         'EGRESO_REQUEST',
        mensaje:      `${workerNombre} solicita confirmar su egreso del liceo`,
        workerId:     worker.id,
        workerNombre,
      },
    }).catch(e => console.warn('egreso notification (non-fatal):', e.message))

    res.json({ message: 'Solicitud de egreso enviada al administrador', worker: updated })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al enviar solicitud: ' + err.message }) }
}
```

- [ ] **Step 4: Actualizar la función search**

Reemplazar la función `search` completa:
```js
// GET /api/workers/search
const search = async (req, res) => {
  try {
    const { especialidad, disponibilidad, validado, nombre, modalidad: modalidadFilter } = req.query
    const skipFiltro = req.query.all === 'true'

    const workers = await prisma.worker.findMany({
      where: {
        user: {
          activo: true,
          role: { in: [...STUDENT_ROLES] },
          ...(nombre && { nombre: { contains: nombre, mode: 'insensitive' } }),
        },
        // Sin filtro explícito: solo mostrar workers con alguna modalidad activa
        ...(!skipFiltro && !modalidadFilter && { modalidad: { not: null } }),
        ...(modalidadFilter && { modalidad: modalidadFilter }),
        ...(especialidad   && { especialidad }),
        ...(disponibilidad && { disponibilidad }),
        ...(validado === 'true' && { validaciones: { some: {} } }),
      },
      include: {
        user:        { select: { nombre: true, email: true } },
        habilidades: true, validaciones: true, insignias: true,
      }
    })
    res.json({ total: workers.length, results: workers })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

- [ ] **Step 5: Actualizar el export al final del archivo**

Reemplazar:
```js
module.exports = { getMe, updateMe, getById, getByUserId, search, requestLiceo, uploadCv, deleteLiceoFeedback, deleteBadgeFeedback }
```
Por:
```js
module.exports = { getMe, updateMe, getById, getByUserId, search, requestLiceo, uploadCv, setModalidad, requestEgreso, deleteLiceoFeedback, deleteBadgeFeedback }
```

- [ ] **Step 6: Test manual con curl**

```bash
# Arrancar el servidor
cd backend && npm run dev

# En otra terminal — reemplazar TOKEN con un JWT de estudiante válido
curl -X PATCH http://localhost:8080/api/workers/me/modalidad \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modalidad":"BUSCANDO_PRACTICA"}'
```
Expected: JSON del worker con `modalidad: "BUSCANDO_PRACTICA"`

```bash
curl -X PATCH http://localhost:8080/api/workers/me/modalidad \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modalidad":null}'
```
Expected: JSON del worker con `modalidad: null`

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/worker.controller.js
git commit -m "feat: worker — setModalidad, requestEgreso, actualiza search por modalidad"
```

---

### Task 3: Backend — admin.controller.js

**Files:**
- Modify: `backend/src/controllers/admin.controller.js`

- [ ] **Step 1: Agregar getEgresoRequests**

Al final del archivo, antes del `module.exports`, agregar:
```js
// ─── Egreso requests ──────────────────────────────────────────────────────────
const getEgresoRequests = async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      where: { egresadoSolicitado: true },
      include: { user: { select: { nombre: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(workers)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const approveEgreso = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { id: Number(req.params.workerId) } })
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' })
    const updated = await prisma.worker.update({
      where: { id: worker.id },
      data:  { modalidad: 'EGRESADO', anioEgreso: new Date().getFullYear(), egresadoSolicitado: false },
    })
    res.json({ message: 'Egreso aprobado', worker: updated })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const rejectEgreso = async (req, res) => {
  try {
    const worker = await prisma.worker.update({
      where: { id: Number(req.params.workerId) },
      data:  { egresadoSolicitado: false },
    })
    res.json({ message: 'Solicitud de egreso rechazada', worker })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

- [ ] **Step 2: Agregar al module.exports**

Encontrar la línea `module.exports = {` al final del archivo y agregar `getEgresoRequests, approveEgreso, rejectEgreso` al objeto exportado.

- [ ] **Step 3: Test manual**

```bash
# GET egreso requests (necesita JWT de admin)
curl http://localhost:8080/api/admin/egreso-requests \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
Expected: `[]` (vacío inicialmente)

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/admin.controller.js
git commit -m "feat: admin — getEgresoRequests, approveEgreso, rejectEgreso"
```

---

### Task 4: Backend — rutas

**Files:**
- Modify: `backend/src/routes/worker.routes.js`
- Modify: `backend/src/routes/admin.routes.js`

- [ ] **Step 1: Agregar rutas en worker.routes.js**

Después de la línea `r.post('/me/request-liceo', ...)`, agregar:
```js
r.patch('/me/modalidad',       verifyToken, isWorker, c.setModalidad)
r.post('/me/request-egreso',   verifyToken, isWorker, c.requestEgreso)
```

Y actualizar el require del controller para incluir los nuevos métodos (ya están en el export del Task 2).

- [ ] **Step 2: Agregar rutas en admin.routes.js**

Después del bloque de `badge-requests`, agregar:
```js
// Egreso requests
r.get('/egreso-requests',                    verifyToken, isAdmin, c.getEgresoRequests)
r.put('/egreso-requests/:workerId/approve',  verifyToken, isAdmin, c.approveEgreso)
r.put('/egreso-requests/:workerId/reject',   verifyToken, isAdmin, c.rejectEgreso)
```

- [ ] **Step 3: Test manual completo del flujo**

```bash
# 1. Solicitar egreso como estudiante
curl -X POST http://localhost:8080/api/workers/me/request-egreso \
  -H "Authorization: Bearer STUDENT_TOKEN"
# Expected: { "message": "Solicitud de egreso enviada al administrador", "worker": {...} }

# 2. Ver solicitudes como admin
curl http://localhost:8080/api/admin/egreso-requests \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: [{ "id": 1, "egresadoSolicitado": true, "user": {...} }]

# 3. Aprobar
curl -X PUT http://localhost:8080/api/admin/egreso-requests/1/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: { "message": "Egreso aprobado", "worker": { "modalidad": "EGRESADO", "anioEgreso": 2026 } }
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/worker.routes.js backend/src/routes/admin.routes.js
git commit -m "feat: rutas — modalidad, egreso (worker + admin)"
```

---

### Task 5: Frontend — services

**Files:**
- Modify: `frontend/src/services/index.js`

- [ ] **Step 1: Agregar métodos a workerService**

En el objeto `workerService`, agregar después de `deleteBadgeFeedback`:
```js
  setModalidad:        (modalidad) => api.patch('/workers/me/modalidad', { modalidad }),
  requestEgreso:       ()          => api.post('/workers/me/request-egreso'),
```

- [ ] **Step 2: Agregar métodos a adminService**

En el objeto `adminService`, agregar al final:
```js
  getEgresoRequests:   ()           => api.get('/admin/egreso-requests'),
  approveEgreso:       (workerId)   => api.put(`/admin/egreso-requests/${workerId}/approve`),
  rejectEgreso:        (workerId)   => api.put(`/admin/egreso-requests/${workerId}/reject`),
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/index.js
git commit -m "feat: services — setModalidad, requestEgreso, admin egreso endpoints"
```

---

### Task 6: Frontend — ProfilePage (selector de modalidad + campos condicionales)

**Files:**
- Modify: `frontend/src/pages/ProfilePage.jsx`

- [ ] **Step 1: Reemplazar el estado `buscando` por `modalidad`**

En `StudentProfile`, reemplazar:
```js
const [buscando, setBuscando] = useState(true)
```
Por:
```js
const [modalidad, setModalidad] = useState(null) // null | 'BUSCANDO_PRACTICA' | 'BUSCANDO_TRABAJO' | 'EGRESADO'
```

En el `useEffect`, reemplazar:
```js
setBuscando(wd.buscandoTrabajo !== false)
```
Por:
```js
setModalidad(wd.modalidad || null)
```

En el objeto `form` del `useEffect`, reemplazar el campo `disponibilidad` para que siga igual, y agregar `pretensionRenta`:
```js
setForm({
  // ... campos existentes ...
  pretensionRenta: wd.pretensionRenta || '',
})
```

- [ ] **Step 2: Reemplazar la función toggleBuscando por changeModalidad**

Eliminar la función `toggleBuscando` y reemplazarla por:
```js
const changeModalidad = async (next) => {
  // EGRESADO no se puede cambiar manualmente
  if (worker?.modalidad === 'EGRESADO') return
  try {
    await workerService.setModalidad(next)
    setModalidad(next)
    const labels = { BUSCANDO_PRACTICA: 'Buscando práctica', BUSCANDO_TRABAJO: 'Buscando trabajo', null: 'No disponible' }
    toast.success(labels[next] || 'Estado actualizado')
  } catch { toast.error('Error al actualizar estado') }
}
```

- [ ] **Step 3: Reemplazar el bloque "Estado laboral" en la tarjeta de perfil**

Localizar el bloque que empieza con `<div style={{ marginTop:'.75rem', paddingTop:'.75rem', borderTop:'1px solid var(--border)' }}>` y contiene el toggle `buscandoTrabajo`. Reemplazarlo con:

```jsx
{/* Estado laboral / modalidad */}
<div style={{ marginTop:'.75rem', paddingTop:'.75rem', borderTop:'1px solid var(--border)' }}>
  <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:'.4rem' }}>Estado laboral</div>
  {worker?.modalidad === 'EGRESADO' ? (
    <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', borderRadius:8, padding:'7px 10px' }}>
      <span style={{ fontSize:'.74rem', color:'#f59e0b', fontWeight:600 }}>
        Egresado {worker.anioEgreso} ✓
      </span>
    </div>
  ) : (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {[
        { value: null,                label: 'No disponible',    color: 'var(--text3)' },
        { value: 'BUSCANDO_PRACTICA', label: 'Buscando práctica', color: '#3B6EDC' },
        { value: 'BUSCANDO_TRABAJO',  label: 'Buscando trabajo',  color: 'rgba(34,197,94,.9)' },
      ].map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => changeModalidad(opt.value)}
          style={{
            display:'flex', alignItems:'center', gap:8, width:'100%',
            background: modalidad === opt.value ? `${opt.color}18` : 'rgba(255,255,255,.04)',
            border: `1px solid ${modalidad === opt.value ? `${opt.color}44` : 'var(--border)'}`,
            borderRadius:7, padding:'6px 10px', cursor:'pointer', transition:'all .2s',
          }}
        >
          <div style={{
            width:10, height:10, borderRadius:'50%',
            background: modalidad === opt.value ? opt.color : 'var(--surface2)',
            border: `1.5px solid ${modalidad === opt.value ? opt.color : 'var(--border2)'}`,
            flexShrink:0,
          }}/>
          <span style={{ fontSize:'.74rem', color: modalidad === opt.value ? opt.color : 'var(--text3)', fontWeight: modalidad === opt.value ? 600 : 400 }}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  )}
</div>

{/* Solicitar egreso */}
{worker?.modalidad !== 'EGRESADO' && (
  <div style={{ marginTop:'.5rem', paddingTop:'.5rem', borderTop:'1px solid var(--border)' }}>
    {worker?.egresadoSolicitado ? (
      <div style={{ textAlign:'center', fontSize:'.72rem', color:'var(--amber-lit)', padding:'.5rem', background:'var(--amber-bg)', borderRadius:8 }}>
        ⏳ Solicitud de egreso en revisión
      </div>
    ) : (
      <button
        onClick={async () => {
          try {
            await workerService.requestEgreso()
            setWorker(w => ({ ...w, egresadoSolicitado: true }))
            toast.success('Solicitud de egreso enviada al administrador')
          } catch (err) { toast.error(err.response?.data?.error || 'Error al enviar solicitud') }
        }}
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:8, padding:'7px 10px', cursor:'pointer', color:'#f59e0b', fontFamily:"'Figtree','DM Sans',sans-serif", fontSize:'.76rem', fontWeight:500 }}
      >
        Solicitar confirmación de egreso
      </button>
    )}
  </div>
)}
```

- [ ] **Step 4: Agregar campo pretensión de renta en el formulario de edición**

En el formulario de edición (dentro del bloque `{editing && (...)}` de la columna derecha), después del campo `disponibilidad`, agregar:
```jsx
{(modalidad === 'BUSCANDO_TRABAJO' || modalidad === 'EGRESADO') && (
  <div style={{ marginBottom:'.75rem' }}>
    <label style={lbl}>Pretensión de renta (opcional)</label>
    <input
      style={inp}
      value={form.pretensionRenta || ''}
      onChange={e => setForm({...form, pretensionRenta: e.target.value})}
      placeholder="Ej: $500.000 mensual, a convenir..."
    />
  </div>
)}
```

- [ ] **Step 5: Agregar campo pretensionRenta a la visualización del perfil**

En la sección de info (Mail, Phone, MapPin, Clock), después de Clock, agregar condicionalmente:
```jsx
{(modalidad === 'BUSCANDO_TRABAJO' || modalidad === 'EGRESADO') && worker?.pretensionRenta && (
  <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.76rem', color:'var(--text2)', marginBottom:'.45rem' }}>
    <Briefcase size={13} strokeWidth={1.8} />{worker.pretensionRenta}
  </div>
)}
{modalidad === 'EGRESADO' && worker?.anioEgreso && (
  <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.76rem', color:'#f59e0b', marginBottom:'.45rem', fontWeight:600 }}>
    <Star size={13} strokeWidth={1.8} />Egresado {worker.anioEgreso}
  </div>
)}
```

Asegurarse de que `Briefcase` y `Star` estén en el import de lucide-react (ya están importados en el archivo).

- [ ] **Step 6: Ajustar visibilidad del Progreso Formativo**

La sección de Progreso Formativo ya existe. Añadir lógica para destacarla si `modalidad === 'BUSCANDO_PRACTICA'`. Localizar el bloque `<div style={C}>` que contiene `<SectionTitle>Progreso Formativo</SectionTitle>` y agregar un borde destacado:

```jsx
<div style={{
  ...C,
  ...(modalidad === 'BUSCANDO_PRACTICA' && { border:'1px solid rgba(59,110,220,.3)', boxShadow:'0 0 0 3px rgba(59,110,220,.06)' })
}}>
```

- [ ] **Step 7: Verificar en browser**

```bash
cd frontend && npm run dev
```
1. Login como estudiante → ir a /perfil
2. Verificar que aparece el selector de 3 opciones (No disponible / Buscando práctica / Buscando trabajo)
3. Seleccionar "Buscando práctica" → verificar que la API retorna modalidad correcta
4. Verificar que aparece el botón "Solicitar confirmación de egreso"
5. Seleccionar "Buscando trabajo" → verificar que aparece el campo "Pretensión de renta" en edición

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/ProfilePage.jsx
git commit -m "feat: ProfilePage — selector modalidad, campos condicionales, solicitud egreso"
```

---

### Task 7: Frontend — PublicWorkerProfile (badge de modalidad)

**Files:**
- Modify: `frontend/src/pages/worker/PublicWorkerProfile.jsx`

- [ ] **Step 1: Agregar badge de modalidad en el banner del perfil público**

Leer el archivo para ubicar el bloque de badges (donde se muestran "✓ Validado", "Perfil completo", etc.). Agregar después de los badges existentes:

```jsx
{worker?.modalidad === 'BUSCANDO_PRACTICA' && (
  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(59,110,220,.15)', border:'1px solid rgba(59,110,220,.3)', borderRadius:20, padding:'2px 9px', fontSize:'.67rem', color:'#3B6EDC', fontWeight:600 }}>
    Buscando práctica
  </span>
)}
{worker?.modalidad === 'BUSCANDO_TRABAJO' && (
  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(34,197,94,.12)', border:'1px solid rgba(34,197,94,.25)', borderRadius:20, padding:'2px 9px', fontSize:'.67rem', color:'rgba(34,197,94,.9)', fontWeight:600 }}>
    Buscando trabajo
  </span>
)}
{worker?.modalidad === 'EGRESADO' && (
  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.3)', borderRadius:20, padding:'2px 9px', fontSize:'.67rem', color:'#f59e0b', fontWeight:600 }}>
    Egresado {worker.anioEgreso} ✓
  </span>
)}
```

- [ ] **Step 2: Agregar pretensionRenta en la lista de info**

Localizar donde se muestran email, teléfono, dirección, disponibilidad en el perfil público. Agregar condicionalmente:
```jsx
{(worker?.modalidad === 'BUSCANDO_TRABAJO' || worker?.modalidad === 'EGRESADO') && worker?.pretensionRenta && (
  <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'.76rem', color:'var(--text2)', marginBottom:'.45rem' }}>
    <Briefcase size={13} strokeWidth={1.8}/> {worker.pretensionRenta}
  </div>
)}
```

Asegurarse de que `Briefcase` esté importado de lucide-react.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/worker/PublicWorkerProfile.jsx
git commit -m "feat: PublicWorkerProfile — badge modalidad, pretensionRenta"
```

---

### Task 8: Frontend — CandidatosPage (filtro por modalidad)

**Files:**
- Modify: `frontend/src/pages/company/CandidatosPage.jsx`

- [ ] **Step 1: Leer el archivo para entender la estructura de filtros actual**

```bash
# Identificar dónde se usa workerService.search() y qué filtros existen
grep -n "modalidad\|buscandoTrabajo\|search" frontend/src/pages/company/CandidatosPage.jsx
```

- [ ] **Step 2: Agregar filtro de modalidad**

Agregar un estado para el filtro:
```js
const [modalidadFilter, setModalidadFilter] = useState('') // '' = todos
```

En el objeto de filtros que se pasa a `workerService.search()`, agregar:
```js
...(modalidadFilter && { modalidad: modalidadFilter })
```

- [ ] **Step 3: Agregar selector de modalidad en la UI de filtros**

Junto a los filtros existentes (especialidad, disponibilidad, etc.), agregar:
```jsx
<select
  value={modalidadFilter}
  onChange={e => setModalidadFilter(e.target.value)}
  style={{ /* mismo estilo que los selects existentes */ }}
>
  <option value="">Todos los perfiles</option>
  <option value="BUSCANDO_PRACTICA">Buscando práctica</option>
  <option value="BUSCANDO_TRABAJO">Buscando trabajo</option>
  <option value="EGRESADO">Egresados</option>
</select>
```

- [ ] **Step 4: Agregar badge de modalidad en cada tarjeta de candidato**

Localizar donde se renderiza cada worker en la lista y agregar el badge de modalidad (mismo código del Task 7 Step 1, adaptado al layout de la tarjeta).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/company/CandidatosPage.jsx
git commit -m "feat: CandidatosPage — filtro y badge por modalidad"
```

---

### Task 9: Frontend — AdminDashboard (sección solicitudes de egreso)

**Files:**
- Modify: `frontend/src/pages/admin/AdminDashboard.jsx`

- [ ] **Step 1: Agregar import de adminService.getEgresoRequests (ya está en services)**

Verificar que `adminService` está importado en el archivo (ya está según el código existente).

- [ ] **Step 2: Agregar estado para egreso requests**

En el componente principal, agregar:
```js
const [egresoRequests, setEgresoRequests] = useState([])
```

En el `useEffect` de carga inicial, agregar la llamada:
```js
adminService.getEgresoRequests()
  .then(r => setEgresoRequests(r.data))
  .catch(() => {})
```

- [ ] **Step 3: Agregar sección colapsable de egreso**

Siguiendo el patrón exacto de las secciones existentes de liceo y badges en el AdminDashboard, agregar una nueva sección "Solicitudes de Egreso":

```jsx
{/* Solicitudes de Egreso */}
<CollapsibleSection
  icon={<School size={16}/>}
  title="Solicitudes de Egreso"
  count={egresoRequests.length}
>
  {egresoRequests.length === 0 ? (
    <div style={{ fontSize:'.82rem', color:'var(--text3)' }}>Sin solicitudes pendientes.</div>
  ) : egresoRequests.map(w => (
    <div key={w.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', borderRadius:8, padding:'.65rem .9rem', marginBottom:6 }}>
      <div>
        <div style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text)' }}>{w.user?.nombre}</div>
        <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>{w.especialidad || 'Sin especialidad'} · {w.user?.email}</div>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button
          onClick={async () => {
            try {
              await adminService.approveEgreso(w.id)
              setEgresoRequests(prev => prev.filter(x => x.id !== w.id))
              toast.success('Egreso aprobado')
            } catch { toast.error('Error') }
          }}
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:7, border:'1px solid rgba(34,197,94,.3)', background:'rgba(34,197,94,.1)', color:'rgba(34,197,94,.9)', fontSize:'.72rem', fontWeight:500, cursor:'pointer' }}
        >
          <CheckCircle size={12}/> Aprobar
        </button>
        <button
          onClick={async () => {
            try {
              await adminService.rejectEgreso(w.id)
              setEgresoRequests(prev => prev.filter(x => x.id !== w.id))
              toast.success('Solicitud rechazada')
            } catch { toast.error('Error') }
          }}
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:7, border:'1px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.08)', color:'rgba(239,68,68,.8)', fontSize:'.72rem', fontWeight:500, cursor:'pointer' }}
        >
          <XCircle size={12}/> Rechazar
        </button>
      </div>
    </div>
  ))}
</CollapsibleSection>
```

Nota: Si el AdminDashboard no usa un componente `CollapsibleSection` reutilizable sino bloques inline, replicar el patrón visual existente de las secciones de liceo o badges.

- [ ] **Step 4: Verificar en browser el flujo completo**

1. Login como estudiante → /perfil → hacer clic en "Solicitar confirmación de egreso"
2. Login como admin → /admin → buscar la sección "Solicitudes de Egreso" → aprobar
3. Volver como estudiante → verificar que el perfil muestra "Egresado 2026 ✓"
4. Verificar que el perfil público también muestra el badge dorado

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/AdminDashboard.jsx
git commit -m "feat: AdminDashboard — sección solicitudes de egreso"
```

---

### Task 10: Métricas admin — actualizar contadores

**Files:**
- Modify: `backend/src/controllers/admin.controller.js`

- [ ] **Step 1: Actualizar getMetrics para contar por modalidad**

En la función `getMetrics`, el `Promise.all` actual cuenta `totalTP` y `totalEPJA` por rol. Agregar conteo por modalidad:

```js
// Dentro del Promise.all de getMetrics, agregar:
prisma.worker.count({ where: { modalidad: 'BUSCANDO_PRACTICA' } }),
prisma.worker.count({ where: { modalidad: 'BUSCANDO_TRABAJO' } }),
prisma.worker.count({ where: { modalidad: 'EGRESADO' } }),
prisma.worker.count({ where: { egresadoSolicitado: true } }),
```

Y en el objeto de respuesta, agregar:
```js
modalidades: { practica: totalPractica, trabajo: totalTrabajo, egresados: totalEgresados },
pendingEgreso: totalPendingEgreso,
```

- [ ] **Step 2: Actualizar el StatCard de egreso en AdminDashboard**

Mostrar el conteo de solicitudes de egreso pendientes junto a los otros metrics si lo deseas (opcional — los egreso requests ya se ven en la sección collapsible).

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/admin.controller.js
git commit -m "feat: admin metrics — conteo por modalidad y egreso pendiente"
```

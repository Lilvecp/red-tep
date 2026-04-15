# Oferta Fix + Admin Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir el error 500 al crear ofertas y agregar retroalimentación inline del admin en validaciones (liceo, insignias, empresa).

**Architecture:** Bug fix de una línea en el controller de ofertas (`requisitos` default `[]`). El feedback se guarda en campos nullable en los modelos existentes (`Worker.liceoFeedback`, `Insignia.adminFeedback`, `Company.adminFeedback`), modificando los endpoints de aprobación/rechazo para aceptar feedback opcional, y exponiendo endpoints DELETE para que el receptor lo elimine. En el frontend, un `ConfirmModal` reutilizable en AdminDashboard reemplaza los clicks directos de Aprobar/Rechazar, y banners condicionales muestran el feedback en los perfiles del trabajador y la empresa.

**Tech Stack:** Node.js + Express + Prisma ORM + PostgreSQL · React 18 + Vite · Lucide icons · react-hot-toast

---

## Archivos a modificar / crear

| Archivo | Acción |
|---------|--------|
| `backend/prisma/schema.prisma` | Agregar 3 campos nullable |
| `backend/prisma/migrations/20260415200000_add_feedback_fields/migration.sql` | Nueva migración |
| `backend/src/controllers/oferta.controller.js` | Fix `requisitos` default |
| `backend/src/controllers/admin.controller.js` | `approveLiceo`, `rejectLiceo`, `approveBadge`, `rejectBadge`, `approveCompany` aceptan `feedback` |
| `backend/src/controllers/worker.controller.js` | Agregar `deleteLiceoFeedback`, `deleteBadgeFeedback` |
| `backend/src/controllers/company.controller.js` | Agregar `deleteFeedback` |
| `backend/src/routes/worker.routes.js` | 2 rutas DELETE nuevas |
| `backend/src/routes/company.routes.js` | 1 ruta DELETE nueva |
| `frontend/src/services/index.js` | Actualizar `adminService`, agregar métodos DELETE a `workerService` y `companyService` |
| `frontend/src/pages/admin/AdminDashboard.jsx` | `ConfirmModal` + lógica inline de feedback |
| `frontend/src/pages/worker/WorkerProfile.jsx` | Banners de `liceoFeedback` e insignias con `adminFeedback` |
| `frontend/src/pages/company/MisOfertasPage.jsx` | Banner de `adminFeedback` de empresa |

---

## Task 1: Bug fix — oferta controller

**Archivos:**
- Modify: `backend/src/controllers/oferta.controller.js:43`

- [ ] **Step 1: Aplicar el fix**

En `backend/src/controllers/oferta.controller.js`, reemplazar la línea 43:
```js
// ANTES
const oferta = await prisma.oferta.create({ data: { ...req.body, companyId: company.id } })

// DESPUÉS
const oferta = await prisma.oferta.create({ data: { ...req.body, companyId: company.id, requisitos: req.body.requisitos || [] } })
```

- [ ] **Step 2: Verificar manualmente**

Con el servidor corriendo (`cd backend && npm run dev`), probar con una empresa (verificada o no):
```bash
curl -s -X POST http://localhost:8080/api/ofertas \
  -H "Authorization: Bearer <TOKEN_EMPRESA>" \
  -H "Content-Type: application/json" \
  -d '{"cargo":"Técnico Electricista","descripcion":"Prueba","disponibilidad":"Tiempo completo"}' | jq .
```
Expected: `{ "id": N, "cargo": "Técnico Electricista", ... }`

- [ ] **Step 3: Commit**
```bash
git add backend/src/controllers/oferta.controller.js
git commit -m "fix: default requisitos to [] when creating oferta"
```

---

## Task 2: Schema — agregar campos de feedback

**Archivos:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260415200000_add_feedback_fields/migration.sql`

- [ ] **Step 1: Agregar campos al schema**

En `backend/prisma/schema.prisma`:

En el modelo `Worker` (después de `cvUrl String?`):
```prisma
liceoFeedback            String?
```

En el modelo `Insignia` (después de `otorgadaEn DateTime @default(now())`):
```prisma
adminFeedback           String?
```

En el modelo `Company` (después de `verificationRequested Boolean @default(false)`):
```prisma
adminFeedback           String?
```

- [ ] **Step 2: Crear la migración**

Crear el archivo `backend/prisma/migrations/20260415200000_add_feedback_fields/migration.sql`:
```sql
-- AddColumn liceoFeedback to workers
ALTER TABLE "workers" ADD COLUMN "liceoFeedback" TEXT;

-- AddColumn adminFeedback to insignias
ALTER TABLE "insignias" ADD COLUMN "adminFeedback" TEXT;

-- AddColumn adminFeedback to companies
ALTER TABLE "companies" ADD COLUMN "adminFeedback" TEXT;
```

- [ ] **Step 3: Aplicar la migración**
```bash
cd backend && npx prisma migrate dev --name add_feedback_fields
```
Expected output: `✔ Generated Prisma Client`

Si hay conflicto con la migración manual, usar en su lugar:
```bash
cd backend && npx prisma db push
```

- [ ] **Step 4: Commit**
```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat: add feedback fields to Worker, Insignia, Company"
```

---

## Task 3: Backend — endpoints de admin aceptan feedback

**Archivos:**
- Modify: `backend/src/controllers/admin.controller.js`

- [ ] **Step 1: Actualizar `approveLiceo`**

Reemplazar la función completa `approveLiceo` (líneas 144-159):
```js
const approveLiceo = async (req, res) => {
  try {
    const workerId = Number(req.params.workerId)
    const { feedback } = req.body
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: { liceoValidado: 'APROBADO', ...(feedback ? { liceoFeedback: feedback } : {}) },
      include: { user: { select: { nombre: true } } },
    })
    await prisma.adminNotification.updateMany({
      where: { workerId, tipo: 'LICEO_VALIDATION', leida: false },
      data:  { leida: true },
    })
    res.json({ message: 'Estudiante validado como alumno del liceo', worker })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

- [ ] **Step 2: Actualizar `rejectLiceo`**

Reemplazar la función completa `rejectLiceo` (líneas 162-175):
```js
const rejectLiceo = async (req, res) => {
  try {
    const workerId = Number(req.params.workerId)
    const { feedback } = req.body
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: { liceoValidado: 'RECHAZADO', ...(feedback ? { liceoFeedback: feedback } : {}) },
    })
    await prisma.adminNotification.updateMany({
      where: { workerId, tipo: 'LICEO_VALIDATION', leida: false },
      data:  { leida: true },
    })
    res.json({ message: 'Solicitud rechazada', worker })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

- [ ] **Step 3: Actualizar `approveBadge`**

Reemplazar la función completa `approveBadge` (líneas 192-207):
```js
const approveBadge = async (req, res) => {
  try {
    const id     = Number(req.params.insigniaId)
    const { feedback } = req.body
    const badge  = await prisma.insignia.update({
      where:   { id },
      data:    { estado: 'APROBADA', ...(feedback ? { adminFeedback: feedback } : {}) },
      include: { worker: { select: { id: true } } },
    })
    await prisma.adminNotification.updateMany({
      where: { referenceId: id, tipo: 'BADGE_REQUEST', leida: false },
      data:  { leida: true },
    })
    res.json({ message: 'Insignia aprobada', badge })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

- [ ] **Step 4: Actualizar `rejectBadge`**

Reemplazar la función completa `rejectBadge` (líneas 210-223):
```js
const rejectBadge = async (req, res) => {
  try {
    const id    = Number(req.params.insigniaId)
    const { feedback } = req.body
    const badge = await prisma.insignia.update({
      where: { id },
      data:  { estado: 'RECHAZADA', ...(feedback ? { adminFeedback: feedback } : {}) },
    })
    await prisma.adminNotification.updateMany({
      where: { referenceId: id, tipo: 'BADGE_REQUEST', leida: false },
      data:  { leida: true },
    })
    res.json({ message: 'Insignia rechazada', badge })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

- [ ] **Step 5: Actualizar `approveCompany`**

Reemplazar la función completa `approveCompany` (líneas 45-52):
```js
const approveCompany = async (req, res) => {
  try {
    const { feedback } = req.body
    const company = await prisma.company.update({
      where: { id: Number(req.params.id) },
      data:  { aprobada: true, ...(feedback ? { adminFeedback: feedback } : {}) },
    })
    res.json({ message: 'Empresa aprobada', company })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

- [ ] **Step 6: Commit**
```bash
git add backend/src/controllers/admin.controller.js
git commit -m "feat: admin approve/reject endpoints accept optional feedback"
```

---

## Task 4: Backend — endpoints DELETE para borrar feedback

**Archivos:**
- Modify: `backend/src/controllers/worker.controller.js`
- Modify: `backend/src/controllers/company.controller.js`
- Modify: `backend/src/routes/worker.routes.js`
- Modify: `backend/src/routes/company.routes.js`

- [ ] **Step 1: Agregar `deleteLiceoFeedback` y `deleteBadgeFeedback` al worker controller**

Al final de `backend/src/controllers/worker.controller.js`, antes de `module.exports`, agregar:
```js
// DELETE /workers/me/liceo-feedback
const deleteLiceoFeedback = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })
    await prisma.worker.update({ where: { id: worker.id }, data: { liceoFeedback: null } })
    res.json({ message: 'Retroalimentación eliminada' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// DELETE /workers/me/badges/:id/feedback
const deleteBadgeFeedback = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })
    const insignia = await prisma.insignia.findFirst({
      where: { id: Number(req.params.id), workerId: worker.id },
    })
    if (!insignia) return res.status(404).json({ error: 'Insignia no encontrada' })
    await prisma.insignia.update({ where: { id: insignia.id }, data: { adminFeedback: null } })
    res.json({ message: 'Retroalimentación eliminada' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

- [ ] **Step 2: Actualizar `module.exports` del worker controller**

El `module.exports` actual es:
```js
module.exports = { getMe, updateMe, getById, getByUserId, search, requestLiceo, uploadCv }
```

Reemplazarlo con:
```js
module.exports = { getMe, updateMe, getById, getByUserId, search, requestLiceo, uploadCv, deleteLiceoFeedback, deleteBadgeFeedback }
```

- [ ] **Step 3: Agregar rutas DELETE al worker router**

En `backend/src/routes/worker.routes.js`, después de `r.post('/me/upload-cv', ...)`:
```js
r.delete('/me/liceo-feedback',         verifyToken, isWorker, c.deleteLiceoFeedback)
r.delete('/me/badges/:id/feedback',    verifyToken, isWorker, c.deleteBadgeFeedback)
```

- [ ] **Step 4: Agregar `deleteFeedback` al company controller**

Al final de `backend/src/controllers/company.controller.js`, antes de `module.exports`:
```js
// DELETE /companies/me/feedback
const deleteFeedback = async (req, res) => {
  try {
    const c = await prisma.company.findUnique({ where: { userId: req.user.id } })
    if (!c) return res.status(404).json({ error: 'Empresa no encontrada' })
    await prisma.company.update({ where: { id: c.id }, data: { adminFeedback: null } })
    res.json({ message: 'Retroalimentación eliminada' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}
```

Actualizar `module.exports`:
```js
module.exports = { getMe, updateMe, getPublic, listApproved, requestVerification, search, deleteFeedback }
```

- [ ] **Step 5: Agregar ruta DELETE al company router**

En `backend/src/routes/company.routes.js`, al final antes de `module.exports`:
```js
r.delete('/me/feedback', verifyToken, isCompany, c.deleteFeedback)
```

- [ ] **Step 6: Commit**
```bash
git add backend/src/controllers/worker.controller.js \
        backend/src/controllers/company.controller.js \
        backend/src/routes/worker.routes.js \
        backend/src/routes/company.routes.js
git commit -m "feat: add DELETE feedback endpoints for workers and companies"
```

---

## Task 5: Frontend — actualizar services

**Archivos:**
- Modify: `frontend/src/services/index.js`

- [ ] **Step 1: Actualizar `adminService`**

En `frontend/src/services/index.js`, reemplazar las líneas de `adminService` que corresponden a `approveCompany`, `approveLiceo`, `rejectLiceo`, `approveBadge`, `rejectBadge`:

```js
export const adminService = {
  getMetrics:      ()                    => api.get('/admin/metrics'),
  getWorkers:      ()                    => api.get('/admin/workers'),
  getPending:      ()                    => api.get('/admin/companies/pending'),
  getAllCompanies:  ()                    => api.get('/admin/companies'),
  approveCompany:  (id, feedback)        => api.put(`/admin/companies/${id}/approve`, { feedback }),
  verifyCompany:   (id)                  => api.put(`/admin/companies/${id}/verify`),
  createValidacion:(data)                => api.post('/admin/validaciones', data),
  getAllUsers:      ()                    => api.get('/admin/users'),
  assignRole:      (id, role)            => api.put(`/admin/users/${id}/role`, { role }),
  getLiceoRequests:()                    => api.get('/admin/liceo-requests'),
  approveLiceo:    (workerId, feedback)  => api.put(`/admin/liceo-requests/${workerId}/approve`, { feedback }),
  rejectLiceo:     (workerId, feedback)  => api.put(`/admin/liceo-requests/${workerId}/reject`, { feedback }),
  getBadgeRequests:()                    => api.get('/admin/badge-requests'),
  approveBadge:    (id, feedback)        => api.put(`/admin/badge-requests/${id}/approve`, { feedback }),
  rejectBadge:     (id, feedback)        => api.put(`/admin/badge-requests/${id}/reject`, { feedback }),
  getAdminNotifications:()               => api.get('/admin/notifications'),
  readAllAdminNotifications:()           => api.put('/admin/notifications/read-all'),
  bulkImport:      (fd)                  => api.post('/admin/bulk-import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
```

- [ ] **Step 2: Agregar métodos a `workerService` y `companyService`**

En el bloque `workerService`, agregar al final del objeto:
```js
deleteLiceoFeedback: ()   => api.delete('/workers/me/liceo-feedback'),
deleteBadgeFeedback: (id) => api.delete(`/workers/me/badges/${id}/feedback`),
```

En el bloque `companyService`, agregar al final del objeto:
```js
deleteFeedback: () => api.delete('/companies/me/feedback'),
```

- [ ] **Step 3: Commit**
```bash
git add frontend/src/services/index.js
git commit -m "feat: update services with feedback params and delete methods"
```

---

## Task 6: Frontend — ConfirmModal en AdminDashboard

**Archivos:**
- Modify: `frontend/src/pages/admin/AdminDashboard.jsx`

Este task modifica el archivo más grande. Hacerlo en sub-pasos para mantener claridad.

- [ ] **Step 1: Agregar el componente `ConfirmModal`**

En `AdminDashboard.jsx`, después de la función `AdminNotifPanel` (aprox. línea 400) y antes del `ProgresoPanel`, agregar este componente:

```jsx
// ─── Confirm Modal with Feedback ─────────────────────────────────────────────
function ConfirmModal({ modal, onClose }) {
  const [feedback, setFeedback] = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => { if (!modal) setFeedback('') }, [modal])

  if (!modal) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await modal.action(feedback.trim() || undefined)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', backdropFilter:'blur(3px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
    >
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1.5rem', width:'100%', maxWidth:400 }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'.95rem', color:'var(--text)', marginBottom:'.3rem' }}>
          {modal.label}
        </div>
        <div style={{ fontSize:'.8rem', color:'var(--text2)', marginBottom:'1.1rem' }}>
          {modal.targetName}
        </div>
        <div style={{ marginBottom:'1.1rem' }}>
          <label style={{ display:'block', fontSize:'.73rem', fontWeight:500, color:'var(--text2)', marginBottom:4 }}>
            Retroalimentación <span style={{ color:'var(--text3)', fontWeight:400 }}>(opcional)</span>
          </label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Escribe un comentario para el estudiante o empresa..."
            style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', outline:'none', resize:'vertical', minHeight:80, boxSizing:'border-box' }}
          />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding:'8px 16px', borderRadius:8, border:'1px solid var(--border2)', background:'none', color:'var(--text2)', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', cursor:'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{ padding:'8px 18px', borderRadius:8, border:'none', background: modal.danger ? '#ef4444' : 'var(--green-mid)', color:'#fff', fontFamily:"'Figtree',sans-serif", fontSize:'.82rem', fontWeight:600, cursor: loading ? 'default' : 'pointer', opacity: loading ? .7 : 1 }}
          >
            {loading ? 'Procesando...' : modal.actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Agregar estado del modal en el componente principal**

En la función principal `export default function AdminDashboard()`, agregar el estado del modal junto a los demás `useState`:
```js
const [confirmModal, setConfirmModal] = useState(null)
```

- [ ] **Step 3: Renderizar `ConfirmModal` en el JSX**

En el `return` del `AdminDashboard`, dentro del `<AppLayout ...>` y antes del primer `<Section>`, agregar:
```jsx
<ConfirmModal modal={confirmModal} onClose={() => setConfirmModal(null)} />
```

- [ ] **Step 4: Actualizar `LiceoPanel` para pasar objeto worker completo**

Cambiar las líneas de onClick de los botones Aprobar y Rechazar dentro de `LiceoPanel`:
```jsx
// ANTES
onClick={() => onApprove(w.id)
onClick={() => onReject(w.id)

// DESPUÉS
onClick={() => onApprove(w)
onClick={() => onReject(w)
```

- [ ] **Step 5: Actualizar manejadores de liceo en AdminDashboard**

Localizar donde se pasan `onApprove` y `onReject` al `LiceoPanel`. Serán funciones del tipo `handleApproveLiceo` / `handleRejectLiceo`. Reemplazarlas para que abran el modal:

```jsx
<LiceoPanel
  requests={liceoRequests}
  onApprove={(w) => setConfirmModal({
    label:       'Aprobar solicitud de liceo',
    targetName:  w.user?.nombre,
    actionLabel: 'Aprobar',
    danger:      false,
    action: async (feedback) => {
      await adminService.approveLiceo(w.id, feedback)
      setLiceoRequests(r => r.filter(x => x.id !== w.id))
      setMetrics(m => m ? { ...m, pendingLiceo: (m.pendingLiceo || 1) - 1 } : m)
      toast.success('Solicitud aprobada')
    },
  })}
  onReject={(w) => setConfirmModal({
    label:       'Rechazar solicitud de liceo',
    targetName:  w.user?.nombre,
    actionLabel: 'Rechazar',
    danger:      true,
    action: async (feedback) => {
      await adminService.rejectLiceo(w.id, feedback)
      setLiceoRequests(r => r.filter(x => x.id !== w.id))
      setMetrics(m => m ? { ...m, pendingLiceo: (m.pendingLiceo || 1) - 1 } : m)
      toast.success('Solicitud rechazada')
    },
  })}
/>
```

- [ ] **Step 6: Actualizar `BadgePanel` para pasar objeto badge completo**

Cambiar las líneas de onClick de los botones Aprobar y Rechazar dentro de `BadgePanel`:
```jsx
// ANTES
onClick={() => onApprove(b.id)
onClick={() => onReject(b.id)

// DESPUÉS
onClick={() => onApprove(b)
onClick={() => onReject(b)
```

- [ ] **Step 7: Actualizar manejadores de badges en AdminDashboard**

Localizar donde se pasan `onApprove` y `onReject` al `BadgePanel`. Reemplazarlos:

```jsx
<BadgePanel
  requests={badgeRequests}
  onApprove={(b) => setConfirmModal({
    label:       'Aprobar insignia',
    targetName:  `${INSIGNIA_LABEL[b.tipo] || b.tipo} — ${b.worker?.user?.nombre}`,
    actionLabel: 'Aprobar',
    danger:      false,
    action: async (feedback) => {
      await adminService.approveBadge(b.id, feedback)
      setBadgeRequests(r => r.filter(x => x.id !== b.id))
      setMetrics(m => m ? { ...m, pendingBadges: (m.pendingBadges || 1) - 1 } : m)
      toast.success('Insignia aprobada')
    },
  })}
  onReject={(b) => setConfirmModal({
    label:       'Rechazar insignia',
    targetName:  `${INSIGNIA_LABEL[b.tipo] || b.tipo} — ${b.worker?.user?.nombre}`,
    actionLabel: 'Rechazar',
    danger:      true,
    action: async (feedback) => {
      await adminService.rejectBadge(b.id, feedback)
      setBadgeRequests(r => r.filter(x => x.id !== b.id))
      setMetrics(m => m ? { ...m, pendingBadges: (m.pendingBadges || 1) - 1 } : m)
      toast.success('Insignia rechazada')
    },
  })}
/>
```

- [ ] **Step 8: Actualizar aprobación de empresas para usar modal**

Localizar donde se llama a `adminService.approveCompany` para empresas pendientes (dentro del bloque `Section` de empresas). Reemplazarlo por:

```jsx
onClick={() => setConfirmModal({
  label:       'Aprobar empresa',
  targetName:  c.nombreEmpresa || c.user?.nombre,
  actionLabel: 'Aprobar',
  danger:      false,
  action: async (feedback) => {
    await adminService.approveCompany(c.id, feedback)
    setPendingCompanies(r => r.filter(x => x.id !== c.id))
    setMetrics(m => m ? { ...m, empresas: { ...m.empresas, pendientes: (m.empresas?.pendientes || 1) - 1 } } : m)
    toast.success('Empresa aprobada')
  },
})}
```

> Nota: El nombre de la variable de empresa (`c`) puede diferir — usa la variable que ya existe en el .map() del panel de empresas pendientes.

- [ ] **Step 9: Commit**
```bash
git add frontend/src/pages/admin/AdminDashboard.jsx
git commit -m "feat: add ConfirmModal with feedback to admin approval/rejection actions"
```

---

## Task 7: Frontend — banners de feedback en WorkerProfile

**Archivos:**
- Modify: `frontend/src/pages/worker/WorkerProfile.jsx`

- [ ] **Step 1: Agregar import de `X` (ícono de cierre) y `workerService`**

`workerService` ya está importado. Agregar `X` a los imports de lucide-react:
```jsx
import { Wrench, Briefcase, X } from 'lucide-react'
```

- [ ] **Step 2: Agregar función helper para el banner de feedback**

Dentro del componente `WorkerProfile`, antes del `return`, agregar la función:
```jsx
const handleDeleteLiceoFeedback = async () => {
  try {
    await workerService.deleteLiceoFeedback()
    setWorker(w => ({ ...w, liceoFeedback: null }))
    toast.success('Retroalimentación eliminada')
  } catch { toast.error('Error al eliminar') }
}

const handleDeleteBadgeFeedback = async (insigniaId) => {
  try {
    await workerService.deleteBadgeFeedback(insigniaId)
    setWorker(w => ({
      ...w,
      insignias: w.insignias.map(i => i.id === insigniaId ? { ...i, adminFeedback: null } : i)
    }))
    toast.success('Retroalimentación eliminada')
  } catch { toast.error('Error al eliminar') }
}
```

- [ ] **Step 3: Agregar componente inline `FeedbackBanner`**

Antes del `return` de `WorkerProfile`, agregar:
```jsx
const FeedbackBanner = ({ text, onDelete }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(77,160,232,.07)', border:'1px solid rgba(77,160,232,.2)', borderRadius:9, padding:'.7rem .9rem', marginTop:'.65rem' }}>
    <div style={{ flex:1, fontSize:'.78rem', color:'var(--text2)', lineHeight:1.5 }}>
      <span style={{ fontWeight:600, color:'var(--text)', display:'block', fontSize:'.7rem', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>Comentario del administrador</span>
      {text}
    </div>
    <button
      onClick={onDelete}
      title="Borrar retroalimentación"
      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:2, display:'flex', alignItems:'center', flexShrink:0 }}
    >
      <X size={14} />
    </button>
  </div>
)
```

- [ ] **Step 4: Mostrar `liceoFeedback` en la tarjeta principal**

En la sección izquierda de la tarjeta principal, localizar donde se muestran los badges de validación (cerca de línea 56-59 actual):
```jsx
{worker?.validaciones?.length > 0 && <Badge label="✓ Validado" color="green"/>}
{worker?.perfilCompleto && <Badge label="Perfil completo" color="amber"/>}
```

Después del bloque de badges (aún dentro del `div` de padding `1.1rem`), agregar:
```jsx
{worker?.liceoFeedback && (
  <FeedbackBanner
    text={worker.liceoFeedback}
    onDelete={handleDeleteLiceoFeedback}
  />
)}
```

- [ ] **Step 5: Actualizar sección de insignias para mostrar feedback**

Reemplazar el bloque de insignias (líneas 80-99 aprox.) para usar el registro real de la insignia y mostrar su feedback:

```jsx
<div style={C}>
  <SectionTitle>Insignias</SectionTitle>
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
    {[
      { tipo:'PERFIL_COMPLETO',       icon:'🏅', label:'Perfil' },
      { tipo:'VALIDADO_POR_PROFESOR', icon:'✅', label:'Validado' },
      { tipo:'EXPERIENCIA_PRACTICA',  icon:'🎬', label:'Práctica' },
      { tipo:'PRIMERA_POSTULACION',   icon:'💼', label:'1ª Post.' },
      { tipo:'TOP_CANDIDATO',         icon:'⭐', label:'Top' },
    ].map(({ tipo, icon, label }) => {
      const insigniaRecord = worker?.insignias?.find(i => i.tipo === tipo)
      const earned = !!insigniaRecord
      return (
        <div key={tipo}>
          <div style={{ background: earned ? 'var(--amber-bg)' : 'var(--surface2)', border:`1px solid ${earned ? 'rgba(212,160,23,.3)' : 'var(--border)'}`, borderRadius:8, padding:'.55rem', textAlign:'center' }}>
            <div style={{ fontSize:'1.1rem' }}>{earned ? icon : '🔒'}</div>
            <div style={{ fontSize:'.6rem', color: earned ? 'var(--amber-lit)' : 'var(--text3)', marginTop:2 }}>{label}</div>
          </div>
          {insigniaRecord?.adminFeedback && (
            <FeedbackBanner
              text={insigniaRecord.adminFeedback}
              onDelete={() => handleDeleteBadgeFeedback(insigniaRecord.id)}
            />
          )}
        </div>
      )
    })}
  </div>
</div>
```

- [ ] **Step 6: Commit**
```bash
git add frontend/src/pages/worker/WorkerProfile.jsx
git commit -m "feat: show admin feedback banners on worker profile with delete option"
```

---

## Task 8: Frontend — banner de feedback en página de empresa

**Archivos:**
- Modify: `frontend/src/pages/company/MisOfertasPage.jsx`

- [ ] **Step 1: Agregar import de `X` y `companyService`**

`companyService` ya está importado. Agregar `X` al import de lucide-react:
```jsx
import { ClipboardList, Image, X } from 'lucide-react'
```

- [ ] **Step 2: Agregar estado de empresa**

En `MisOfertasPage`, los datos de empresa se cargan en `load()` con `companyService.getMe()`. La respuesta se usa solo para `r.data.ofertas`. Necesitamos también guardar los datos de la empresa. Cambiar el estado:

```jsx
// Agregar junto a los demás useState:
const [company, setCompany] = useState(null)
```

Actualizar la función `load`:
```jsx
const load = () =>
  companyService.getMe()
    .then(r => { setCompany(r.data); setOfertas(r.data.ofertas || []) })
    .catch(() => {})
    .finally(() => setLoading(false))
```

- [ ] **Step 3: Agregar handler para borrar feedback**

Dentro del componente, antes del `return`:
```jsx
const handleDeleteFeedback = async () => {
  try {
    await companyService.deleteFeedback()
    setCompany(c => ({ ...c, adminFeedback: null }))
    toast.success('Retroalimentación eliminada')
  } catch { toast.error('Error al eliminar') }
}
```

- [ ] **Step 4: Mostrar banner cuando hay feedback**

En el `return`, dentro de `<AppLayout ...>` y antes del bloque `{loading ? ...}`, agregar:
```jsx
{company?.adminFeedback && (
  <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(77,160,232,.07)', border:'1px solid rgba(77,160,232,.2)', borderRadius:10, padding:'.8rem 1rem', marginBottom:'1rem' }}>
    <div style={{ flex:1, fontSize:'.82rem', color:'var(--text2)', lineHeight:1.5 }}>
      <span style={{ fontWeight:600, color:'var(--text)', display:'block', fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>Comentario del administrador</span>
      {company.adminFeedback}
    </div>
    <button
      onClick={handleDeleteFeedback}
      title="Borrar retroalimentación"
      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:2, display:'flex', alignItems:'center', flexShrink:0 }}
    >
      <X size={14} />
    </button>
  </div>
)}
```

- [ ] **Step 5: Commit**
```bash
git add frontend/src/pages/company/MisOfertasPage.jsx
git commit -m "feat: show admin feedback banner on company page with delete option"
```

---

## Verificación final

- [ ] Crear oferta con empresa NO aprobada → debe crearse sin error 500
- [ ] En admin, aprobar solicitud de liceo → aparece modal con textarea → escribir feedback → confirmar → el estudiante ve el banner en su perfil
- [ ] En admin, rechazar insignia sin escribir feedback → se rechaza igual sin error
- [ ] El estudiante borra el feedback desde su perfil → desaparece
- [ ] La empresa borra el feedback desde Mis Ofertas → desaparece
- [ ] Servidor no tiene errores en consola durante ninguna de las acciones anteriores

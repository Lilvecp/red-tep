const prisma = require('../utils/prisma')

const { STUDENT_ROLES } = require('../middleware/auth.middleware')

const include = {
  user:        { select: { nombre: true, email: true } },
  habilidades: true,
  validaciones: { include: { teacher: { select: { nombre: true } } } },
  insignias:   true,
  media:       true,
  postulaciones: { include: { oferta: { include: { company: true } } } },
}

// GET /api/workers/me
const getMe = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id }, include })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })
    res.json(worker)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const WORKER_FIELDS = [
  'edad','telefono','direccion','fotoUrl','curso','especialidad','establecimiento',
  'experienciaPractica','disponibilidad','videoUrl','bannerColor','evaluacionSocioem',
  'modalidad','anioEgreso','egresadoSolicitado','pretensionRenta','progreso','cvUrl',
]

// PUT /api/workers/me
const updateMe = async (req, res) => {
  try {
    const { habilidades, evaluacionSocioem, ...rest } = req.body

    const data = Object.fromEntries(
      Object.entries(rest)
        .filter(([k]) => WORKER_FIELDS.includes(k))
        .map(([k, v]) => [k, v === '' ? null : v])
    )

    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })

    if (habilidades) {
      await prisma.habilidad.deleteMany({ where: { workerId: worker.id } })
      await prisma.habilidad.createMany({ data: habilidades.map(h => ({ ...h, workerId: worker.id })) })
    }

    const updated = await prisma.worker.update({
      where: { id: worker.id },
      data:  { ...data, ...(evaluacionSocioem && { evaluacionSocioem }) },
      include,
    })

    // Badge creation is now handled by progreso.controller.js (dynamic sections)
    // checkInsignias kept for legacy compatibility but no longer called here

    res.json(updated)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/workers/me/request-liceo
const requestLiceo = async (req, res) => {
  try {
    // Find worker
    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })

    // Guard against duplicate/final states
    if (worker.liceoValidado === 'APROBADO')
      return res.status(400).json({ error: 'Ya estás validado como alumno del liceo' })
    if (worker.liceoValidado === 'PENDIENTE')
      return res.status(400).json({ error: 'Tu solicitud ya está en revisión' })

    // Update state
    const updated = await prisma.worker.update({
      where: { id: worker.id },
      data:  { liceoValidado: 'PENDIENTE' },
    })

    // Create admin notification — non-blocking, tolerates missing table
    const workerNombre = req.user.nombre || 'Estudiante'
    prisma.adminNotification.create({
      data: {
        tipo:         'LICEO_VALIDATION',
        mensaje:      `${workerNombre} solicita validación como alumno del liceo`,
        workerId:     worker.id,
        workerNombre,
      },
    }).catch(e => console.warn('adminNotification create (non-fatal):', e.message))

    res.json({ message: 'Solicitud enviada al administrador', worker: updated })
  } catch (err) {
    console.error('requestLiceo error:', err.message)
    res.status(500).json({ error: 'Error al enviar solicitud: ' + err.message })
  }
}

// POST /api/workers/me/upload-cv
const uploadCv = async (req, res) => {
  try {
    const { cvUrl } = req.body
    if (!cvUrl) return res.status(400).json({ error: 'cvUrl requerido' })

    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })

    const updated = await prisma.worker.update({
      where:   { id: worker.id },
      data:    { cvUrl },
      include,
    })
    res.json(updated)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/workers/:id
const getById = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { id: Number(req.params.id) }, include })
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' })
    res.json(worker)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/workers/user/:userId
const getByUserId = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { userId: Number(req.params.userId) }, include })
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' })
    res.json(worker)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/workers/search
const search = async (req, res) => {
  try {
    const { especialidad, disponibilidad, validado, nombre } = req.query
    // `all=true` desactiva el filtro modalidad (usado por el buscador global)
    const skipModalidadFiltro = req.query.all === 'true'
    const workers = await prisma.worker.findMany({
      where: {
        user: {
          activo: true,
          role: { in: [...STUDENT_ROLES] },
          ...(nombre && { nombre: { contains: nombre, mode: 'insensitive' } }),
        },
        ...(!skipModalidadFiltro && { modalidad: { not: null } }),
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

// ─── Badge logic — creates PENDIENTE badges, admin approves ──────────────────
const checkInsignias = async (worker, workerNombre) => {
  const give = async (tipo) => {
    const exists = await prisma.insignia.findFirst({ where: { workerId: worker.id, tipo } })
    if (exists) return // already exists in any state

    const badge = await prisma.insignia.create({
      data: { workerId: worker.id, tipo, estado: 'PENDIENTE' }
    })

    const labels = {
      PERFIL_COMPLETO:      'Perfil técnico completo',
      EXPERIENCIA_PRACTICA: 'Experiencia práctica',
      TOP_CANDIDATO:        'Top candidato',
    }
    // Non-blocking notification
    prisma.adminNotification.create({
      data: {
        tipo:         'BADGE_REQUEST',
        mensaje:      `${workerNombre || 'Estudiante'} completó: ${labels[tipo] || tipo}`,
        workerId:     worker.id,
        workerNombre: workerNombre || '',
        referenceId:  badge.id,
      },
    }).catch(e => console.warn('badge notification (non-fatal):', e.message))
  }

  const progreso = worker.progreso || {}
  if ((progreso.perfilTecnico  || 0) >= 100) {
    await prisma.worker.update({ where: { id: worker.id }, data: { perfilCompleto: true } }).catch(() => {})
    await give('PERFIL_COMPLETO')
  }
  if ((progreso.practicas   || 0) >= 100) await give('EXPERIENCIA_PRACTICA')
  if ((progreso.habilidades || 0) >= 100) await give('TOP_CANDIDATO')
}

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

module.exports = { getMe, updateMe, getById, getByUserId, search, requestLiceo, uploadCv, deleteLiceoFeedback, deleteBadgeFeedback }

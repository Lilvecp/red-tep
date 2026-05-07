const prisma = require('../utils/prisma')

const STUDENT_ROLES = ['STUDENT', 'STUDENT_TP', 'STUDENT_EPJA']

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getWorkerByUserId(userId) {
  return prisma.worker.findUnique({ where: { userId } })
}

// ── GET /api/progreso — active sections + current worker's progress ─────────
const getAll = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN'
    const sections = await prisma.progresoFormativo.findMany({
      where: isAdmin ? {} : { activo: true },
      orderBy: { orden: 'asc' },
      include: isAdmin ? { _count: { select: { progresosUsuario: true } } } : undefined,
    })

    if (STUDENT_ROLES.includes(req.user.role)) {
      const worker = await getWorkerByUserId(req.user.id)
      if (!worker) return res.json(sections.map(s => ({ ...s, porcentaje: 0, insigniaEstado: null })))

      const [progesUser, insignias] = await Promise.all([
        prisma.progresoUsuario.findMany({ where: { workerId: worker.id } }),
        prisma.insignia.findMany({ where: { workerId: worker.id, progresoFormativoId: { not: null } } }),
      ])

      const pMap = {}
      progesUser.forEach(p => { pMap[p.progresoFormativoId] = p.porcentaje })
      const iMap = {}
      insignias.forEach(i => { if (i.progresoFormativoId) iMap[i.progresoFormativoId] = i.estado })

      return res.json(sections.map(s => ({
        ...s,
        porcentaje:    pMap[s.id] || 0,
        insigniaEstado: iMap[s.id] || null,
      })))
    }

    res.json(sections.map(s => ({ ...s, porcentaje: 0, insigniaEstado: null })))
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// ── PUT /api/progreso/me/:progresoId — worker updates their own progress ─────
const updateMio = async (req, res) => {
  try {
    const progresoFormativoId = Number(req.params.progresoId)
    const porcentaje = Math.min(100, Math.max(0, Number(req.body.porcentaje) || 0))

    const worker = await getWorkerByUserId(req.user.id)
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })

    await prisma.progresoUsuario.upsert({
      where:  { workerId_progresoFormativoId: { workerId: worker.id, progresoFormativoId } },
      create: { workerId: worker.id, progresoFormativoId, porcentaje },
      update: { porcentaje },
    })

    let badgeCreated = false
    if (porcentaje >= 100) {
      const existing = await prisma.insignia.findFirst({
        where: { workerId: worker.id, progresoFormativoId, estado: { in: ['PENDIENTE', 'APROBADA'] } },
      })
      if (!existing) {
        const section = await prisma.progresoFormativo.findUnique({ where: { id: progresoFormativoId } })
        await prisma.insignia.create({
          data: { workerId: worker.id, tipo: section?.nombre || 'Progreso completado', estado: 'PENDIENTE', progresoFormativoId },
        })
        // Non-blocking admin notification
        prisma.adminNotification.create({
          data: {
            tipo:        'BADGE_REQUEST',
            mensaje:     `${req.user.nombre} completó "${section?.nombre}" al 100% y solicita insignia`,
            workerId:    worker.id,
            workerNombre: req.user.nombre || '',
          },
        }).catch(e => console.warn('adminNotification (non-fatal):', e.message))
        badgeCreated = true
      }
    }

    res.json({ porcentaje, badgeCreated })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// ── GET /api/admin/progreso — all sections for admin ─────────────────────────
const adminGetAll = async (req, res) => {
  try {
    const sections = await prisma.progresoFormativo.findMany({
      orderBy: { orden: 'asc' },
      include: { _count: { select: { progresosUsuario: true, insignias: true } } },
    })
    res.json(sections)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// ── POST /api/admin/progreso — create section ─────────────────────────────────
const adminCreate = async (req, res) => {
  try {
    const { nombre, descripcion, orden } = req.body
    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' })
    const section = await prisma.progresoFormativo.create({
      data: { nombre: nombre.trim(), descripcion: descripcion?.trim() || null, orden: Number(orden) || 0 },
    })
    res.status(201).json(section)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// ── PUT /api/admin/progreso/:id — update section ──────────────────────────────
const adminUpdate = async (req, res) => {
  try {
    const { nombre, descripcion, activo, orden } = req.body
    const data = {}
    if (nombre     !== undefined) data.nombre      = nombre.trim()
    if (descripcion !== undefined) data.descripcion = descripcion?.trim() || null
    if (activo     !== undefined) data.activo      = activo === true || activo === 'true'
    if (orden      !== undefined) data.orden       = Number(orden)
    const section = await prisma.progresoFormativo.update({
      where: { id: Number(req.params.id) },
      data,
    })
    res.json(section)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// ── DELETE /api/admin/progreso/:id — delete section ──────────────────────────
const adminDelete = async (req, res) => {
  try {
    await prisma.progresoFormativo.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Sección eliminada' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

module.exports = { getAll, updateMio, adminGetAll, adminCreate, adminUpdate, adminDelete }

const prisma = require('../utils/prisma')
const bcrypt = require('bcryptjs')
const XLSX   = require('xlsx')

// ─── Metrics ──────────────────────────────────────────────────────────────────
const getMetrics = async (req, res) => {
  try {
    const [totalTP, totalEPJA, totalEmpresas, empresasPendientes, totalValidaciones, totalOfertas,
      porEspecialidad, pendingLiceo, pendingBadges, unreadNotifs, totalPractica, totalTrabajo, totalEgresados, totalPendingEgreso] = await Promise.all([
      prisma.worker.count({ where: { user: { role: { in: ['STUDENT', 'STUDENT_TP'] }, activo: true } } }),
      prisma.worker.count({ where: { user: { role: 'STUDENT_EPJA', activo: true } } }),
      prisma.company.count({ where: { aprobada: true } }),
      prisma.company.count({ where: { aprobada: false } }),
      prisma.validacion.count(),
      prisma.oferta.count({ where: { activa: true } }),
      prisma.worker.groupBy({ by: ['especialidad'], _count: { id: true }, where: { especialidad: { not: null } } }),
      prisma.worker.count({ where: { liceoValidado: 'PENDIENTE' } }),
      prisma.insignia.count({ where: { estado: 'PENDIENTE' } }),
      prisma.adminNotification.count({ where: { leida: false } }),
      prisma.worker.count({ where: { modalidad: 'BUSCANDO_PRACTICA' } }),
      prisma.worker.count({ where: { modalidad: 'BUSCANDO_TRABAJO' } }),
      prisma.worker.count({ where: { modalidad: 'EGRESADO' } }),
      prisma.worker.count({ where: { egresadoSolicitado: true } }),
    ])

    res.json({
      trabajadores: { tp: totalTP, epja: totalEPJA, total: totalTP + totalEPJA },
      empresas:     { aprobadas: totalEmpresas, pendientes: empresasPendientes },
      validaciones: totalValidaciones,
      ofertas:      totalOfertas,
      porEspecialidad: porEspecialidad.map(e => ({ especialidad: e.especialidad, total: e._count.id })),
      pendingLiceo,
      pendingBadges,
      unreadNotifs,
      modalidades: { practica: totalPractica, trabajo: totalTrabajo, egresados: totalEgresados },
      pendingEgreso: totalPendingEgreso,
    })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// ─── Companies ────────────────────────────────────────────────────────────────
const getPending = async (req, res) => {
  try {
    const pending = await prisma.company.findMany({
      where: { aprobada: false },
      include: { user: { select: { nombre: true, email: true, createdAt: true } } }
    })
    res.json(pending)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

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

const rejectCompany = async (req, res) => {
  try {
    const { feedback } = req.body
    const company = await prisma.company.update({
      where: { id: Number(req.params.id) },
      data: {
        verificationRequested: false,
        ...(feedback ? { adminFeedback: feedback } : {}),
      },
    })
    res.json({ message: 'Verificación rechazada', company })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: { user: { select: { nombre: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(companies)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const verifyCompany = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: Number(req.params.id) } })
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })
    const nowVerified = !company.verified
    const updated = await prisma.company.update({
      where: { id: Number(req.params.id) },
      data: { verified: nowVerified, verificationRequested: false },
    })
    res.json({ message: nowVerified ? 'Empresa verificada' : 'Verificación removida', company: updated })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// ─── Workers ──────────────────────────────────────────────────────────────────
const getAllWorkers = async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      include: {
        user:        { select: { nombre: true, email: true, role: true } },
        habilidades: true, validaciones: true, insignias: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(workers)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// ─── Validaciones (teacher) ───────────────────────────────────────────────────
const createValidacion = async (req, res) => {
  try {
    const { workerId, competencia, nivel, observacion } = req.body
    const val = await prisma.validacion.create({
      data: { workerId: Number(workerId), teacherId: req.user.id, competencia, nivel, observacion }
    })
    const existe = await prisma.insignia.findFirst({ where: { workerId: Number(workerId), tipo: 'VALIDADO_POR_PROFESOR' } })
    if (!existe) await prisma.insignia.create({ data: { workerId: Number(workerId), tipo: 'VALIDADO_POR_PROFESOR', estado: 'APROBADA' } })
    res.status(201).json(val)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// ─── Users ────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nombre: true, email: true, role: true, activo: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(users)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const assignRole = async (req, res) => {
  try {
    const { role } = req.body
    const VALID_ROLES = ['STUDENT','STUDENT_TP','STUDENT_EPJA','TEACHER','COMPANY','ADMIN']
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Rol inválido' })
    const updated = await prisma.user.update({
      where:  { id: Number(req.params.id) },
      select: { id: true, nombre: true, email: true, role: true },
      data:   { role },
    })
    res.json({ message: 'Rol actualizado', user: updated })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      select: { id: true, email: true, nombre: true },
      data: { password: hashed },
    })
    res.json({ message: 'Contraseña actualizada', user })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// ─── Liceo Validation ─────────────────────────────────────────────────────────

// GET /api/admin/liceo-requests  — Pending liceo validations
const getLiceoRequests = async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      where: { liceoValidado: 'PENDIENTE' },
      include: { user: { select: { nombre: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(workers)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// PUT /api/admin/liceo-requests/:workerId/approve
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

// PUT /api/admin/liceo-requests/:workerId/reject
const rejectLiceo = async (req, res) => {
  try {
    const workerId = Number(req.params.workerId)
    const { feedback } = req.body
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data:  { liceoValidado: 'RECHAZADO', ...(feedback ? { liceoFeedback: feedback } : {}) },
      include: { user: { select: { nombre: true } } },
    })
    await prisma.adminNotification.updateMany({
      where: { workerId, tipo: 'LICEO_VALIDATION', leida: false },
      data:  { leida: true },
    })
    res.json({ message: 'Solicitud rechazada', worker })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// ─── Badge (Insignia) Requests ────────────────────────────────────────────────

// GET /api/admin/badge-requests
const getBadgeRequests = async (req, res) => {
  try {
    const badges = await prisma.insignia.findMany({
      where:   { estado: 'PENDIENTE' },
      include: { worker: { include: { user: { select: { nombre: true, email: true } } } } },
      orderBy: { otorgadaEn: 'desc' },
    })
    res.json(badges)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// PUT /api/admin/badge-requests/:insigniaId/approve
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

// PUT /api/admin/badge-requests/:insigniaId/reject
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

// ─── Admin Notifications ──────────────────────────────────────────────────────

// GET /api/admin/notifications
const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const unread = notifications.filter(n => !n.leida).length
    res.json({ notifications, unread })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// PUT /api/admin/notifications/read-all
const readAllAdminNotifications = async (req, res) => {
  try {
    await prisma.adminNotification.updateMany({ where: { leida: false }, data: { leida: true } })
    res.json({ message: 'Notificaciones marcadas como leídas' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// ─── Bulk Import ──────────────────────────────────────────────────────────────

// POST /api/admin/bulk-import  — multipart file (CSV or XLSX)
const bulkImport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' })

    let rows = []
    const buf      = req.file.buffer
    const mimetype = req.file.mimetype
    const origname = (req.file.originalname || '').toLowerCase()

    if (origname.endsWith('.csv') || mimetype === 'text/csv' || mimetype === 'text/plain') {
      // Parse CSV manually (UTF-8, comma or semicolon separated)
      const text  = buf.toString('utf-8').replace(/^\uFEFF/, '')
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) return res.status(400).json({ error: 'El CSV debe tener al menos una fila de datos' })
      const header = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/"/g, ''))
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(/[,;]/).map(v => v.trim().replace(/"/g, ''))
        const obj  = {}
        header.forEach((h, idx) => { obj[h] = vals[idx] || '' })
        rows.push(obj)
      }
    } else {
      // XLSX / XLS
      const wb = XLSX.read(buf, { type: 'buffer' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      rows     = XLSX.utils.sheet_to_json(ws, { defval: '' })
      // Normalize keys to lowercase
      rows = rows.map(r => {
        const out = {}
        Object.keys(r).forEach(k => { out[k.toLowerCase().trim()] = String(r[k] || '').trim() })
        return out
      })
    }

    const ROLE_MAP = {
      estudiante:    'STUDENT',
      student:       'STUDENT',
      student_tp:    'STUDENT',
      tp:            'STUDENT',
      student_epja:  'STUDENT',
      epja:          'STUDENT',
      profesor:      'TEACHER',
      teacher:       'TEACHER',
      empresa:       'COMPANY',
      company:       'COMPANY',
    }

    let created = 0, skipped = 0, errors = []

    for (const row of rows) {
      try {
        const nombre = row.nombre || row.name || ''
        const email  = (row.email || row.correo || '').trim().toLowerCase()
        const tipo   = (row.tipo || row.role || row.rol || 'estudiante').trim().toLowerCase()
        const esp    = row.especialidad || row.specialty || ''

        if (!nombre || !email) { skipped++; continue }

        const role = ROLE_MAP[tipo] || 'STUDENT'

        // Check duplicate
        const exists = await prisma.user.findUnique({ where: { email } })
        if (exists) { skipped++; continue }

        // Generate password: nombre+año
        const rawPass  = `${nombre.split(' ')[0].toLowerCase()}2026`
        const password = await bcrypt.hash(rawPass, 10)

        const user = await prisma.user.create({
          data: { nombre: nombre.trim(), email, password, role }
        })

        if (['STUDENT', 'STUDENT_TP', 'STUDENT_EPJA'].includes(role)) {
          await prisma.worker.create({ data: { userId: user.id, especialidad: esp || null } })
        }
        if (role === 'COMPANY') {
          await prisma.company.create({ data: { userId: user.id, nombreEmpresa: nombre.trim() } })
        }

        created++
      } catch (rowErr) {
        errors.push(rowErr.message)
      }
    }

    res.json({
      message: `Importación completada: ${created} creados, ${skipped} omitidos`,
      created, skipped, errors: errors.slice(0, 10),
    })
  } catch (err) {
    console.error('bulk-import error:', err)
    res.status(500).json({ error: 'Error al procesar el archivo' })
  }
}

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

module.exports = {
  getMetrics, getPending, approveCompany, rejectCompany, getAllWorkers, createValidacion,
  getAllCompanies, verifyCompany, getAllUsers, assignRole,
  getLiceoRequests, approveLiceo, rejectLiceo,
  getBadgeRequests, approveBadge, rejectBadge,
  getAdminNotifications, readAllAdminNotifications,
  bulkImport,
  getEgresoRequests, approveEgreso, rejectEgreso,
  resetPassword,
}

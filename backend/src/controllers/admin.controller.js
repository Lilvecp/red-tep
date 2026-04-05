const prisma = require('../utils/prisma')

// GET /api/admin/metrics  — ADMIN y TEACHER
const getMetrics = async (req, res) => {
  try {
    const [totalTP, totalEPJA, totalEmpresas, empresasPendientes, totalValidaciones, totalOfertas, porEspecialidad] =
      await Promise.all([
        prisma.worker.count({ where: { user: { role: 'STUDENT_TP', activo: true } } }),
        prisma.worker.count({ where: { user: { role: 'STUDENT_EPJA', activo: true } } }),
        prisma.company.count({ where: { aprobada: true } }),
        prisma.company.count({ where: { aprobada: false } }),
        prisma.validacion.count(),
        prisma.oferta.count({ where: { activa: true } }),
        prisma.worker.groupBy({ by: ['especialidad'], _count: { id: true }, where: { especialidad: { not: null } } }),
      ])

    res.json({
      trabajadores: { tp: totalTP, epja: totalEPJA, total: totalTP + totalEPJA },
      empresas:     { aprobadas: totalEmpresas, pendientes: empresasPendientes },
      validaciones: totalValidaciones,
      ofertas:      totalOfertas,
      porEspecialidad: porEspecialidad.map(e => ({ especialidad: e.especialidad, total: e._count.id })),
    })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/admin/companies/pending  — ADMIN
const getPending = async (req, res) => {
  try {
    const pending = await prisma.company.findMany({
      where: { aprobada: false },
      include: { user: { select: { nombre: true, email: true, createdAt: true } } }
    })
    res.json(pending)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// PUT /api/admin/companies/:id/approve  — ADMIN
const approveCompany = async (req, res) => {
  try {
    const company = await prisma.company.update({
      where: { id: Number(req.params.id) }, data: { aprobada: true }
    })
    res.json({ message: 'Empresa aprobada', company })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/admin/workers  — ADMIN y TEACHER ven todos los trabajadores
const getAllWorkers = async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      include: {
        user: { select: { nombre: true, email: true, role: true } },
        habilidades: true, validaciones: true, insignias: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(workers)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/admin/validaciones  — TEACHER y ADMIN validan competencias
const createValidacion = async (req, res) => {
  try {
    const { workerId, competencia, nivel, observacion } = req.body
    const val = await prisma.validacion.create({
      data: { workerId: Number(workerId), teacherId: req.user.id, competencia, nivel, observacion }
    })

    // Insignia automática
    const existe = await prisma.insignia.findFirst({ where: { workerId: Number(workerId), tipo: 'VALIDADO_POR_PROFESOR' } })
    if (!existe) await prisma.insignia.create({ data: { workerId: Number(workerId), tipo: 'VALIDADO_POR_PROFESOR' } })

    res.status(201).json(val)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/admin/companies  — ADMIN: lista todas las empresas
const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: { user: { select: { nombre: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(companies)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// PUT /api/admin/companies/:id/verify  — ADMIN: toggle verified + limpia verificationRequested
const verifyCompany = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: Number(req.params.id) } })
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })

    const nowVerified = !company.verified
    const updated = await prisma.company.update({
      where: { id: Number(req.params.id) },
      data: {
        verified: nowVerified,
        verificationRequested: false, // siempre se limpia al resolver
      },
    })
    res.json({ message: nowVerified ? 'Empresa verificada' : 'Verificación removida', company: updated })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/admin/users  — ADMIN: lista todos los usuarios con su rol
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nombre: true, email: true, role: true, activo: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(users)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// PUT /api/admin/users/:id/role  — ADMIN: cambia el rol de un usuario
const assignRole = async (req, res) => {
  try {
    const { role } = req.body
    const VALID_ROLES = ['STUDENT_TP','STUDENT_EPJA','TEACHER','COMPANY','ADMIN']
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Rol inválido' })
    const updated = await prisma.user.update({
      where: { id: Number(req.params.id) },
      select: { id: true, nombre: true, email: true, role: true },
      data: { role },
    })
    res.json({ message: 'Rol actualizado', user: updated })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

module.exports = { getMetrics, getPending, approveCompany, getAllWorkers, createValidacion, getAllCompanies, verifyCompany, getAllUsers, assignRole }

const prisma = require('../utils/prisma')

// ─── Company ──────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const c = await prisma.company.findUnique({ where: { userId: req.user.id }, include: { ofertas: true } })
    if (!c) return res.status(404).json({ error: 'Empresa no encontrada' })
    res.json(c)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const COMPANY_FIELDS = [
  'nombreEmpresa','rut','rubro','comuna','telefono','sitioWeb','logoUrl','bannerColor',
]

const updateMe = async (req, res) => {
  try {
    const c = await prisma.company.findUnique({ where: { userId: req.user.id } })
    if (!c) return res.status(404).json({ error: 'Empresa no encontrada' })
    const data = Object.fromEntries(
      Object.entries(req.body)
        .filter(([k]) => COMPANY_FIELDS.includes(k))
        .map(([k, v]) => [k, v === '' ? null : v])
    )
    const updated = await prisma.company.update({ where: { id: c.id }, data })
    res.json(updated)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/companies/user/:userId  — perfil público de empresa
const getPublic = async (req, res) => {
  try {
    const c = await prisma.company.findUnique({
      where: { userId: Number(req.params.userId) },
      include: {
        user:   { select: { nombre: true, email: true } },
        ofertas: { where: { activa: true }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!c) return res.status(404).json({ error: 'Empresa no encontrada' })
    res.json(c)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const listApproved = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: { aprobada: true },
      select: { id: true, nombreEmpresa: true, rubro: true, comuna: true, logoUrl: true, userId: true }
    })
    res.json(companies)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/companies/search?q=  — búsqueda pública por nombre
const search = async (req, res) => {
  try {
    const { q } = req.query
    if (!q?.trim()) return res.json([])
    const companies = await prisma.company.findMany({
      where: { aprobada: true, nombreEmpresa: { contains: q.trim(), mode: 'insensitive' } },
      select: { id: true, nombreEmpresa: true, rubro: true, logoUrl: true, userId: true },
      take: 5,
    })
    res.json(companies)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/companies/me/request-verification
const requestVerification = async (req, res) => {
  try {
    const c = await prisma.company.findUnique({ where: { userId: req.user.id } })
    if (!c) return res.status(404).json({ error: 'Empresa no encontrada' })
    if (c.verified) return res.status(400).json({ error: 'La empresa ya está verificada' })
    if (c.verificationRequested) return res.status(400).json({ error: 'Ya existe una solicitud pendiente' })

    const updated = await prisma.company.update({
      where: { id: c.id },
      data: { verificationRequested: true },
    })
    res.json({ message: 'Solicitud de verificación enviada', company: updated })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// DELETE /companies/me/feedback
const deleteFeedback = async (req, res) => {
  try {
    const c = await prisma.company.findUnique({ where: { userId: req.user.id } })
    if (!c) return res.status(404).json({ error: 'Empresa no encontrada' })
    await prisma.company.update({ where: { id: c.id }, data: { adminFeedback: null } })
    res.json({ message: 'Retroalimentación eliminada' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

module.exports = { getMe, updateMe, getPublic, listApproved, requestVerification, search, deleteFeedback }

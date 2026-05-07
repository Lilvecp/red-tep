const prisma = require('../utils/prisma')

// ── Templates (admin/teacher CRUD) ────────────────────────────────────────────

const getTemplates = async (req, res) => {
  try {
    const templates = await prisma.insigniaTemplate.findMany({
      orderBy: { creadoEn: 'asc' },
      include: { _count: { select: { awards: true } } },
    })
    res.json(templates)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

const createTemplate = async (req, res) => {
  try {
    const { nombre, descripcion, imagenUrl } = req.body
    if (!nombre?.trim() || !descripcion?.trim())
      return res.status(400).json({ error: 'Nombre y descripción son requeridos' })
    const t = await prisma.insigniaTemplate.create({
      data: { nombre: nombre.trim(), descripcion: descripcion.trim(), imagenUrl: imagenUrl || null },
    })
    res.status(201).json(t)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al crear plantilla' }) }
}

const updateTemplate = async (req, res) => {
  try {
    const { nombre, descripcion, imagenUrl } = req.body
    const t = await prisma.insigniaTemplate.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(nombre      !== undefined ? { nombre:      nombre.trim()      } : {}),
        ...(descripcion !== undefined ? { descripcion: descripcion.trim() } : {}),
        ...(imagenUrl   !== undefined ? { imagenUrl:   imagenUrl || null  } : {}),
      },
    })
    res.json(t)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al actualizar' }) }
}

const deleteTemplate = async (req, res) => {
  try {
    await prisma.insigniaTemplate.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Plantilla eliminada' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al eliminar' }) }
}

// ── Awards ────────────────────────────────────────────────────────────────────

const getAllAwards = async (req, res) => {
  try {
    const awards = await prisma.insigniaAward.findMany({
      include: { template: true },
      orderBy: { otorgadoEn: 'desc' },
    })
    const userIds = [...new Set(awards.map(a => a.userId))]
    const users   = await prisma.user.findMany({
      where:  { id: { in: userIds } },
      select: { id: true, nombre: true, email: true, role: true },
    })
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))
    res.json(awards.map(a => ({ ...a, user: userMap[a.userId] || null })))
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

const awardBadge = async (req, res) => {
  try {
    const { templateId, userId } = req.body
    if (!templateId || !userId)
      return res.status(400).json({ error: 'templateId y userId son requeridos' })

    const award = await prisma.insigniaAward.upsert({
      where:  { templateId_userId: { templateId: Number(templateId), userId: Number(userId) } },
      update: {},
      create: { templateId: Number(templateId), userId: Number(userId) },
      include: { template: true },
    })

    // Attach user info
    const user = await prisma.user.findUnique({
      where:  { id: Number(userId) },
      select: { id: true, nombre: true, email: true, role: true },
    })
    res.status(201).json({ ...award, user })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al otorgar insignia' }) }
}

const revokeAward = async (req, res) => {
  try {
    await prisma.insigniaAward.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Insignia revocada' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al revocar' }) }
}

// ── User endpoints ─────────────────────────────────────────────────────────────

const getMyBadges = async (req, res) => {
  try {
    const awards = await prisma.insigniaAward.findMany({
      where:   { userId: req.user.id },
      include: { template: true },
      orderBy: { otorgadoEn: 'desc' },
    })
    res.json(awards)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

const getUserBadges = async (req, res) => {
  try {
    const awards = await prisma.insigniaAward.findMany({
      where:   { userId: Number(req.params.userId), visible: true },
      include: { template: true },
      orderBy: { otorgadoEn: 'desc' },
    })
    res.json(awards)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

const toggleVisibility = async (req, res) => {
  try {
    const award = await prisma.insigniaAward.findUnique({ where: { id: Number(req.params.id) } })
    if (!award)              return res.status(404).json({ error: 'Insignia no encontrada' })
    if (award.userId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' })
    const updated = await prisma.insigniaAward.update({
      where:   { id: Number(req.params.id) },
      data:    { visible: !award.visible },
      include: { template: true },
    })
    res.json(updated)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al actualizar' }) }
}

module.exports = {
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  getAllAwards, awardBadge, revokeAward,
  getMyBadges, getUserBadges, toggleVisibility,
}

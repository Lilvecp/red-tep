const prisma = require('../utils/prisma')

// GET /api/filters?tipo=especialidad
const list = async (req, res) => {
  try {
    const { tipo } = req.query
    const opts = await prisma.filterOption.findMany({
      where: tipo ? { tipo } : undefined,
      orderBy: { valor: 'asc' },
    })
    res.json(opts)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/filters  — solo ADMIN
const create = async (req, res) => {
  try {
    const { tipo, valor } = req.body
    if (!tipo?.trim() || !valor?.trim())
      return res.status(400).json({ error: 'tipo y valor son requeridos' })
    const opt = await prisma.filterOption.create({ data: { tipo: tipo.trim(), valor: valor.trim() } })
    res.status(201).json(opt)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Ya existe esa opción' })
    console.error(err); res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// DELETE /api/filters/:id  — solo ADMIN
const remove = async (req, res) => {
  try {
    await prisma.filterOption.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

module.exports = { list, create, remove }

const prisma = require('../utils/prisma')

// GET /api/ofertas  — trabajadores ven todas las activas de empresas aprobadas
const list = async (req, res) => {
  try {
    const { especialidad, disponibilidad, comuna } = req.query
    const ofertas = await prisma.oferta.findMany({
      where: {
        activa: true,
        company: { aprobada: true },
        ...(especialidad && { especialidadRequerida: especialidad }),
        ...(disponibilidad && { disponibilidad }),
        ...(comuna && { comuna: { contains: comuna, mode: 'insensitive' } }),
      },
      include: { company: { select: { nombreEmpresa: true, rubro: true, comuna: true, logoUrl: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json(ofertas)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/ofertas/:id
const getById = async (req, res) => {
  try {
    const oferta = await prisma.oferta.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        company: true,
        postulaciones: { include: { worker: { include: { user: { select: { nombre: true } } } } } }
      }
    })
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' })

    let yaPostule = false
    if (req.user) {
      const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
      if (worker) {
        const existing = await prisma.postulacion.findFirst({
          where: { workerId: worker.id, ofertaId: oferta.id }
        })
        yaPostule = !!existing
      }
    }

    res.json({ ...oferta, yaPostule })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/ofertas/:id/postulaciones — solo la empresa dueña
const getPostulaciones = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } })
    const oferta  = await prisma.oferta.findFirst({ where: { id: Number(req.params.id), companyId: company?.id } })
    if (!oferta) return res.status(403).json({ error: 'No autorizado' })

    const postulaciones = await prisma.postulacion.findMany({
      where: { ofertaId: oferta.id },
      include: {
        worker: {
          include: {
            user: { select: { nombre: true, email: true } },
            habilidades: { select: { nombre: true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(postulaciones)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/ofertas  — solo COMPANY con empresa aprobada
const create = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } })
    if (!company)
      return res.status(404).json({ error: 'Empresa no encontrada' })
    const oferta = await prisma.oferta.create({ data: { ...req.body, companyId: company.id, requisitos: req.body.requisitos || [] } })
    res.status(201).json(oferta)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// PUT /api/ofertas/:id  — solo la empresa dueña
const update = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } })
    const oferta  = await prisma.oferta.findFirst({ where: { id: Number(req.params.id), companyId: company?.id } })
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada o no autorizado' })
    const updated = await prisma.oferta.update({ where: { id: oferta.id }, data: req.body })
    res.json(updated)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// DELETE /api/ofertas/:id  — solo la empresa dueña
const remove = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } })
    const oferta  = await prisma.oferta.findFirst({ where: { id: Number(req.params.id), companyId: company?.id } })
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada o no autorizado' })
    await prisma.oferta.delete({ where: { id: oferta.id } })
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/ofertas/:id/postular  — solo trabajadores
const postular = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })

    const post = await prisma.postulacion.create({
      data: { workerId: worker.id, ofertaId: Number(req.params.id) }
    })

    // Insignia primera postulación
    const existe = await prisma.insignia.findFirst({ where: { workerId: worker.id, tipo: 'PRIMERA_POSTULACION' } })
    if (!existe) await prisma.insignia.create({ data: { workerId: worker.id, tipo: 'PRIMERA_POSTULACION' } })

    res.status(201).json(post)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Ya postulaste a esta oferta' })
    console.error(err); res.status(500).json({ error: 'Error interno del servidor' })
  }
}

module.exports = { list, getById, create, update, postular, remove, getPostulaciones }

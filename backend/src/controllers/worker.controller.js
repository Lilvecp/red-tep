const prisma = require('../utils/prisma')

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

// PUT /api/workers/me
// Campos permitidos en updateMe (cualquier subconjunto es válido)
const WORKER_FIELDS = [
  'edad','telefono','direccion','fotoUrl','curso','especialidad','establecimiento',
  'experienciaPractica','disponibilidad','videoUrl','bannerColor','evaluacionSocioem',
  'buscandoTrabajo','progreso',
]

const updateMe = async (req, res) => {
  try {
    const { habilidades, evaluacionSocioem, ...rest } = req.body

    // Solo pasar campos reconocidos; convertir '' → null (los enums no aceptan cadena vacía)
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
      data: { ...data, ...(evaluacionSocioem && { evaluacionSocioem }) },
      include,
    })

    await checkInsignias(updated)
    res.json(updated)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/workers/:id  — por worker.id
const getById = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: Number(req.params.id) }, include
    })
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' })
    res.json(worker)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/workers/user/:userId  — por user.id (para links desde posts)
const getByUserId = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { userId: Number(req.params.userId) }, include
    })
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' })
    res.json(worker)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/workers/search?especialidad=&disponibilidad=&validado=&nombre=
// Solo COMPANY y ADMIN pueden buscar
const search = async (req, res) => {
  try {
    const { especialidad, disponibilidad, validado, nombre } = req.query
    const workers = await prisma.worker.findMany({
      where: {
        user: { activo: true },
        buscandoTrabajo: true,        // solo los que están buscando trabajo
        ...(especialidad && { especialidad }),
        ...(disponibilidad && { disponibilidad }),
        ...(validado === 'true' && { validaciones: { some: {} } }),
        ...(nombre && { user: { nombre: { contains: nombre, mode: 'insensitive' } } }),
      },
      include: {
        user: { select: { nombre: true, email: true } },
        habilidades: true,
        validaciones: true,
        insignias: true,
      }
    })
    res.json({ total: workers.length, results: workers })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// Lógica de insignias automáticas basada en progreso
const checkInsignias = async (worker) => {
  const give = async (tipo) => {
    const exists = await prisma.insignia.findFirst({ where: { workerId: worker.id, tipo } })
    if (!exists) await prisma.insignia.create({ data: { workerId: worker.id, tipo } })
  }
  const progreso = worker.progreso || {}
  if ((progreso.perfilTecnico || 0) >= 100) {
    await prisma.worker.update({ where: { id: worker.id }, data: { perfilCompleto: true } })
    await give('PERFIL_COMPLETO')
  }
  if ((progreso.practicas || 0) >= 100) await give('EXPERIENCIA_PRACTICA')
  if ((progreso.habilidades || 0) >= 100) await give('TOP_CANDIDATO')
}

module.exports = { getMe, updateMe, getById, getByUserId, search }

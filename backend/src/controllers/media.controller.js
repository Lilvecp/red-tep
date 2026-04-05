// ─── media.controller.js ─────────────────────────────────────────────────────
const cloudinary = require('cloudinary').v2
const prisma     = require('../utils/prisma')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const upload = async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } })
    if (!worker) return res.status(404).json({ error: 'Perfil no encontrado' })
    if (!req.file)  return res.status(400).json({ error: 'No se recibió archivo' })

    const tipo = req.file.mimetype.startsWith('video') ? 'VIDEO' : 'FOTO'

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'red-tep', resource_type: tipo === 'VIDEO' ? 'video' : 'image' },
        (err, res) => err ? reject(err) : resolve(res)
      )
      stream.end(req.file.buffer)
    })

    const media = await prisma.media.create({
      data: { workerId: worker.id, url: result.secure_url, tipo, descripcion: req.body.descripcion || '' }
    })

    if (tipo === 'VIDEO')
      await prisma.worker.update({ where: { id: worker.id }, data: { videoUrl: result.secure_url } })

    res.status(201).json(media)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

const getFeed = async (req, res) => {
  try {
    const { tipo, especialidad } = req.query
    const media = await prisma.media.findMany({
      where: {
        ...(tipo && { tipo }),
        ...(especialidad && { worker: { especialidad } }),
      },
      include: { worker: { select: { especialidad: true, user: { select: { nombre: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(media)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/media/upload-url  — cualquier usuario autenticado
// Solo sube a Cloudinary y devuelve la URL sin guardar en DB
const uploadUrl = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' })
    const isVideo   = req.file.mimetype.startsWith('video')
    const mediaType = isVideo ? 'video' : 'image'

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'red-tep/posts', resource_type: isVideo ? 'video' : 'image' },
        (err, r) => err ? reject(err) : resolve(r)
      )
      stream.end(req.file.buffer)
    })

    res.json({ url: result.secure_url, mediaType })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

module.exports = { upload, getFeed, uploadUrl }

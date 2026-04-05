const prisma = require('../utils/prisma')

function resolveAuthorType(role) {
  if (role === 'COMPANY') return 'COMPANY'
  if (role === 'ADMIN' || role === 'TEACHER') return 'ADMIN'
  return 'STUDENT'
}

// GET /api/eventos
const list = async (req, res) => {
  try {
    const eventos = await prisma.evento.findMany({ where: { activo: true }, orderBy: { fecha: 'asc' } })

    // Adjuntar conteo de comentarios y reacciones
    const ids = eventos.map(e => e.id)
    const [commentCounts, reactionCounts] = await Promise.all([
      prisma.eventoComment.groupBy({ by: ['eventoId'], where: { eventoId: { in: ids } }, _count: { id: true } }),
      prisma.eventoReaction.groupBy({ by: ['eventoId'], where: { eventoId: { in: ids } }, _count: { id: true } }),
    ])
    const cMap = Object.fromEntries(commentCounts.map(r => [r.eventoId, r._count.id]))
    const rMap = Object.fromEntries(reactionCounts.map(r => [r.eventoId, r._count.id]))

    const enriched = eventos.map(e => ({
      ...e,
      commentCount:  cMap[e.id]  || 0,
      reactionCount: rMap[e.id] || 0,
    }))

    res.json(enriched)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/eventos  — solo ADMIN
const create = async (req, res) => {
  try {
    const { titulo, descripcion, fecha, lugar } = req.body
    const evento = await prisma.evento.create({
      data: { titulo, descripcion, fecha: new Date(fecha), lugar, creadoPor: 'COLEGIO', creadoPorId: req.user.id }
    })
    res.status(201).json({ ...evento, commentCount: 0, reactionCount: 0 })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// DELETE /api/eventos/:id  — solo ADMIN
const remove = async (req, res) => {
  try {
    await prisma.evento.update({ where: { id: Number(req.params.id) }, data: { activo: false } })
    res.json({ message: 'Evento eliminado' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/eventos/:id/comments
const getComments = async (req, res) => {
  try {
    const comments = await prisma.eventoComment.findMany({
      where: { eventoId: Number(req.params.id) },
      orderBy: { createdAt: 'asc' },
    })
    res.json(comments)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/eventos/:id/comments
const addComment = async (req, res) => {
  try {
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'El comentario no puede estar vacío' })

    const evento = await prisma.evento.findUnique({ where: { id: Number(req.params.id) } })
    if (!evento || !evento.activo) return res.status(404).json({ error: 'Evento no encontrado' })

    const comment = await prisma.eventoComment.create({
      data: {
        eventoId:   Number(req.params.id),
        authorId:   req.user.id,
        authorName: req.user.nombre,
        authorType: resolveAuthorType(req.user.role),
        content:    content.trim(),
      },
    })
    res.status(201).json(comment)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// DELETE /api/eventos/:id/comments/:cid  — autor o admin
const deleteComment = async (req, res) => {
  try {
    const comment = await prisma.eventoComment.findUnique({ where: { id: Number(req.params.cid) } })
    if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' })

    const isOwner = comment.authorId === req.user.id
    const isAdmin = req.user.role === 'ADMIN'
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Sin permiso' })

    await prisma.eventoComment.delete({ where: { id: Number(req.params.cid) } })
    res.json({ message: 'Comentario eliminado' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/eventos/:id/reactions  — toggle like del usuario
const toggleReaction = async (req, res) => {
  try {
    const eventoId = Number(req.params.id)
    const userId   = req.user.id
    const emoji    = req.body.emoji || '👍'

    const existing = await prisma.eventoReaction.findUnique({
      where: { eventoId_userId: { eventoId, userId } },
    })

    if (existing) {
      await prisma.eventoReaction.delete({ where: { eventoId_userId: { eventoId, userId } } })
      const count = await prisma.eventoReaction.count({ where: { eventoId } })
      return res.json({ reacted: false, count })
    }

    await prisma.eventoReaction.create({ data: { eventoId, userId, emoji } })
    const count = await prisma.eventoReaction.count({ where: { eventoId } })
    res.json({ reacted: true, count })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/eventos/:id/reactions  — conteo + si el usuario reaccionó
const getReactions = async (req, res) => {
  try {
    const eventoId = Number(req.params.id)
    const [count, mine] = await Promise.all([
      prisma.eventoReaction.count({ where: { eventoId } }),
      prisma.eventoReaction.findUnique({
        where: { eventoId_userId: { eventoId, userId: req.user.id } },
      }),
    ])
    res.json({ count, reacted: !!mine })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

module.exports = { list, create, remove, getComments, addComment, deleteComment, toggleReaction, getReactions }

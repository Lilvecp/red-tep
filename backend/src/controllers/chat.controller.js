const prisma     = require('../utils/prisma')
const cloudinary = require('cloudinary').v2
const multer     = require('multer')

// GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members:  { include: { user: { select: { id: true, nombre: true, role: true } } } },
            messages: { orderBy: { creadoEn: 'desc' }, take: 1 },
          },
        },
      },
    })

    const conversations = memberships.map(m => ({
      ...m.conversation,
      unreadCount: m.unreadCount,
      lastMessage: m.conversation.messages[0] || null,
      members:     m.conversation.members.map(mb => mb.user),
    }))

    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.creadoEn || a.creadoEn
      const bTime = b.lastMessage?.creadoEn || b.creadoEn
      return new Date(bTime) - new Date(aTime)
    })

    res.json(conversations)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// POST /api/chat/conversations  body: { userIds: number[], nombre?: string }
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id
    const { userIds, nombre } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0)
      return res.status(400).json({ error: 'userIds requerido' })

    const allIds  = [...new Set([userId, ...userIds.map(Number)])]
    const esGrupo = allIds.length > 2 || !!nombre

    // Para 1:1: buscar conversación existente para evitar duplicados
    if (!esGrupo) {
      const targetId = allIds.find(id => id !== userId)
      const existing = await prisma.conversation.findFirst({
        where: {
          esGrupo: false,
          AND: [
            { members: { some: { userId } } },
            { members: { some: { userId: targetId } } },
          ],
        },
        include: {
          members:  { include: { user: { select: { id: true, nombre: true, role: true } } } },
          messages: { orderBy: { creadoEn: 'desc' }, take: 1 },
        },
      })

      if (existing) {
        const myMember = await prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId: existing.id, userId } },
        })
        return res.json({
          ...existing,
          unreadCount: myMember?.unreadCount || 0,
          lastMessage: existing.messages[0] || null,
          members:     existing.members.map(m => m.user),
        })
      }
    }

    const conv = await prisma.conversation.create({
      data: {
        nombre:  nombre || null,
        esGrupo,
        members: { create: allIds.map(uid => ({ userId: uid })) },
      },
      include: {
        members:  { include: { user: { select: { id: true, nombre: true, role: true } } } },
        messages: { orderBy: { creadoEn: 'desc' }, take: 1 },
      },
    })

    res.status(201).json({
      ...conv,
      unreadCount: 0,
      lastMessage: null,
      members:     conv.members.map(m => m.user),
    })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// GET /api/chat/conversations/:id/messages?before=<msgId>
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id
    const convId = Number(req.params.id)
    const before = req.query.before ? Number(req.query.before) : undefined

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: convId, userId } },
    })
    if (!member) return res.status(403).json({ error: 'No eres miembro de esta conversación' })

    const msgs = await prisma.message.findMany({
      where: {
        conversationId: convId,
        ...(before ? { id: { lt: before } } : {}),
      },
      include: { sender: { select: { id: true, nombre: true, role: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    })

    res.json(msgs.reverse())
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// PUT /api/chat/conversations/:id/read  (legacy)
const markRead = async (req, res) => {
  try {
    const userId = req.user.id
    const convId = Number(req.params.id)
    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId: convId, userId } },
      data:  { unreadCount: 0 },
    })
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// POST /api/chat/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    const { contenido, mediaUrl } = req.body
    const conversationId = Number(req.params.id)
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: req.user.id },
    })
    if (!member) return res.status(403).json({ error: 'No eres miembro de esta conversación' })
    const message = await prisma.message.create({
      data: { conversationId, senderId: req.user.id, contenido: contenido || '', mediaUrl: mediaUrl || null },
    })
    res.status(201).json(message)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al enviar mensaje' }) }
}

// POST /api/chat/conversations/:id/read
const markReadPost = async (req, res) => {
  try {
    await prisma.conversationMember.updateMany({
      where: { conversationId: Number(req.params.id), userId: req.user.id },
      data:  { unreadCount: 0 },
    })
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// DELETE /api/chat/messages/:id  (soft-delete, solo el autor)
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id
    const msgId  = Number(req.params.id)

    const msg = await prisma.message.findUnique({ where: { id: msgId } })
    if (!msg)                    return res.status(404).json({ error: 'Mensaje no encontrado' })
    if (msg.senderId !== userId) return res.status(403).json({ error: 'Solo puedes eliminar tus propios mensajes' })

    await prisma.message.update({
      where: { id: msgId },
      data:  { eliminado: true, contenido: '', mediaUrl: null },
    })

    res.json({ ok: true, messageId: msgId, conversationId: msg.conversationId })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }) }
}

// POST /api/chat/upload
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const uploadImage = async (req, res) => {
  try {
    if (!req.file)                               return res.status(400).json({ error: 'No se recibió imagen' })
    if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ error: 'Solo se permiten imágenes' })

    const b64     = req.file.buffer.toString('base64')
    const dataUri = `data:${req.file.mimetype};base64,${b64}`
    const result  = await cloudinary.uploader.upload(dataUri, { folder: 'red-tep/chat' })

    res.json({ url: result.secure_url })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al subir imagen' }) }
}

module.exports = { getConversations, createConversation, getMessages, markRead, markReadPost, sendMessage, deleteMessage, upload, uploadImage }

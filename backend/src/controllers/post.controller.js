const prisma = require('../utils/prisma')

function resolveAuthorType(role) {
  if (role === 'COMPANY') return 'COMPANY'
  if (role === 'ADMIN' || role === 'TEACHER') return 'ADMIN'
  return 'STUDENT'
}

// GET /api/posts?authorId=X  — todos los autenticados
const getPosts = async (req, res) => {
  try {
    const authorId = req.query.authorId ? Number(req.query.authorId) : undefined
    const posts = await prisma.post.findMany({
      where: authorId ? { authorId } : undefined,
      orderBy: { createdAt: 'desc' },
    })

    // Enriquecer con verified si el autor es empresa
    const companyIds = [...new Set(
      posts.filter(p => p.authorType === 'COMPANY').map(p => p.authorId)
    )]

    let verifiedSet = new Set()
    if (companyIds.length > 0) {
      const companies = await prisma.company.findMany({
        where: { userId: { in: companyIds }, verified: true },
        select: { userId: true },
      })
      verifiedSet = new Set(companies.map(c => c.userId))
    }

    const enriched = posts.map(p => ({
      ...p,
      verified: p.authorType === 'COMPANY' ? verifiedSet.has(p.authorId) : false,
    }))

    res.json(enriched)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// POST /api/posts  — cualquier autenticado
const createPost = async (req, res) => {
  try {
    const { content } = req.body
    if (!content?.trim())
      return res.status(400).json({ error: 'El contenido no puede estar vacío' })

    const { mediaUrl, mediaType } = req.body
    const post = await prisma.post.create({
      data: {
        content:    content.trim(),
        authorId:   req.user.id,
        authorType: resolveAuthorType(req.user.role),
        authorName: req.user.nombre,
        ...(mediaUrl  && { mediaUrl }),
        ...(mediaType && { mediaType }),
      },
    })
    res.status(201).json(post)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PUT /api/posts/:id  — solo el autor
const updatePost = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return res.status(404).json({ error: 'Post no encontrado' })
    if (post.authorId !== req.user.id)
      return res.status(403).json({ error: 'No tienes permiso para editar este post' })

    const { content } = req.body
    if (!content?.trim())
      return res.status(400).json({ error: 'El contenido no puede estar vacío' })

    const updated = await prisma.post.update({
      where: { id },
      data: { content: content.trim() },
    })
    res.json(updated)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// DELETE /api/posts/:id  — autor o admin
const deletePost = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return res.status(404).json({ error: 'Post no encontrado' })

    const isOwner = post.authorId === req.user.id
    const isAdmin = req.user.role === 'ADMIN'
    if (!isOwner && !isAdmin)
      return res.status(403).json({ error: 'No tienes permiso para eliminar este post' })

    await prisma.post.delete({ where: { id } })
    res.json({ message: 'Post eliminado' })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/posts/:id/reactions
const getPostReactions = async (req, res) => {
  try {
    const postId = Number(req.params.id)
    const count   = await prisma.postReaction.count({ where: { postId } })
    const reacted = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId: req.user.id } },
    })
    res.json({ count, reacted: !!reacted })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/posts/:id/reactions  — toggle like
const togglePostReaction = async (req, res) => {
  try {
    const postId = Number(req.params.id)
    const userId = req.user.id
    const existing = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId } },
    })
    if (existing) {
      await prisma.postReaction.delete({ where: { postId_userId: { postId, userId } } })
    } else {
      await prisma.postReaction.create({ data: { postId, userId } })
      const post = await prisma.post.findUnique({ where: { id: postId } })
      if (post && post.authorId !== userId) {
        await prisma.notification.create({
          data: { userId: post.authorId, type: 'LIKE', message: `${req.user.nombre} le dio like a tu publicación`, referenceId: postId },
        })
      }
    }
    const count = await prisma.postReaction.count({ where: { postId } })
    res.json({ count, reacted: !existing })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/posts/:id/comments
const getPostComments = async (req, res) => {
  try {
    const postId = Number(req.params.id)
    const comments = await prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    })
    res.json(comments)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// POST /api/posts/:id/comments
const addPostComment = async (req, res) => {
  try {
    const postId = Number(req.params.id)
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'Comentario vacío' })
    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId:   req.user.id,
        authorName: req.user.nombre,
        authorType: resolveAuthorType(req.user.role),
        content:    content.trim(),
      },
    })
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (post && post.authorId !== req.user.id) {
      await prisma.notification.create({
        data: { userId: post.authorId, type: 'COMMENT', message: `${req.user.nombre} comentó en tu publicación`, referenceId: postId },
      })
    }
    res.status(201).json(comment)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// DELETE /api/posts/:id/comments/:cid
const deletePostComment = async (req, res) => {
  try {
    const id = Number(req.params.cid)
    const comment = await prisma.postComment.findUnique({ where: { id } })
    if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' })
    if (comment.authorId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ error: 'Sin permiso' })
    await prisma.postComment.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

module.exports = { getPosts, createPost, updatePost, deletePost, getPostReactions, togglePostReaction, getPostComments, addPostComment, deletePostComment }

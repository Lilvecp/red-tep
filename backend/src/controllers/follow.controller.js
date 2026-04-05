const prisma = require('../utils/prisma')

// POST /api/follows  — seguir
const followUser = async (req, res) => {
  try {
    const followerId  = req.user.id
    const { followingId } = req.body
    if (!followingId) return res.status(400).json({ error: 'followingId requerido' })
    if (followerId === Number(followingId))
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo' })

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: Number(followingId) } },
    })
    if (existing) return res.status(409).json({ error: 'Ya sigues a este usuario' })

    await prisma.follow.create({ data: { followerId, followingId: Number(followingId) } })

    await prisma.notification.create({
      data: {
        userId: Number(followingId),
        type: 'FOLLOW',
        message: `${req.user.nombre} comenzó a seguirte`,
        referenceId: followerId,
      },
    })

    res.status(201).json({ following: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// DELETE /api/follows/:followingId  — dejar de seguir
const unfollowUser = async (req, res) => {
  try {
    const followerId  = req.user.id
    const followingId = Number(req.params.followingId)
    await prisma.follow.deleteMany({ where: { followerId, followingId } })
    res.json({ following: false })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/follows/status/:followingId
const getFollowStatus = async (req, res) => {
  try {
    const followerId  = req.user.id
    const followingId = Number(req.params.followingId)
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })
    const followers = await prisma.follow.count({ where: { followingId } })
    const following = await prisma.follow.count({ where: { followerId: followingId } })
    res.json({ isFollowing: !!follow, followers, following })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/follows/my-following  — lista de IDs que sigo
const getMyFollowing = async (req, res) => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      select: { followingId: true },
    })
    res.json(follows.map(f => f.followingId))
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

// GET /api/follows/my-stats  — mis stats de seguidores/siguiendo
const getMyStats = async (req, res) => {
  try {
    const followers = await prisma.follow.count({ where: { followingId: req.user.id } })
    const following = await prisma.follow.count({ where: { followerId: req.user.id } })
    res.json({ followers, following })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }) }
}

module.exports = { followUser, unfollowUser, getFollowStatus, getMyFollowing, getMyStats }

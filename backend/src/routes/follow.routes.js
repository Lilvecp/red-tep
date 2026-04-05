const r = require('express').Router()
const c = require('../controllers/follow.controller')
const { verifyToken, isAny } = require('../middleware/auth.middleware')

r.post('/',                      verifyToken, isAny, c.followUser)
r.delete('/:followingId',        verifyToken, isAny, c.unfollowUser)
r.get('/my-following',           verifyToken, isAny, c.getMyFollowing)
r.get('/my-stats',               verifyToken, isAny, c.getMyStats)
r.get('/status/:followingId',    verifyToken, isAny, c.getFollowStatus)

module.exports = r

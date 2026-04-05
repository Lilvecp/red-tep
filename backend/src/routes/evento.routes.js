const r = require('express').Router()
const c = require('../controllers/evento.controller')
const { verifyToken, isAdmin, isAny } = require('../middleware/auth.middleware')

r.get('/',                          verifyToken, isAny,   c.list)
r.post('/',                         verifyToken, isAdmin, c.create)
r.delete('/:id',                    verifyToken, isAdmin, c.remove)

r.get('/:id/comments',              verifyToken, isAny,   c.getComments)
r.post('/:id/comments',             verifyToken, isAny,   c.addComment)
r.delete('/:id/comments/:cid',      verifyToken, isAny,   c.deleteComment)

r.get('/:id/reactions',             verifyToken, isAny,   c.getReactions)
r.post('/:id/reactions',            verifyToken, isAny,   c.toggleReaction)

module.exports = r

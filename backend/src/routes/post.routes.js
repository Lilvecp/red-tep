const r = require('express').Router()
const c = require('../controllers/post.controller')
const { verifyToken, isAny } = require('../middleware/auth.middleware')

r.get('/',      verifyToken, isAny, c.getPosts)
r.post('/',     verifyToken, isAny, c.createPost)
r.put('/:id',   verifyToken, isAny, c.updatePost)
r.delete('/:id',verifyToken, isAny, c.deletePost)

// Comments
r.get('/:id/comments',            verifyToken, isAny, c.getPostComments)
r.post('/:id/comments',           verifyToken, isAny, c.addPostComment)
r.delete('/:id/comments/:cid',    verifyToken, isAny, c.deletePostComment)

// Reactions (like)
r.get('/:id/reactions',           verifyToken, isAny, c.getPostReactions)
r.post('/:id/reactions',          verifyToken, isAny, c.togglePostReaction)

module.exports = r

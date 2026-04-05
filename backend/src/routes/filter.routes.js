const r = require('express').Router()
const c = require('../controllers/filter.controller')
const { verifyToken, isAdmin, isAny } = require('../middleware/auth.middleware')

r.get('/',     verifyToken, isAny,   c.list)
r.post('/',    verifyToken, isAdmin, c.create)
r.delete('/:id', verifyToken, isAdmin, c.remove)

module.exports = r

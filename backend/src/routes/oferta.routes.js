const r = require('express').Router()
const c = require('../controllers/oferta.controller')
const { verifyToken, isWorker, isCompany, isAny } = require('../middleware/auth.middleware')

r.get('/',              verifyToken, isAny,     c.list)
r.get('/:id',          verifyToken, isAny,     c.getById)
r.post('/',             verifyToken, isCompany, c.create)
r.put('/:id',           verifyToken, isCompany, c.update)
r.delete('/:id',        verifyToken, isCompany, c.remove)
r.post('/:id/postular',        verifyToken, isWorker,  c.postular)
r.get('/:id/postulaciones',    verifyToken, isCompany, c.getPostulaciones)

module.exports = r

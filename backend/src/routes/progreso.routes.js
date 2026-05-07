const r = require('express').Router()
const c = require('../controllers/progreso.controller')
const { verifyToken, isWorker } = require('../middleware/auth.middleware')

// GET all active sections + current worker's progress (any authenticated user)
r.get('/', verifyToken, c.getAll)

// Worker updates their own progress on a specific section
r.put('/me/:progresoId', verifyToken, isWorker, c.updateMio)

module.exports = r

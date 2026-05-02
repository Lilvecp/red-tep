const r = require('express').Router()
const c = require('../controllers/worker.controller')
const { verifyToken, isWorker, isCompany, isAdmin, isAny } = require('../middleware/auth.middleware')

// Búsqueda — solo empresa y admin
r.get('/search', verifyToken, (req,res,next) => {
  const allowed = ['COMPANY','ADMIN','TEACHER']
  if (!allowed.includes(req.user?.role)) return res.status(403).json({ error: 'Acceso denegado' })
  next()
}, c.search)

// Perfil propio — solo trabajadores
r.get('/me',             verifyToken, isWorker, c.getMe)
r.put('/me',             verifyToken, isWorker, c.updateMe)
r.post('/me/request-liceo', verifyToken, isWorker, c.requestLiceo)
r.patch('/me/modalidad',     verifyToken, isWorker, c.setModalidad)
r.post('/me/request-egreso', verifyToken, isWorker, c.requestEgreso)
r.post('/me/upload-cv',     verifyToken, isWorker, c.uploadCv)
r.delete('/me/liceo-feedback',      verifyToken, isWorker, c.deleteLiceoFeedback)
r.delete('/me/badges/:id/feedback', verifyToken, isWorker, c.deleteBadgeFeedback)

// Ver perfil por userId — cualquier autenticado (debe ir ANTES de /:id)
r.get('/user/:userId', verifyToken, isAny, c.getByUserId)

// Ver perfil por worker.id — cualquier autenticado
r.get('/:id', verifyToken, isAny, c.getById)

module.exports = r

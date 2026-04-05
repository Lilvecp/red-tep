const r = require('express').Router()
const c = require('../controllers/admin.controller')
const { verifyToken, isAdmin } = require('../middleware/auth.middleware')

r.get('/metrics',                 verifyToken, isAdmin,    c.getMetrics)
r.get('/workers',                 verifyToken, isAdmin,    c.getAllWorkers)
r.get('/companies',               verifyToken, isAdmin,    c.getAllCompanies)
r.get('/companies/pending',       verifyToken, isAdmin,    c.getPending)
r.put('/companies/:id/approve',   verifyToken, isAdmin,    c.approveCompany)
r.put('/companies/:id/verify',    verifyToken, isAdmin,    c.verifyCompany)
r.post('/validaciones',           verifyToken, isAdmin,    c.createValidacion)
r.get('/users',                   verifyToken, isAdmin,    c.getAllUsers)
r.put('/users/:id/role',          verifyToken, isAdmin,    c.assignRole)

module.exports = r

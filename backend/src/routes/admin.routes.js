const r      = require('express').Router()
const multer = require('multer')
const c      = require('../controllers/admin.controller')
const cp     = require('../controllers/progreso.controller')
const { verifyToken, isAdmin } = require('../middleware/auth.middleware')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// Metrics
r.get('/metrics',                          verifyToken, isAdmin, c.getMetrics)

// Workers
r.get('/workers',                          verifyToken, isAdmin, c.getAllWorkers)

// Companies
r.get('/companies',                        verifyToken, isAdmin, c.getAllCompanies)
r.get('/companies/pending',                verifyToken, isAdmin, c.getPending)
r.put('/companies/:id/approve',            verifyToken, isAdmin, c.approveCompany)
r.put('/companies/:id/reject',             verifyToken, isAdmin, c.rejectCompany)
r.put('/companies/:id/verify',             verifyToken, isAdmin, c.verifyCompany)

// Validaciones (teacher/admin)
r.post('/validaciones',                    verifyToken, isAdmin, c.createValidacion)

// Users
r.get('/users',                            verifyToken, isAdmin, c.getAllUsers)
r.put('/users/:id/role',                   verifyToken, isAdmin, c.assignRole)

// Liceo requests
r.get('/liceo-requests',                   verifyToken, isAdmin, c.getLiceoRequests)
r.put('/liceo-requests/:workerId/approve', verifyToken, isAdmin, c.approveLiceo)
r.put('/liceo-requests/:workerId/reject',  verifyToken, isAdmin, c.rejectLiceo)

// Badge requests
r.get('/badge-requests',                   verifyToken, isAdmin, c.getBadgeRequests)
r.put('/badge-requests/:insigniaId/approve', verifyToken, isAdmin, c.approveBadge)
r.put('/badge-requests/:insigniaId/reject',  verifyToken, isAdmin, c.rejectBadge)

// Egreso requests
r.get('/egreso-requests',                   verifyToken, isAdmin, c.getEgresoRequests)
r.put('/egreso-requests/:workerId/approve', verifyToken, isAdmin, c.approveEgreso)
r.put('/egreso-requests/:workerId/reject',  verifyToken, isAdmin, c.rejectEgreso)

// Admin notifications
r.get('/notifications',                    verifyToken, isAdmin, c.getAdminNotifications)
r.put('/notifications/read-all',           verifyToken, isAdmin, c.readAllAdminNotifications)

// Bulk import
r.post('/bulk-import',                     verifyToken, isAdmin, upload.single('file'), c.bulkImport)

// Progreso Formativo (admin CRUD)
r.get('/progreso',        verifyToken, isAdmin, cp.adminGetAll)
r.post('/progreso',       verifyToken, isAdmin, cp.adminCreate)
r.put('/progreso/:id',    verifyToken, isAdmin, cp.adminUpdate)
r.delete('/progreso/:id', verifyToken, isAdmin, cp.adminDelete)

module.exports = r

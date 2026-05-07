const r = require('express').Router()
const c = require('../controllers/badge.controller')
const { verifyToken, isTeacher, isAny } = require('../middleware/auth.middleware')

// Templates — admin/teacher manage badge definitions
r.get('/templates',        verifyToken, isTeacher, c.getTemplates)
r.post('/templates',       verifyToken, isTeacher, c.createTemplate)
r.put('/templates/:id',    verifyToken, isTeacher, c.updateTemplate)
r.delete('/templates/:id', verifyToken, isTeacher, c.deleteTemplate)

// Awards — admin/teacher award/revoke badges
r.get('/awards',           verifyToken, isTeacher, c.getAllAwards)
r.post('/award',           verifyToken, isTeacher, c.awardBadge)
r.delete('/award/:id',     verifyToken, isTeacher, c.revokeAward)

// User endpoints
r.get('/me',                        verifyToken, isAny, c.getMyBadges)
r.get('/user/:userId',              verifyToken, isAny, c.getUserBadges)
r.patch('/award/:id/visibility',    verifyToken, isAny, c.toggleVisibility)

module.exports = r

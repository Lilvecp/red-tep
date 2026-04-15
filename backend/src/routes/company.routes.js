const r = require('express').Router()
const c = require('../controllers/company.controller')
const { verifyToken, isCompany, isAny } = require('../middleware/auth.middleware')

r.get('/search',                   verifyToken, isAny,     c.search)
r.get('/user/:userId',             verifyToken, isAny,     c.getPublic)
r.get('/',                         verifyToken, isAny,     c.listApproved)
r.get('/me',                       verifyToken, isCompany, c.getMe)
r.put('/me',                       verifyToken, isCompany, c.updateMe)
r.post('/me/request-verification', verifyToken, isCompany, c.requestVerification)
r.delete('/me/feedback',           verifyToken, isCompany, c.deleteFeedback)

module.exports = r

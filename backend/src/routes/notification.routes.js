const r = require('express').Router()
const c = require('../controllers/notification.controller')
const { verifyToken, isAny } = require('../middleware/auth.middleware')

r.get('/',          verifyToken, isAny, c.getNotifications)
r.put('/read-all',  verifyToken, isAny, c.readAll)

module.exports = r

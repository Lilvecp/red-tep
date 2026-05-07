// src/routes/auth.routes.js
const r = require('express').Router()
const c = require('../controllers/auth.controller')
const { verifyToken } = require('../middleware/auth.middleware')
r.post('/register',  c.register)
r.post('/login',     c.login)
r.get('/me',         verifyToken, c.me)
r.patch('/me',       verifyToken, c.updateMe)
module.exports = r

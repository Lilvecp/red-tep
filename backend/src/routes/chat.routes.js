const r = require('express').Router()
const { verifyToken } = require('../middleware/auth.middleware')
const c = require('../controllers/chat.controller')

r.get('/conversations',              verifyToken, c.getConversations)
r.post('/conversations',             verifyToken, c.createConversation)
r.get('/conversations/:id/messages', verifyToken, c.getMessages)
r.post('/conversations/:id/messages', verifyToken, c.sendMessage)
r.put('/conversations/:id/read',     verifyToken, c.markRead)
r.post('/conversations/:id/read',    verifyToken, c.markReadPost)
r.delete('/messages/:id',            verifyToken, c.deleteMessage)
r.post('/upload',                    verifyToken, c.upload.single('file'), c.uploadImage)

module.exports = r

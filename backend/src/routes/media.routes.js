const r      = require('express').Router()
const multer = require('multer')
const c      = require('../controllers/media.controller')
const { verifyToken, isWorker, isAny } = require('../middleware/auth.middleware')

const uploader = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']
    ok.includes(file.mimetype) ? cb(null, true) : cb(new Error('Tipo no permitido'))
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
})

r.get('/',            verifyToken, isAny,   c.getFeed)
r.post('/upload',     verifyToken, isWorker, uploader.single('file'), c.upload)
r.post('/upload-url', verifyToken, isAny,    uploader.single('file'), c.uploadUrl)

module.exports = r

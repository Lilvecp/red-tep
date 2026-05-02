require('dotenv').config()

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length) {
  console.error(`\n❌  Variables de entorno faltantes: ${missing.join(', ')}\n   Revisa tu archivo .env\n`)
  process.exit(1)
}
if (process.env.JWT_SECRET === 'CAMBIA_ESTO_POR_CLAVE_SEGURA_64_CHARS') {
  console.error('\n❌  JWT_SECRET no ha sido cambiado del valor por defecto. Actualiza tu .env\n')
  process.exit(1)
}

const express    = require('express')
const cors       = require('cors')

const authRoutes         = require('./routes/auth.routes')
const workerRoutes       = require('./routes/worker.routes')
const companyRoutes      = require('./routes/company.routes')
const ofertaRoutes       = require('./routes/oferta.routes')
const adminRoutes        = require('./routes/admin.routes')
const mediaRoutes        = require('./routes/media.routes')
const eventoRoutes       = require('./routes/evento.routes')
const postRoutes         = require('./routes/post.routes')
const followRoutes       = require('./routes/follow.routes')
const notificationRoutes = require('./routes/notification.routes')
const filterRoutes       = require('./routes/filter.routes')
const progresoRoutes     = require('./routes/progreso.routes')
const chatRoutes         = require('./routes/chat.routes')
const badgeRoutes        = require('./routes/badge.routes')

const app = express()

const corsOptions = {
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/workers',       workerRoutes)
app.use('/api/companies',     companyRoutes)
app.use('/api/ofertas',       ofertaRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/media',         mediaRoutes)
app.use('/api/eventos',       eventoRoutes)
app.use('/api/posts',         postRoutes)
app.use('/api/follows',       followRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/filters',       filterRoutes)
app.use('/api/progreso',      progresoRoutes)
app.use('/api/chat',          chatRoutes)
app.use('/api/badges',        badgeRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'RED TEP' }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`🚀 RED TEP API corriendo en http://localhost:${PORT}`))

module.exports = app

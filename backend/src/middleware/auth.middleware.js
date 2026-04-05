const jwt = require('jsonwebtoken')

/**
 * Verifica el JWT y adjunta req.user
 */
const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token requerido' })

  try {
    req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

/**
 * Fábrica de middleware por rol
 * Uso: requireRole('ADMIN', 'TEACHER')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' })
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: `Acceso denegado. Se requiere: ${roles.join(' o ')}` })
  next()
}

// Aliases de roles
const isWorker  = requireRole('STUDENT_TP', 'STUDENT_EPJA')
const isStudent = requireRole('STUDENT_TP', 'STUDENT_EPJA')
const isCompany = requireRole('COMPANY')
const isTeacher = requireRole('TEACHER', 'ADMIN')
const isAdmin   = requireRole('ADMIN')
const isAny     = requireRole('STUDENT_TP', 'STUDENT_EPJA', 'COMPANY', 'TEACHER', 'ADMIN')

module.exports = { verifyToken, requireRole, isWorker, isStudent, isCompany, isTeacher, isAdmin, isAny }

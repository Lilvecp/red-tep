const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const prisma = require('../utils/prisma')

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const MIN_PASS    = 8

const ROLE_HOME = {
  STUDENT_TP:   '/feed',
  STUDENT_EPJA: '/feed',
  COMPANY:      '/feed',
  ADMIN:        '/admin',
}

const sign = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, nombre: user.nombre },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
)

const sanitize = (u) => ({
  id: u.id, nombre: u.nombre, email: u.email,
  role: u.role, redirectTo: ROLE_HOME[u.role]
})

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { nombre, email, password, role } = req.body

    if (!nombre?.trim())
      return res.status(400).json({ error: 'El nombre es requerido' })
    if (!EMAIL_REGEX.test(email?.trim()))
      return res.status(400).json({ error: 'Correo electrónico inválido' })
    if (!password || password.length < MIN_PASS)
      return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASS} caracteres` })

    const validRoles = ['STUDENT_TP', 'STUDENT_EPJA', 'COMPANY']
    if (!validRoles.includes(role))
      return res.status(400).json({ error: 'Rol inválido' })

    if (await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } }))
      return res.status(400).json({ error: 'El correo ya está registrado' })

    const user = await prisma.user.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 10),
        role,
      }
    })

    if (role === 'STUDENT_TP' || role === 'STUDENT_EPJA') {
      await prisma.worker.create({ data: { userId: user.id } })
    }
    if (role === 'COMPANY') {
      await prisma.company.create({ data: { userId: user.id, nombreEmpresa: nombre.trim() } })
    }

    res.status(201).json({ token: sign(user), user: sanitize(user) })
  } catch (err) {
    console.error('register error:', err.message)
    res.status(500).json({ error: 'Error al crear la cuenta' })
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const email    = req.body.email?.trim().toLowerCase()
    const password = req.body.password

    if (!email || !password)
      return res.status(400).json({ error: 'Correo y contraseña requeridos' })

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.activo)
      return res.status(401).json({ error: 'Credenciales inválidas' })

    if (!await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Credenciales inválidas' })

    res.json({ token: sign(user), user: sanitize(user) })
  } catch (err) {
    console.error('login error:', err.message)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
}

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, nombre: true, email: true, role: true, activo: true, createdAt: true }
    })
    res.json(user)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Error interno del servidor' })
  }
}

module.exports = { register, login, me }

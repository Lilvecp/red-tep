const { PrismaClient } = require('@prisma/client')

// En serverless cada función necesita máximo 1 conexión al pool.
// Sin esto Supabase pgbouncer se satura y lanza errores de conexión.
function buildUrl(raw) {
  if (!raw) return raw
  try {
    const u = new URL(raw)
    if (!u.searchParams.has('connection_limit'))  u.searchParams.set('connection_limit', '1')
    if (!u.searchParams.has('pool_timeout'))       u.searchParams.set('pool_timeout', '20')
    if (!u.searchParams.has('connect_timeout'))    u.searchParams.set('connect_timeout', '10')
    if (!u.searchParams.has('pgbouncer'))          u.searchParams.set('pgbouncer', 'true')
    return u.toString()
  } catch {
    return raw
  }
}

const prisma = global.prisma ?? new PrismaClient({
  datasources: { db: { url: buildUrl(process.env.DATABASE_URL) } },
  log: ['error'],
})

global.prisma = prisma
module.exports = prisma

// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()
const hash = (pw) => bcrypt.hashSync(pw, 10)

async function main() {
  console.log('🌱 Sembrando datos de prueba...')

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@redtep.cl' },
    update: {},
    create: {
      nombre: 'Administrador Colegio',
      email: 'admin@redtep.cl',
      password: hash('admin123'),
      role: 'ADMIN',
    }
  })

  // ── DOCENTE ────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'profesor@redtep.cl' },
    update: {},
    create: {
      nombre: 'Prof. Carlos Mendoza',
      email: 'profesor@redtep.cl',
      password: hash('prof123'),
      role: 'TEACHER',
    }
  })

  // ── ESTUDIANTE TP ──────────────────────────────────────────────────────────
  const juanUser = await prisma.user.upsert({
    where: { email: 'juan@redtep.cl' },
    update: {},
    create: {
      nombre: 'Juan Pérez González',
      email: 'juan@redtep.cl',
      password: hash('est123'),
      role: 'STUDENT_TP',
    }
  })

  await prisma.worker.upsert({
    where: { userId: juanUser.id },
    update: {},
    create: {
      userId: juanUser.id,
      edad: 18,
      telefono: '+56912345678',
      curso: '4to Medio TP',
      especialidad: 'Electricidad',
      experienciaPractica: 'Práctica en empresa eléctrica durante 3 meses. Instalación de tableros y cableado residencial.',
      disponibilidad: 'TIEMPO_COMPLETO',
      perfilCompleto: true,
      evaluacionSocioem: { responsabilidad: 5, proactividad: 4, trabajoEquipo: 4, puntualidad: 5 },
      habilidades: {
        create: [
          { nombre: 'Instalación eléctrica básica', categoria: 'Técnica', nivel: 4 },
          { nombre: 'Uso de herramientas eléctricas', categoria: 'Técnica', nivel: 5 },
          { nombre: 'Seguridad laboral', categoria: 'Técnica', nivel: 4 },
          { nombre: 'Trabajo en equipo', categoria: 'Blanda', nivel: 4 },
          { nombre: 'Puntualidad', categoria: 'Blanda', nivel: 5 },
        ]
      },
      insignias: {
        create: [
          { tipo: 'PERFIL_COMPLETO' },
          { tipo: 'EXPERIENCIA_PRACTICA' },
        ]
      }
    }
  })

  // ── ESTUDIANTE EPJA ────────────────────────────────────────────────────────
  const mariaUser = await prisma.user.upsert({
    where: { email: 'maria@redtep.cl' },
    update: {},
    create: {
      nombre: 'María Rodríguez Soto',
      email: 'maria@redtep.cl',
      password: hash('est123'),
      role: 'STUDENT_EPJA',
    }
  })

  await prisma.worker.upsert({
    where: { userId: mariaUser.id },
    update: {},
    create: {
      userId: mariaUser.id,
      edad: 32,
      telefono: '+56987654321',
      curso: '3er Año EPJA',
      especialidad: 'Gastronomía',
      experienciaPractica: 'Trabajo en restaurante por 2 años. Cocina chilena, repostería y BPM alimentarias.',
      disponibilidad: 'MEDIO_TIEMPO',
      perfilCompleto: true,
      evaluacionSocioem: { responsabilidad: 5, proactividad: 4, trabajoEquipo: 5, puntualidad: 4 },
      habilidades: {
        create: [
          { nombre: 'Cocina chilena', categoria: 'Técnica', nivel: 5 },
          { nombre: 'Repostería', categoria: 'Técnica', nivel: 4 },
          { nombre: 'BPM alimentarias', categoria: 'Técnica', nivel: 4 },
          { nombre: 'Gestión de cocina', categoria: 'Técnica', nivel: 3 },
          { nombre: 'Liderazgo', categoria: 'Blanda', nivel: 4 },
        ]
      },
      insignias: {
        create: [
          { tipo: 'PERFIL_COMPLETO' },
          { tipo: 'VALIDADO_POR_PROFESOR' },
          { tipo: 'EXPERIENCIA_PRACTICA' },
        ]
      }
    }
  })

  // ── EMPRESA ────────────────────────────────────────────────────────────────
  const empUser = await prisma.user.upsert({
    where: { email: 'empresa@constructora.cl' },
    update: {},
    create: {
      nombre: 'Constructora Sur Ltda.',
      email: 'empresa@constructora.cl',
      password: hash('emp123'),
      role: 'COMPANY',
    }
  })

  const empresa = await prisma.company.upsert({
    where: { userId: empUser.id },
    update: {},
    create: {
      userId: empUser.id,
      nombreEmpresa: 'Constructora Sur Ltda.',
      rut: '76.543.210-9',
      rubro: 'Construcción',
      comuna: 'Lo Espejo',
      telefono: '+56222345678',
      aprobada: true,
    }
  })

  // ── OFERTAS ────────────────────────────────────────────────────────────────
  const ofertaExiste = await prisma.oferta.findFirst({ where: { companyId: empresa.id } })
  if (!ofertaExiste) {
    await prisma.oferta.createMany({
      data: [
        {
          companyId: empresa.id,
          cargo: 'Ayudante Eléctrico',
          descripcion: 'Buscamos ayudante eléctrico para obras en Lo Espejo y alrededores.',
          especialidadRequerida: 'Electricidad',
          comuna: 'Lo Espejo',
          disponibilidad: 'TIEMPO_COMPLETO',
          salario: '$450.000 + Bonos',
          horario: 'Lunes a Viernes 08:00-17:00',
          requisitos: ['Conocimientos eléctricos básicos','Puntualidad','Trabajo en equipo'],
        },
        {
          companyId: empresa.id,
          cargo: 'Técnico en Mantención',
          descripcion: 'Se requiere técnico para mantención preventiva y correctiva de instalaciones.',
          especialidadRequerida: 'Electricidad',
          comuna: 'Santiago',
          disponibilidad: 'TIEMPO_COMPLETO',
          salario: '$550.000',
          horario: 'Lunes a Viernes 09:00-18:00',
          requisitos: ['Experiencia en mantención','Licencia clase B (deseable)'],
        }
      ]
    })
  }

  // ── EVENTO ─────────────────────────────────────────────────────────────────
  const eventoExiste = await prisma.evento.findFirst()
  if (!eventoExiste) {
    await prisma.evento.create({
      data: {
        titulo: 'Feria Técnica Regional RED TEP',
        descripcion: 'Evento anual donde estudiantes presentan sus proyectos técnicos a empresas del territorio.',
        fecha: new Date('2026-05-24T09:00:00'),
        lugar: 'Gimnasio C.E. Cardenal José María Caro',
        creadoPor: 'COLEGIO',
        creadoPorId: 1,
      }
    })
  }

  // ── OPCIONES DE FILTRO (especialidades) ────────────────────────────────────
  const especialidades = [
    'Electricidad', 'Telecomunicaciones', 'Gastronomía',
    'Construcción', 'Administración', 'Mecánica Automotriz',
    'Informática', 'Contabilidad',
  ]
  for (const valor of especialidades) {
    await prisma.filterOption.upsert({
      where: { tipo_valor: { tipo: 'especialidad', valor } },
      update: {},
      create: { tipo: 'especialidad', valor },
    })
  }

  console.log('✅ Seed completado')
  console.log('   admin@redtep.cl      / admin123  → ADMIN')
  console.log('   profesor@redtep.cl   / prof123   → TEACHER')
  console.log('   juan@redtep.cl       / est123    → STUDENT_TP')
  console.log('   maria@redtep.cl      / est123    → STUDENT_EPJA')
  console.log('   empresa@constructora.cl / emp123 → COMPANY')
}

main().catch(console.error).finally(() => prisma.$disconnect())

# RED TEP — Red Técnico · Empresa · Profesor
## Centro Educacional Cardenal José María Caro

Plataforma web responsiva que conecta trabajadores técnicos con empresas del territorio, con validación docente.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express + Prisma ORM |
| Base de datos | PostgreSQL |
| Storage | Cloudinary |
| Deploy frontend | Vercel |
| Deploy backend | Railway |

## Equipo

| Persona | Rol |
|---------|-----|
| Valentín Castro | P3 — Fullstack + QA + Deploy |
| Miguel Figueroa | P1 — Frontend React |
| Sebastián Bunzli | P2 — Backend Node.js |

## Setup rápido

```bash
# Backend
cd backend
npm install
cp .env.example .env        # editar con tus datos de PostgreSQL
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:8080

# Frontend (nueva terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

## Usuarios de prueba (después del seed)

| Email | Password | Rol |
|-------|----------|-----|
| admin@redtep.cl | admin123 | ADMIN |
| profesor@redtep.cl | prof123 | TEACHER |
| juan@redtep.cl | est123 | STUDENT_TP |
| maria@redtep.cl | est123 | STUDENT_EPJA |
| empresa@constructora.cl | emp123 | COMPANY |

## Vistas disponibles

| Ruta | Vista | Roles permitidos |
|------|-------|-----------------|
| / | Landing | Público |
| /auth | Login / Registro | Público |
| /perfil | Perfil del trabajador | STUDENT_TP, STUDENT_EPJA |
| /ofertas | Bolsa de trabajo | STUDENT_TP, STUDENT_EPJA |
| /ofertas/:id | Detalle oferta | STUDENT_TP, STUDENT_EPJA |
| /practicas | Mis prácticas / media | STUDENT_TP, STUDENT_EPJA |
| /candidatos | Explorar candidatos | COMPANY |
| /mis-ofertas | Gestión de ofertas | COMPANY |
| /admin | Panel administración | ADMIN, TEACHER |
| /admin/validaciones | Validar competencias | TEACHER, ADMIN |
| /admin/eventos | Gestión de eventos | ADMIN |

## Convenciones Git

```
feat:     nueva funcionalidad
fix:      corrección de bug
style:    cambios de UI/CSS
refactor: reestructura de código
docs:     documentación
test:     pruebas
chore:    configuración
```

## Flujo de ramas

```
main        ← producción (PR aprobado)
develop     ← integración del equipo
feat/...    ← nuevas funcionalidades
fix/...     ← correcciones
```

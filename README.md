# RED TEP — Red Técnico · Empresa · Profesor

> Plataforma web responsiva que conecta estudiantes técnicos del C.E. Cardenal José María Caro con empresas del territorio local, con validación docente integrada.

---

## Demo en producción

| Servicio | URL |
|----------|-----|
| **Aplicación web** | https://red-tep-frontend-fn3o585wa-lilvecps-projects.vercel.app |
| **API Backend** | https://red-tep-backend-qtm4prr84-lilvecps-projects.vercel.app |

### Credenciales de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@redtep.cl` | `admin123` | Administrador |
| `profesor@redtep.cl` | `prof123` | Docente validador |
| `juan@redtep.cl` | `est123` | Estudiante TP (diurno) |
| `maria@redtep.cl` | `est123` | Estudiante EPJA (vespertino) |
| `empresa@constructora.cl` | `emp123` | Empresa reclutadora |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js 20 + Express 4 |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL (Supabase) |
| Storage | Cloudinary |
| Realtime (chat) | Supabase Realtime |
| Deploy | Vercel (frontend + backend serverless) |

---

## Estructura del proyecto

```
red-tep-full/
├── frontend/                  # Aplicación React
│   ├── src/
│   │   ├── pages/             # Vistas por rol (17 páginas)
│   │   ├── components/        # Componentes reutilizables
│   │   │   ├── ui/            # Átomos: Avatar, Badge, Input, etc.
│   │   │   ├── layout/        # AppLayout, navbar responsivo
│   │   │   ├── feed/          # PostCard, CreatePost
│   │   │   └── chat/          # ChatWidget, mensajería
│   │   ├── services/          # Capa Axios (llamadas a la API)
│   │   ├── store/             # Estado global (Zustand)
│   │   ├── context/           # ChatContext (Supabase Realtime)
│   │   ├── routes/            # Guards por rol (RoleRoute)
│   │   └── App.jsx            # Router principal
│   ├── .env.example
│   └── package.json
│
├── backend/                   # API REST Node.js
│   ├── src/
│   │   ├── controllers/       # Lógica de negocio (14 dominios)
│   │   ├── routes/            # Endpoints Express (14 módulos)
│   │   ├── middleware/        # Autenticación JWT
│   │   └── utils/             # PrismaClient singleton
│   ├── prisma/
│   │   ├── schema.prisma      # 20+ modelos de datos
│   │   └── migrations/        # Historial de migraciones
│   ├── .env.example
│   └── package.json
│
├── docs/                      # Documentación técnica
└── README.md
```

---

## Roles del sistema

| Rol | Descripción | Ruta principal |
|-----|-------------|----------------|
| `STUDENT_TP` | Estudiante técnico diurno | `/perfil` |
| `STUDENT_EPJA` | Estudiante técnico vespertino | `/perfil` |
| `COMPANY` | Empresa reclutadora | `/candidatos` |
| `TEACHER` | Docente validador | `/admin/validaciones` |
| `ADMIN` | Administración del colegio | `/admin` |

---

## Instalación local

### Requisitos previos

- Node.js 20+
- PostgreSQL 15+ (o cuenta Supabase)
- Cuenta Cloudinary (para subida de imágenes)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL y Cloudinary
npm run db:migrate        # Aplica migraciones Prisma
npm run db:seed           # Carga datos de prueba
npm run dev               # http://localhost:8080
```

### Frontend

```bash
# En una nueva terminal
cd frontend
npm install
cp .env.example .env
# Editar .env con VITE_API_URL=http://localhost:8080
npm run dev               # http://localhost:5173
```

### Variables de entorno

**backend/.env.example**
```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/redtep
DIRECT_URL=postgresql://usuario:password@localhost:5432/redtep
JWT_SECRET=tu_secreto_jwt
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**frontend/.env.example**
```env
VITE_API_URL=http://localhost:8080
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Rutas disponibles

| Ruta | Vista | Acceso |
|------|-------|--------|
| `/` | Landing page | Público |
| `/auth` | Login / Registro | Público |
| `/feed` | Feed social | Autenticado |
| `/perfil` | Perfil del trabajador | STUDENT |
| `/ofertas` | Bolsa de trabajo | STUDENT |
| `/ofertas/:id` | Detalle de oferta | STUDENT |
| `/practicas` | Mis prácticas | STUDENT |
| `/cv` | Currículum digital | STUDENT |
| `/candidatos` | Explorar candidatos | COMPANY |
| `/mis-ofertas` | Gestión de ofertas | COMPANY |
| `/admin` | Panel administración | ADMIN, TEACHER |
| `/admin/validaciones` | Validar competencias | TEACHER, ADMIN |
| `/admin/eventos` | Gestión de eventos | ADMIN |

---

## Convenciones Git

```
feat:      nueva funcionalidad
fix:       corrección de bug
style:     cambios de UI/CSS
refactor:  reestructura de código
docs:      documentación
test:      pruebas
chore:     configuración
```

---

## Equipo

| Persona | Rol |
|---------|-----|
| Valentín Castro | P3 — Fullstack + QA + Deploy |
| Miguel Figueroa | P1 — Frontend React |
| Sebastián Bunzli | P2 — Backend Node.js |

---

*Centro Educacional Cardenal José María Caro — 2026*

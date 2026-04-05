import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

// Páginas públicas
import LandingPage from './pages/LandingPage'
import AuthPage    from './pages/AuthPage'

// Páginas para todos los roles autenticados
import FeedPage    from './pages/FeedPage'
import EventosPage from './pages/EventosPage'
import ProfilePage from './pages/ProfilePage'

// Trabajador / Estudiante
import OfertasPage         from './pages/worker/OfertasPage'
import OfertaDetalle       from './pages/worker/OfertaDetalle'
import PublicWorkerProfile from './pages/worker/PublicWorkerProfile'

// Empresa
import CandidatosPage        from './pages/company/CandidatosPage'
import PublicCompanyProfile  from './pages/company/PublicCompanyProfile'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'

// Guards
import PrivateRoute from './routes/PrivateRoute'
import RoleRoute    from './routes/RoleRoute'

const WORKER_ROLES  = ['STUDENT_TP', 'STUDENT_EPJA']
const COMPANY_ROLES = ['COMPANY']
const ADMIN_ROLES   = ['ADMIN']
const ALL_ROLES     = [...WORKER_ROLES, ...COMPANY_ROLES, ...ADMIN_ROLES]

function HomeRedirect() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/feed" replace /> : <LandingPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#142040',
            color: '#ddeaf8',
            border: '1px solid rgba(77,160,232,0.18)',
            fontFamily: "'Figtree','DM Sans',sans-serif",
          }
        }}
      />
      <Routes>
        {/* Públicas */}
        <Route path="/"     element={<HomeRedirect />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Privadas */}
        <Route element={<PrivateRoute />}>

          {/* Todos los roles */}
          <Route element={<RoleRoute roles={ALL_ROLES} />}>
            <Route path="/feed"                    element={<FeedPage />} />
            <Route path="/eventos"                 element={<EventosPage />} />
            <Route path="/perfil"                  element={<ProfilePage />} />
            <Route path="/trabajadores/:id"        element={<PublicWorkerProfile />} />
            <Route path="/empresas/:userId"        element={<PublicCompanyProfile />} />
          </Route>

          {/* Estudiantes */}
          <Route element={<RoleRoute roles={WORKER_ROLES} />}>
            <Route path="/ofertas"     element={<OfertasPage />} />
            <Route path="/ofertas/:id" element={<OfertaDetalle />} />
          </Route>

          {/* Empresa */}
          <Route element={<RoleRoute roles={COMPANY_ROLES} />}>
            <Route path="/candidatos" element={<CandidatosPage />} />
          </Route>

          {/* Admin */}
          <Route element={<RoleRoute roles={ADMIN_ROLES} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

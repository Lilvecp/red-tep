import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import { ChatProvider } from './context/ChatContext'

// Públicas
import LandingPage from './pages/LandingPage'
import AuthPage    from './pages/AuthPage'

// Todos los roles autenticados
import FeedPage    from './pages/FeedPage'
import EventosPage from './pages/EventosPage'
import ProfilePage from './pages/ProfilePage'

// Estudiante
import OfertasPage         from './pages/worker/OfertasPage'
import OfertaDetalle       from './pages/worker/OfertaDetalle'
import PublicWorkerProfile from './pages/worker/PublicWorkerProfile'
import CVPage              from './pages/worker/CVPage'

// Empresa
import CandidatosPage       from './pages/company/CandidatosPage'
import PublicCompanyProfile from './pages/company/PublicCompanyProfile'
import MisOfertasPage       from './pages/company/MisOfertasPage'

// Admin
import AdminDashboard   from './pages/admin/AdminDashboard'
import ValidacionesPage from './pages/admin/ValidacionesPage'

// Guards
import PrivateRoute from './routes/PrivateRoute'
import RoleRoute    from './routes/RoleRoute'

// STUDENT = nuevo rol unificado; STUDENT_TP/STUDENT_EPJA = legacy
export const STUDENT_ROLES = ['STUDENT', 'STUDENT_TP', 'STUDENT_EPJA']
const COMPANY_ROLES = ['COMPANY']
const ADMIN_ROLES   = ['ADMIN']
const ALL_ROLES     = [...STUDENT_ROLES, ...COMPANY_ROLES, ...ADMIN_ROLES, 'TEACHER']

function HomeRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <LandingPage />
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Navigate to="/feed" replace />
}

export default function App() {
  return (
    <ChatProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF', color: '#1A2035',
            border: '1px solid rgba(42,51,83,0.15)',
            fontFamily: "'Figtree','DM Sans',sans-serif",
            boxShadow: '0 4px 16px rgba(42,51,83,0.12)',
          },
          success: { iconTheme: { primary: '#2A3353', secondary: '#FFFFFF' } },
          error:   { iconTheme: { primary: '#dc2626', secondary: '#FFFFFF' } },
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
            <Route path="/feed"             element={<FeedPage />} />
            <Route path="/eventos"          element={<EventosPage />} />
            <Route path="/perfil"           element={<ProfilePage />} />
            <Route path="/trabajadores/:id" element={<PublicWorkerProfile />} />
            <Route path="/empresas/:userId" element={<PublicCompanyProfile />} />
          </Route>

          {/* Estudiantes */}
          <Route element={<RoleRoute roles={STUDENT_ROLES} />}>
            <Route path="/ofertas"     element={<OfertasPage />} />
            <Route path="/ofertas/:id" element={<OfertaDetalle />} />
            <Route path="/mi-cv"       element={<CVPage />} />
          </Route>

          {/* Empresa */}
          <Route element={<RoleRoute roles={COMPANY_ROLES} />}>
            <Route path="/candidatos"  element={<CandidatosPage />} />
            <Route path="/mis-ofertas" element={<MisOfertasPage />} />
          </Route>

          {/* Admin (panel completo) */}
          <Route element={<RoleRoute roles={ADMIN_ROLES} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Admin + Docente */}
          <Route element={<RoleRoute roles={['ADMIN', 'TEACHER']} />}>
            <Route path="/admin/validaciones" element={<ValidacionesPage />} />
          </Route>

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ChatProvider>
  )
}

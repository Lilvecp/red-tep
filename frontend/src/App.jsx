import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import { ChatProvider } from './context/ChatContext'
import PrivateRoute from './routes/PrivateRoute'
import RoleRoute    from './routes/RoleRoute'

// Públicas — carga inmediata
import LandingPage from './pages/LandingPage'
import AuthPage    from './pages/AuthPage'

// Privadas — lazy para code splitting
const FeedPage    = lazy(() => import('./pages/FeedPage'))
const EventosPage = lazy(() => import('./pages/EventosPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

const OfertasPage         = lazy(() => import('./pages/worker/OfertasPage'))
const OfertaDetalle       = lazy(() => import('./pages/worker/OfertaDetalle'))
const PublicWorkerProfile = lazy(() => import('./pages/worker/PublicWorkerProfile'))
const CVPage              = lazy(() => import('./pages/worker/CVPage'))

const CandidatosPage       = lazy(() => import('./pages/company/CandidatosPage'))
const PublicCompanyProfile = lazy(() => import('./pages/company/PublicCompanyProfile'))
const MisOfertasPage       = lazy(() => import('./pages/company/MisOfertasPage'))

const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'))
const ValidacionesPage = lazy(() => import('./pages/admin/ValidacionesPage'))

function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#F5F7FB' }}>
      <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#3B6EDC', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </BrowserRouter>
    </ChatProvider>
  )
}

import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const ROLE_HOME = {
  STUDENT_TP:   '/perfil',
  STUDENT_EPJA: '/perfil',
  COMPANY:      '/candidatos',
  TEACHER:      '/admin',
  ADMIN:        '/admin',
}

export default function RoleRoute({ roles }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth" replace />
  if (!roles.includes(user.role))
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  return <Outlet />
}

import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const ROLE_HOME = {
  STUDENT:      '/feed',
  STUDENT_TP:   '/feed',
  STUDENT_EPJA: '/feed',
  COMPANY:      '/feed',
  TEACHER:      '/feed',
  ADMIN:        '/admin',
}

export default function RoleRoute({ roles }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth" replace />
  if (!roles.includes(user.role))
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  return <Outlet />
}

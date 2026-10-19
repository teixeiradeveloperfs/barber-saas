import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

/** Exige sessão. Senha temporária manda para Minha conta antes de qualquer coisa. */
export function RequireAuth() {
  const { token, admin, checking } = useAuth()
  const location = useLocation()
  if (checking) return null
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (admin?.mustChangePassword && location.pathname !== '/conta') return <Navigate to="/conta" replace />
  return <Outlet />
}

/** Só quem opera a plataforma. Dono cai na lista dele. */
export function RequirePlatform() {
  const { admin, isPlatform } = useAuth()
  if (!admin) return null
  if (!isPlatform) return <Navigate to="/barbearias" replace />
  return <Outlet />
}

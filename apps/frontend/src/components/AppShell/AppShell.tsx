import { Navigate, Outlet, matchPath, useLocation } from 'react-router-dom'
import { useUser } from '../../user/useUser'
import styles from './AppShell.module.css'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

/**
 * Casca das telas autenticadas: sidebar no desktop, barra inferior no celular.
 * As páginas entram pelo <Outlet />.
 */
/** Rotas de fluxo focado: sem barra inferior, a própria tela traz o CTA fixo. */
const FOCUSED_ROUTES = ['/agendar/:barberId']

export function AppShell() {
  const { pathname } = useLocation()
  const { user } = useUser()
  const focused = FOCUSED_ROUTES.some((pattern) => matchPath(pattern, pathname))

  if (!user.onboardingDone) return <Navigate to="/bem-vindo" replace />

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={[styles.main, focused && styles.focused].filter(Boolean).join(' ')}>
        <Outlet />
      </div>
      {!focused && <BottomNav />}
    </div>
  )
}

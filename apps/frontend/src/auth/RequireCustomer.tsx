import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCustomerAuth } from './useCustomerAuth'
import styles from './RequireCustomer.module.css'

/** Área do cliente: sem sessão vai para o login e volta para onde estava depois. */
export function RequireCustomer() {
  const { status } = useCustomerAuth()
  const location = useLocation()
  if (status === 'carregando') return <div className={styles.screen} aria-busy="true" aria-label="Carregando" />
  if (status === 'visitante') return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  return <Outlet />
}

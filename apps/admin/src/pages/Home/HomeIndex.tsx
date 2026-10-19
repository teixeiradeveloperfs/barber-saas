import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Loading } from '../../components/Loading/Loading'
import { lastAgendaTenant } from '../Agenda/last-tenant'

/** /inicio leva ao painel da barbearia única. */
export function HomeIndex() {
  const { admin, ready } = useAuth()
  if (!admin) return null
  if (!ready) return <Loading label="Carregando…" />
  const ids = admin.tenants.filter((tenant) => tenant.role !== 'BARBEIRO').map((tenant) => tenant.id)
  if (ids.length === 0) return <Navigate to="/agenda" replace />
  const remembered = lastAgendaTenant()
  return <Navigate to={`/inicio/${remembered && ids.includes(remembered) ? remembered : ids[0]}`} replace />
}

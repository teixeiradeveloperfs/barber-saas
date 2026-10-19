import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Card } from '../../components/Card/Card'
import { Loading } from '../../components/Loading/Loading'
import { lastAgendaTenant } from '../Agenda/last-tenant'

/** /acessos sem barbearia: a última aberta, senão a primeira em que a pessoa é dona. */
export function AccessIndex() {
  const { admin, ready } = useAuth()
  if (!admin) return null
  if (!ready) return <Loading label="Carregando…" />
  const ids = admin.tenants.filter((tenant) => tenant.role === 'DONO').map((tenant) => tenant.id)
  if (ids.length === 0) {
    return (
      <Card title="Acessos">
        <p style={{ margin: 0, color: 'var(--text-3)' }}>Só o dono da barbearia gerencia acessos.</p>
      </Card>
    )
  }
  const remembered = lastAgendaTenant()
  return <Navigate to={`/acessos/${remembered && ids.includes(remembered) ? remembered : ids[0]}`} replace />
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Card } from '../../components/Card/Card'
import { Loading } from '../../components/Loading/Loading'
import { lastAgendaTenant } from '../Agenda/last-tenant'

/** /equipe sem barbearia: última aberta, senão a primeira em que a pessoa manda. */
export function TeamIndex() {
  const { admin, ready } = useAuth()
  if (!admin) return null
  if (!ready) return <Loading label="Carregando…" />
  const ids = admin.tenants.filter((tenant) => tenant.role !== 'BARBEIRO').map((tenant) => tenant.id)
  if (ids.length === 0) {
    return (
      <Card title="Equipe">
        <p style={{ margin: 0, color: 'var(--text-3)' }}>Você não gerencia a equipe.</p>
      </Card>
    )
  }
  const remembered = lastAgendaTenant()
  return <Navigate to={`/equipe/${remembered && ids.includes(remembered) ? remembered : ids[0]}`} replace />
}

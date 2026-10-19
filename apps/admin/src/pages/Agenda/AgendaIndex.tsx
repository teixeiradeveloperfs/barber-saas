import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Card } from '../../components/Card/Card'
import { Loading } from '../../components/Loading/Loading'
import { lastAgendaTenant } from './last-tenant'

/** Sem barbearia na URL: usa a última aberta, senão a primeira. */
export function AgendaIndex() {
  const { admin, ready } = useAuth()
  if (!admin) return null
  if (!ready) return <Loading label="Carregando…" />
  const ids = admin.tenants.map((tenant) => tenant.id)
  if (ids.length === 0) {
    return (
      <Card title="Agenda">
        <p style={{ margin: 0, color: 'var(--text-3)' }}>O acesso ainda não está configurado.</p>
      </Card>
    )
  }
  const remembered = lastAgendaTenant()
  const target = remembered && ids.includes(remembered) ? remembered : ids[0]
  return <Navigate to={`/agenda/${target}`} replace />
}

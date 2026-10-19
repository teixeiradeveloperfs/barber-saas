import { Navigate } from 'react-router-dom'
import { isManagerRole, isOwnerRole } from '../../auth/useTenantRole'
import { ConfigCard } from './ConfigCard'
import { MembersCard } from './MembersCard'
import { PreviewCard } from './PreviewCard'
import { useTenantOutlet } from './tenant-context'
import styles from './OverviewPage.module.css'

export function OverviewPage() {
  const { tenant, role, mutate } = useTenantOutlet()
  if (!isManagerRole(role)) return <Navigate to={`/agenda/${tenant.id}`} replace />
  return (
    <div className={styles.grid}>
      <div className={styles.column}>
        <ConfigCard tenant={tenant} mutate={mutate} />
        {isOwnerRole(role) && <MembersCard tenant={tenant} />}
      </div>
      <div className={styles.preview}>
        <PreviewCard tenant={tenant} />
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useParams } from 'react-router-dom'
import { adminApi, publicUrl, type TenantDetail } from '../../api/admin'
import { useAuth } from '../../auth/useAuth'
import { isManagerRole, isOwnerRole, useTenantRole } from '../../auth/useTenantRole'
import { Badge, type BadgeTone } from '../../components/Badge/Badge'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage, tenantStatusLabel } from '../../lib/format'
import { useResource } from '../../lib/useResource'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { ArrowLeftIcon, ShareIcon } from '../../ui/icons/Icons'
import { EditorProvider } from '../../editor/EditorProvider'
import { MediaScopeContext } from '../../media/media-scope'
import { TENANT_TABS } from './tabs'
import type { TenantOutlet } from './tenant-context'
import styles from './TenantLayout.module.css'

const statusTone: Record<TenantDetail['status'], BadgeTone> = {
  ATIVO: 'ok',
  SUSPENSO: 'warn',
  ENCERRADO: 'danger',
}


export function TenantLayout() {
  const { id = '' } = useParams()
  const toast = useToast()
  const { isPlatform } = useAuth()
  const role = useTenantRole(id)
  const owner = isOwnerRole(role)
  const manager = isManagerRole(role)
  const resource = useResource(() => adminApi.getTenant(id), [id])
  const [confirmStatus, setConfirmStatus] = useState<TenantDetail['status'] | null>(null)
  const [changing, setChanging] = useState(false)

  const tenant = resource.data

  async function changeStatus(status: TenantDetail['status']) {
    if (!tenant) return
    setChanging(true)
    try {
      const updated = await adminApi.updateTenant(tenant.id, { status })
      resource.mutate((current) => ({ ...current, ...updated, configs: current.configs, freeHostname: current.freeHostname }))
      toast({ kind: 'ok', title: status === 'ATIVO' ? 'Barbearia reativada' : 'Barbearia suspensa' })
      setConfirmStatus(null)
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível alterar o status', detail: errorMessage(caught) })
    } finally {
      setChanging(false)
    }
  }

  // Gestor e barbeiro não montam o app: operam pela Agenda.
  // Dono e gestor montam; barbeiro cai na própria agenda.
  if (!manager) return <Navigate to={`/agenda/${id}`} replace />
  if (resource.loading && !tenant) return <Loading label="Carregando barbearia…" />
  if (resource.error && !tenant) return <ErrorState message={resource.error} onRetry={resource.reload} />
  if (!tenant) return null

  const context: TenantOutlet = { tenant, role, reload: resource.reload, mutate: resource.mutate }
  const suspended = tenant.status !== 'ATIVO'

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/barbearias" className={styles.back}>
            <ArrowLeftIcon />
            {isPlatform ? 'Barbearias' : 'Minhas barbearias'}
          </Link>
        }
        title={tenant.name}
        description={
          <span className={styles.subtitle}>
            <Badge tone={statusTone[tenant.status]}>{tenantStatusLabel[tenant.status]}</Badge>
            <code>{tenant.slug}</code>
            <span>{tenant.freeHostname}</span>
          </span>
        }
        actions={
          <>
            {owner && (
              <Button variant="ghost" size="sm" onClick={() => window.open(publicUrl(tenant), '_blank', 'noopener')}>
                <ShareIcon />
                Abrir app
              </Button>
            )}
            {isPlatform && suspended && (
              <Button size="sm" onClick={() => setConfirmStatus('ATIVO')}>
                Reativar
              </Button>
            )}
            {isPlatform && !suspended && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmStatus('SUSPENSO')}>
                Suspender
              </Button>
            )}
          </>
        }
      />

      <nav className={styles.tabs} aria-label="Seções da barbearia">
        {TENANT_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={'end' in tab ? tab.end : false}
            className={({ isActive }) => [styles.tab, isActive && styles.tabActive].filter(Boolean).join(' ')}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <MediaScopeContext.Provider value={tenant.id}>
        <EditorProvider tenant={tenant} mutate={resource.mutate}>
          <Outlet context={context} />
        </EditorProvider>
      </MediaScopeContext.Provider>

      <Dialog
        open={confirmStatus !== null}
        onClose={() => setConfirmStatus(null)}
        title={confirmStatus === 'ATIVO' ? 'Reativar barbearia?' : 'Suspender barbearia?'}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmStatus(null)} disabled={changing}>
              Cancelar
            </Button>
            <Button variant={confirmStatus === 'ATIVO' ? 'primary' : 'danger'} loading={changing} onClick={() => confirmStatus && changeStatus(confirmStatus)}>
              {confirmStatus === 'ATIVO' ? 'Reativar' : 'Suspender'}
            </Button>
          </>
        }
      >
        <p className={styles.dialogText}>
          {confirmStatus === 'ATIVO'
            ? 'O app volta a responder em todos os domínios desta barbearia.'
            : 'O app deixa de responder para os clientes em todos os domínios. Nada é apagado e você pode reativar quando quiser.'}
        </p>
      </Dialog>
    </>
  )
}

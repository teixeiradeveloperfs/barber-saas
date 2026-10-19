import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, type TenantDetail } from '../../api/admin'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage, formatDateTime } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import type { TenantOutlet } from './tenant-context'
import styles from './ConfigCard.module.css'

type Props = { tenant: TenantDetail; mutate: TenantOutlet['mutate'] }

export function ConfigCard({ tenant, mutate }: Props) {
  const toast = useToast()
  const { published, draft } = tenant.configs
  const [confirm, setConfirm] = useState<'publish' | 'discard' | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: 'publish' | 'discard') {
    setBusy(true)
    try {
      const configs = action === 'publish' ? await adminApi.publish(tenant.id) : await adminApi.discardDraft(tenant.id)
      mutate((current) => ({ ...current, configs }))
      toast({
        kind: 'ok',
        title: action === 'publish' ? `Versão ${configs.published?.version ?? ''} publicada` : 'Rascunho descartado',
        detail: action === 'publish' ? 'O app dos clientes já mostra a nova configuração.' : undefined,
      })
      setConfirm(null)
    } catch (caught) {
      toast({ kind: 'erro', title: action === 'publish' ? 'Não foi possível publicar' : 'Não foi possível descartar', detail: errorMessage(caught) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card
        title="Publicação"
        description="O app dos clientes mostra sempre a versão publicada. Alterações ficam no rascunho até você publicar."
        actions={
          <>
            {draft && (
              <Button variant="ghost" size="sm" onClick={() => setConfirm('discard')}>
                Descartar rascunho
              </Button>
            )}
            <Button size="sm" disabled={!draft} onClick={() => setConfirm('publish')}>
              Publicar rascunho
            </Button>
          </>
        }
      >
        <div className={styles.versions}>
          <div className={styles.version}>
            <div className={styles.versionHead}>
              <span className={styles.versionLabel}>No ar</span>
              {published ? <Badge tone="ok">v{published.version}</Badge> : <Badge>Nada publicado</Badge>}
            </div>
            <p className={styles.versionMeta}>
              {published ? `Publicada em ${formatDateTime(published.at)}` : 'Os clientes ainda não conseguem abrir o app desta barbearia.'}
            </p>
          </div>
          <div className={styles.version}>
            <div className={styles.versionHead}>
              <span className={styles.versionLabel}>Rascunho</span>
              {draft ? <Badge tone="warn">v{draft.version}</Badge> : <Badge>Sem alterações</Badge>}
            </div>
            <p className={styles.versionMeta}>
              {draft ? (
                <>
                  Salvo em {formatDateTime(draft.at)}. <Link to="marca">Continuar editando</Link>
                </>
              ) : (
                <>
                  Tudo publicado. <Link to="marca">Editar configuração</Link>
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'publish' ? 'Publicar rascunho?' : 'Descartar rascunho?'}
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant={confirm === 'publish' ? 'primary' : 'danger'} loading={busy} onClick={() => confirm && run(confirm)}>
              {confirm === 'publish' ? 'Publicar' : 'Descartar'}
            </Button>
          </>
        }
      >
        <p className={styles.dialogText}>
          {confirm === 'publish'
            ? `A versão ${draft?.version ?? ''} substitui a atual no app dos clientes assim que você confirmar.`
            : 'As alterações não publicadas são apagadas. A versão no ar continua igual.'}
        </p>
      </Dialog>
    </>
  )
}

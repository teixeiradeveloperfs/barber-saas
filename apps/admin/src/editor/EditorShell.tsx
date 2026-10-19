import { Navigate, Outlet } from 'react-router-dom'
import { isManagerRole } from '../auth/useTenantRole'
import { Card } from '../components/Card/Card'
import { PreviewCard } from '../pages/Tenant/PreviewCard'
import { useTenantOutlet } from '../pages/Tenant/tenant-context'
import { SaveBar } from './SaveBar'
import { useEditorState } from './useEditor'
import styles from './EditorShell.module.css'

/** Duas colunas: formulário da seção + preview fixo; barra de salvar embaixo. */
export function EditorShell() {
  const outlet = useTenantOutlet()
  const { working, savedCount } = useEditorState()
  if (!isManagerRole(outlet.role)) return <Navigate to={`/agenda/${outlet.tenant.id}`} replace />

  if (!working) {
    return (
      <Card title="Sem configuração">
        <p className={styles.emptyText}>Esta barbearia ainda não tem rascunho nem versão publicada. Crie um rascunho pela API ou recrie a barbearia.</p>
      </Card>
    )
  }

  return (
    <div className={styles.layout}>
      <div className={styles.form}>
        <Outlet context={outlet} />
      </div>
      <aside className={styles.preview}>
        <PreviewCard tenant={outlet.tenant} compact refreshKey={savedCount} />
      </aside>
      <SaveBar />
    </div>
  )
}

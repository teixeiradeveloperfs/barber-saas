import { Button } from '../ui/Button/Button'
import { useEditorState } from './useEditor'
import styles from './SaveBar.module.css'

/**
 * Aparece com alterações não salvas ou com rascunho salvo e ainda não
 * publicado: o app dos clientes só muda depois de publicar.
 */
export function SaveBar() {
  const { dirty, saving, publishing, issues, hasDraft, draftVersion, save, saveAndPublish, reset } = useEditorState()
  const issueCount = Object.keys(issues).length
  if (!dirty && issueCount === 0 && !hasDraft) return null

  const title = issueCount
    ? `${issueCount} ${issueCount === 1 ? 'campo precisa' : 'campos precisam'} de atenção`
    : dirty
      ? 'Alterações não salvas'
      : `Rascunho v${draftVersion} ainda não publicado`
  const text = issueCount
    ? 'Corrija os campos marcados e salve de novo.'
    : dirty
      ? 'Salvar guarda o rascunho e atualiza o preview. Só publicar muda o app dos clientes.'
      : 'O app dos clientes continua na versão anterior até você publicar.'

  return (
    <div className={styles.bar} role="region" aria-label="Alterações">
      <div className={styles.text}>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      <div className={styles.actions}>
        {dirty && (
          <Button variant="ghost" size="sm" onClick={reset} disabled={saving || publishing}>
            Desfazer
          </Button>
        )}
        {dirty && (
          <Button variant="ghost" size="sm" onClick={save} loading={saving} disabled={publishing}>
            Salvar rascunho
          </Button>
        )}
        <Button size="sm" onClick={saveAndPublish} loading={publishing} disabled={saving || issueCount > 0}>
          {dirty ? 'Salvar e publicar' : 'Publicar agora'}
        </Button>
      </div>
    </div>
  )
}

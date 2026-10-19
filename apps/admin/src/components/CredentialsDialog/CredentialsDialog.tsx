import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { CopyButton } from '../CopyButton/CopyButton'
import styles from './CredentialsDialog.module.css'

export type Credentials = { name: string; email: string; temporaryPassword: string }

type Props = {
  credentials: Credentials | null
  onClose: () => void
  /** Texto de contexto, ex.: "Dono vinculado à Barbearia do Zé". */
  context?: string
}

/** Mostra e-mail + senha temporária uma única vez, com tudo copiável. */
export function CredentialsDialog({ credentials, onClose, context }: Props) {
  const both = credentials ? `E-mail: ${credentials.email}\nSenha temporária: ${credentials.temporaryPassword}` : ''
  return (
    <Dialog
      open={credentials !== null}
      onClose={onClose}
      title="Acesso criado"
      actions={
        <>
          {credentials && <CopyButton value={both} label="Copiar os dois" />}
          <Button onClick={onClose}>Anotei, pode fechar</Button>
        </>
      }
    >
      {credentials && (
        <div className={styles.body}>
          <p className={styles.lead}>
            {context ? `${context}. ` : ''}Repasse estes dados para <strong>{credentials.name}</strong>. A senha é temporária e só aparece agora; no primeiro acesso a pessoa define a dela.
          </p>
          <dl className={styles.list}>
            <div className={styles.row}>
              <dt>E-mail</dt>
              <dd>
                <code>{credentials.email}</code>
                <CopyButton value={credentials.email} label="" />
              </dd>
            </div>
            <div className={styles.row}>
              <dt>Senha temporária</dt>
              <dd>
                <code className={styles.password}>{credentials.temporaryPassword}</code>
                <CopyButton value={credentials.temporaryPassword} label="" />
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Dialog>
  )
}

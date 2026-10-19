import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import { useAuth } from '../../auth/useAuth'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage, memberRoleLabel, roleLabel } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { TextField } from '../../ui/TextField/TextField'
import styles from './AccountPage.module.css'

export function AccountPage() {
  const { admin, setAdmin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!admin) return null
  const forced = admin.mustChangePassword

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (next.length < 8) return setError('A nova senha precisa de pelo menos 8 caracteres.')
    if (next !== confirm) return setError('A confirmação não bate com a nova senha.')
    if (next === current) return setError('Escolha uma senha diferente da atual.')
    setError(null)
    setSaving(true)
    try {
      await adminApi.changePassword(current, next)
      setAdmin((profile) => ({ ...profile, mustChangePassword: false }))
      setCurrent('')
      setNext('')
      setConfirm('')
      toast({ kind: 'ok', title: 'Senha atualizada' })
      if (forced) navigate('/barbearias', { replace: true })
    } catch (caught) {
      setError(errorMessage(caught, 'Não foi possível trocar a senha.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Minha conta" description={forced ? 'Sua senha é temporária. Defina uma nova para continuar.' : 'Seus dados de acesso ao painel.'} />
      <div className={styles.grid}>
        <Card title="Perfil">
          <dl className={styles.profile}>
            <div>
              <dt>Nome</dt>
              <dd>{admin.name}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{admin.email}</dd>
            </div>
            <div>
              <dt>Papel</dt>
              <dd>
                <Badge tone={admin.role === 'PLATAFORMA' ? 'accent' : 'neutral'}>{roleLabel[admin.role]}</Badge>
              </dd>
            </div>
            {admin.role === 'BARBEARIA' && (
              <div>
                <dt>Barbearias</dt>
                <dd>{admin.tenants.length ? admin.tenants.map((tenant) => `${tenant.name} (${memberRoleLabel[tenant.role].toLowerCase()})`).join(', ') : 'Nenhuma ainda'}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title={forced ? 'Defina sua senha' : 'Trocar senha'} description="Mínimo de 8 caracteres.">
          <form className={styles.form} onSubmit={submit} noValidate>
            <TextField label={forced ? 'Senha temporária' : 'Senha atual'} type="password" revealable autoComplete="current-password" value={current} onChange={setCurrent} />
            <TextField label="Nova senha" type="password" revealable autoComplete="new-password" value={next} onChange={setNext} />
            <TextField label="Confirmar nova senha" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} error={error ?? undefined} />
            <Button type="submit" loading={saving} disabled={!current || !next || !confirm}>
              {forced ? 'Salvar e continuar' : 'Trocar senha'}
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}

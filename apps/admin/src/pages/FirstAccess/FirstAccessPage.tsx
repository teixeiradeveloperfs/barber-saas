import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi, type AccessPeek } from '../../api/admin'
import { useAuth } from '../../auth/useAuth'
import { errorMessage } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { Logo } from '../../ui/Logo/Logo'
import { TextField } from '../../ui/TextField/TextField'
import { ThemeToggle } from '../../ui/ThemeToggle/ThemeToggle'
import styles from '../Login/LoginPage.module.css'

/**
 * Passo 1 de 6: criar a senha pelo link do e-mail (compra no site ou
 * "esqueci a senha"). Depois entra direto no passo a passo da barbearia.
 */
export function FirstAccessPage() {
  const navigate = useNavigate()
  const { startSession } = useAuth()
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  const [peek, setPeek] = useState<AccessPeek | null>(null)
  const [loadError, setLoadError] = useState<string | null>(token ? null : 'Link incompleto. Abra de novo o link do e-mail.')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    adminApi.peekAccess(token).then(setPeek, (caught: unknown) => setLoadError(errorMessage(caught)))
  }, [token])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) return setError('A senha precisa de pelo menos 8 caracteres.')
    if (password !== confirm) return setError('As duas senhas não são iguais.')
    setSaving(true)
    setError(null)
    try {
      const result = await adminApi.redeemAccess(token, password)
      startSession(result.token, result.admin)
      // Sem a URL com o token no histórico.
      window.history.replaceState(null, '', '/primeiro-acesso')
      navigate(result.installationId && peek?.firstAccess ? `/comecar/${result.installationId}/2` : '/', { replace: true })
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const first = peek?.name.trim().split(/\s+/)[0]

  return (
    <div className={styles.page}>
      <aside className={styles.panel} aria-hidden="true">
        <Logo accent="var(--champagne)" className={styles.mark} />
        <div className={styles.panelText}>
          <p className={styles.kicker}>Passo 1 de 6</p>
          <h1 className={styles.headline}>Sua senha, e o app da barbearia no ar em minutos.</h1>
          <p className={styles.sub}>Depois da senha: dados da barbearia, marca, serviços, equipe e horários.</p>
        </div>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.topbar}>
          <Logo className={styles.brand} />
          <ThemeToggle />
        </div>
        {loadError ? (
          <div className={styles.form}>
            <div className={styles.formHead}>
              <h2 className={styles.title}>Link inválido</h2>
              <p className={styles.hint}>{loadError}</p>
            </div>
            <Button block size="lg" to="/login">
              Ir para o login
            </Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit} noValidate>
            <div className={styles.formHead}>
              <h2 className={styles.title}>{peek ? (peek.firstAccess ? `Bem-vindo, ${first}!` : `Nova senha, ${first}`) : 'Carregando…'}</h2>
              <p className={styles.hint}>
                {peek?.tenant ? `Crie a senha para entrar no painel da ${peek.tenant.name}.` : 'Crie a senha do seu acesso ao painel.'} Você entra com o e-mail {peek?.email}.
              </p>
            </div>
            <TextField label="Senha" type="password" revealable autoComplete="new-password" value={password} onChange={setPassword} hint="Pelo menos 8 caracteres." />
            <TextField label="Repita a senha" type="password" revealable autoComplete="new-password" value={confirm} onChange={setConfirm} />
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <Button type="submit" block size="lg" loading={saving} disabled={!peek}>
              {peek?.firstAccess ? 'Criar senha e continuar' : 'Salvar senha e entrar'}
            </Button>
          </form>
        )}
      </main>
    </div>
  )
}

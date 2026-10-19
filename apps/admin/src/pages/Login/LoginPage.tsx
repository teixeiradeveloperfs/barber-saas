import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import { useAuth } from '../../auth/useAuth'
import { errorMessage } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { Logo } from '../../ui/Logo/Logo'
import { TextField } from '../../ui/TextField/TextField'
import { ThemeToggle } from '../../ui/ThemeToggle/ThemeToggle'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { token, checking, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'
  if (token && !checking) return <Navigate to={from} replace />

  async function sendLink(event: FormEvent) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Informe o e-mail do seu acesso.')
    setSubmitting(true)
    setError(null)
    try {
      await adminApi.forgotPassword(email.trim())
      setSent(true)
    } catch (caught) {
      setError(errorMessage(caught, 'Não foi possível enviar agora.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await login(email.trim(), password)
    } catch (caught) {
      setError(errorMessage(caught, 'Não foi possível entrar.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.panel} aria-hidden="true">
        <Logo accent="var(--champagne)" className={styles.mark} />
        <div className={styles.panelText}>
          <p className={styles.kicker}>Painel da plataforma</p>
          <h1 className={styles.headline}>Uma plataforma, cada barbearia com a sua cara.</h1>
          <p className={styles.sub}>Crie barbearias, ajuste marca, equipe e serviços, conecte o domínio e publique.</p>
        </div>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.topbar}>
          <Logo className={styles.brand} />
          <ThemeToggle />
        </div>
        {forgot ? (
          <form className={styles.form} onSubmit={sendLink} noValidate>
            <div className={styles.formHead}>
              <h2 className={styles.title}>Esqueci minha senha</h2>
              <p className={styles.hint}>{sent ? `Se ${email.trim()} tiver acesso, o link para criar uma nova senha chega em instantes. Confira também o spam.` : 'Mandamos um link por e-mail para você criar uma nova senha.'}</p>
            </div>
            {!sent && <TextField label="E-mail" type="email" autoComplete="username" value={email} onChange={setEmail} />}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            {!sent && (
              <Button type="submit" block size="lg" loading={submitting}>
                Enviar link
              </Button>
            )}
            <button type="button" className={styles.linkButton} onClick={() => { setForgot(false); setSent(false); setError(null) }}>
              Voltar para o login
            </button>
          </form>
        ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.formHead}>
            <h2 className={styles.title}>Entrar no painel</h2>
            <p className={styles.hint}>Para quem opera a plataforma e para donos e equipes das barbearias.</p>
          </div>
          <TextField label="E-mail" type="email" autoComplete="username" value={email} onChange={setEmail} placeholder="voce@plataforma.com" />
          <TextField label="Senha" type="password" revealable autoComplete="current-password" value={password} onChange={setPassword} />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <Button type="submit" block size="lg" loading={submitting}>
            Entrar
          </Button>
          <button type="button" className={styles.linkButton} onClick={() => { setForgot(true); setError(null) }}>
            Esqueci minha senha
          </button>
        </form>
        )}
      </main>
    </div>
  )
}

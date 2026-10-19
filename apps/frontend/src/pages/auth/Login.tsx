import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../../auth/useCustomerAuth'
import { Button } from '../../components/Button/Button'
import { TextField } from '../../components/TextField/TextField'
import { canAutoFocus } from '../../lib/device'
import { ApiError } from '../../lib/api'
import { isEmail, messages } from '../../lib/validation'
import { AuthLayout } from './AuthLayout'
import styles from './auth.module.css'

type Errors = Partial<Record<'email' | 'password', string>>

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginPassword } = useCustomerAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const next = (location.state as { from?: string } | null)?.from ?? '/home'

  function validate(): Errors {
    const nextErrors: Errors = {}
    if (!email.trim()) nextErrors.email = messages.emailRequired
    else if (!isEmail(email)) nextErrors.email = messages.emailInvalid
    if (!password) nextErrors.password = messages.passwordRequired
    return nextErrors
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setLoading(true)
    setFormError(null)
    try {
      await loginPassword(email, password)
      navigate(next, { replace: true })
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'Não deu para entrar agora. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Bem-vindo de volta."
      subtitle="Entre para ver seus agendamentos e marcar o próximo corte."
      footer={
        <>
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(value) => {
            setEmail(value)
            if (errors.email) setErrors((state) => ({ ...state, email: undefined }))
          }}
          error={errors.email}
          autoFocus={canAutoFocus()}
        />

        <TextField
          label="Senha"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          revealable
          value={password}
          onChange={(value) => {
            setPassword(value)
            if (errors.password) setErrors((state) => ({ ...state, password: undefined }))
          }}
          error={errors.password}
        />

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" block loading={loading} className={styles.submit}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}

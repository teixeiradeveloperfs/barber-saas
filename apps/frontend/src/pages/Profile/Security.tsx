import { useState, type FormEvent } from 'react'
import { useCustomerAuth } from '../../auth/useCustomerAuth'
import { Button } from '../../components/Button/Button'
import { PasswordStrength } from '../../components/PasswordStrength/PasswordStrength'
import { TextField } from '../../components/TextField/TextField'
import { ApiError } from '../../lib/api'
import { messages, MIN_PASSWORD } from '../../lib/validation'
import styles from './profile.module.css'
import { useFlash } from './useFlash'

type Field = 'current' | 'next' | 'confirm'
type Errors = Partial<Record<Field, string>>

export function Security() {
  const { customer, changePassword } = useCustomerAuth()
  // Conta que entrou só por código ainda não tem senha: não há o que conferir.
  const needsCurrent = customer?.hasPassword ?? true
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const { message, flash } = useFlash()

  function clear(field: Field) {
    if (errors[field]) setErrors((state) => ({ ...state, [field]: undefined }))
  }

  function validate(): Errors {
    const result: Errors = {}
    if (needsCurrent && !current) result.current = 'Informe sua senha atual.'
    if (!next) result.next = messages.passwordRequired
    else if (next.length < MIN_PASSWORD) result.next = messages.passwordShort
    else if (needsCurrent && next === current) result.next = 'A nova senha precisa ser diferente da atual.'
    if (confirm !== next) result.confirm = messages.passwordMismatch
    return result
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = validate()
    setErrors(result)
    if (Object.keys(result).length > 0) return

    setLoading(true)
    try {
      await changePassword(needsCurrent ? current : undefined, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      flash('Senha atualizada.')
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 422) setErrors({ current: caught.message })
      else flash(caught instanceof ApiError ? (caught.issues[0]?.message ?? caught.message) : 'Não deu para atualizar a senha agora. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.card} aria-labelledby="seguranca">
      <header className={styles.cardHead}>
        <h2 id="seguranca" className={styles.cardTitle}>
          Segurança
        </h2>
        <p className={styles.cardHint}>Troque a senha de vez em quando. Nunca pedimos por mensagem.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {needsCurrent && (
          <TextField
            label="Senha atual"
            type="password"
            name="current-password"
            autoComplete="current-password"
            revealable
            value={current}
            onChange={(value) => {
              setCurrent(value)
              clear('current')
            }}
            error={errors.current}
          />
        )}
        <div className={styles.twoUp}>
          <div>
            <TextField
              label="Nova senha"
              type="password"
              name="new-password"
              autoComplete="new-password"
              placeholder={`Mínimo de ${MIN_PASSWORD} caracteres`}
              revealable
              value={next}
              onChange={(value) => {
                setNext(value)
                clear('next')
              }}
              error={errors.next}
            />
            <div className={styles.strength}>
              <PasswordStrength password={next} />
            </div>
          </div>
          <TextField
            label="Confirmar nova senha"
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            revealable
            value={confirm}
            onChange={(value) => {
              setConfirm(value)
              clear('confirm')
            }}
            error={errors.confirm}
          />
        </div>

        <div className={styles.formFoot}>
          <span className={styles.flash} role="status">
            {message}
          </span>
          <Button type="submit" size="lg" variant="ghost" loading={loading}>
            Atualizar senha
          </Button>
        </div>
      </form>
    </section>
  )
}

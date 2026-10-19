import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button/Button'
import { TextField } from '../../components/TextField/TextField'
import { useCustomerAuth } from '../../auth/useCustomerAuth'
import { ApiError } from '../../lib/api'
import { formatPhone, isCompletePhone } from '../../lib/format'
import { isEmail, messages } from '../../lib/validation'
import { useUser } from '../../user/useUser'
import styles from './profile.module.css'
import { useFlash } from './useFlash'

type Field = 'name' | 'email' | 'phone'
type Errors = Partial<Record<Field, string>>

/**
 * O pai passa `key` com os dados do usuário: quando eles mudam por fora
 * (reset ao sair/excluir), o formulário remonta já com os valores novos.
 */
export function PersonalData() {
  const { user, updateUser } = useUser()
  const { status, updateProfile } = useCustomerAuth()
  const logged = status === 'logado'
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const { message, flash } = useFlash()

  const dirty = name !== user.name || email !== user.email || phone !== user.phone

  function clear(field: Field) {
    if (errors[field]) setErrors((state) => ({ ...state, [field]: undefined }))
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!name.trim()) next.name = messages.nameRequired
    if (!email.trim()) next.email = messages.emailRequired
    else if (!isEmail(email)) next.email = messages.emailInvalid
    if (phone && !isCompletePhone(phone)) next.phone = 'Telefone incompleto.'
    return next
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    if (logged) {
      try {
        await updateProfile({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null })
      } catch (caught) {
        setLoading(false)
        flash(caught instanceof ApiError ? caught.message : 'Não deu para salvar agora. Tente de novo.')
        return
      }
    }
    updateUser({ name: name.trim(), email: email.trim(), phone })
    setLoading(false)
    flash('Alterações salvas.')
  }

  return (
    <section className={styles.card} aria-labelledby="dados">
      <header className={styles.cardHead}>
        <h2 id="dados" className={styles.cardTitle}>
          Dados pessoais
        </h2>
        <p className={styles.cardHint}>Como você aparece para a barbearia e onde te avisamos.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Nome completo"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(value) => {
            setName(value)
            clear('name')
          }}
          error={errors.name}
        />
        <div className={styles.twoUp}>
          <TextField
            label="E-mail"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(value) => {
              setEmail(value)
              clear('email')
            }}
            error={errors.email}
          />
          <TextField
            label="Telefone (WhatsApp)"
            type="tel"
            name="phone"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="(11) 91234-5678"
            value={phone}
            onChange={(value) => {
              setPhone(formatPhone(value))
              clear('phone')
            }}
            error={errors.phone}
            hint="Opcional. A barbearia confirma seus horários por aqui."
          />
        </div>

        <div className={styles.formFoot}>
          <span className={styles.flash} role="status">
            {message}
          </span>
          <Button type="submit" size="lg" loading={loading} disabled={!dirty}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </section>
  )
}

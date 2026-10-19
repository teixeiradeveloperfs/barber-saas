import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppointments } from '../../appointments/useAppointments'
import { useCustomerAuth } from '../../auth/useCustomerAuth'
import { Button } from '../../components/Button/Button'
import { Checkbox } from '../../components/Checkbox/Checkbox'
import { PasswordStrength } from '../../components/PasswordStrength/PasswordStrength'
import { TextField } from '../../components/TextField/TextField'
import { useGamification } from '../../gamification/useGamification'
import { canAutoFocus } from '../../lib/device'
import { ApiError, clearReferralCode, pendingReferralCode, referralsApi } from '../../lib/api'
import { formatPhoneInput, isEmail, isPhone, messages, MIN_PASSWORD } from '../../lib/validation'
import { useUser } from '../../user/useUser'
import { AuthLayout } from './AuthLayout'
import styles from './auth.module.css'

type Field = 'name' | 'email' | 'password' | 'phone' | 'terms'
type Errors = Partial<Record<Field, string>>

export function Register() {
  const navigate = useNavigate()
  const { register } = useCustomerAuth()
  const { startFresh, updateUser } = useUser()
  const { startFresh: startLoyaltyFresh } = useGamification()
  const { clearAll } = useAppointments()
  const [name, setName] = useState('')
  const [referral] = useState(() => pendingReferralCode())
  const [invite, setInvite] = useState<{ referrerName: string; reward: string | null } | null>(null)

  // Veio por indicação: mostra de quem é e o que ganha (some se o código não vale).
  useEffect(() => {
    if (!referral) return
    referralsApi.preview(referral).then(setInvite, () => undefined)
  }, [referral])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function clear(field: Field) {
    if (errors[field]) setErrors((state) => ({ ...state, [field]: undefined }))
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!name.trim()) next.name = messages.nameRequired
    if (!email.trim()) next.email = messages.emailRequired
    else if (!isEmail(email)) next.email = messages.emailInvalid
    if (!password) next.password = messages.passwordRequired
    else if (password.length < MIN_PASSWORD) next.password = messages.passwordShort
    if (phone.trim() && !isPhone(phone)) next.phone = messages.phoneInvalid
    if (!terms) next.terms = messages.termsRequired
    return next
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setLoading(true)
    setFormError(null)
    try {
      const profile = await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined, referralCode: invite && referral ? referral : undefined })
      clearReferralCode()
      // Só depois de a conta existir: perfil local zerado, tour pendente, sem histórico.
      startFresh({ name: profile.name, email: profile.email ?? '' })
      updateUser({ phone: profile.phoneMasked, memberSince: profile.createdAt })
      startLoyaltyFresh()
      clearAll()
      navigate('/bem-vindo', { replace: true })
    } catch (caught) {
      setFormError(caught instanceof ApiError ? (caught.issues[0]?.message ?? caught.message) : 'Não deu para criar a conta agora. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crie sua conta."
      subtitle="Leva menos de um minuto. Depois é só escolher o barbeiro."
      footer={
        <>
          Já tem conta? <Link to="/login">Entrar</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {invite && (
          <p className={styles.invite}>
            <strong>{invite.referrerName} te indicou.</strong> {invite.reward ? `Crie a conta e ganhe ${invite.reward} no primeiro agendamento.` : 'Crie a conta para começar.'}
          </p>
        )}
        <TextField
          label="Nome completo"
          name="name"
          autoComplete="name"
          placeholder="Como quer ser chamado"
          value={name}
          onChange={(value) => {
            setName(value)
            clear('name')
          }}
          error={errors.name}
          autoFocus={canAutoFocus()}
        />

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
            clear('email')
          }}
          error={errors.email}
        />

        <div>
          <TextField
            label="Senha"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder={`Mínimo de ${MIN_PASSWORD} caracteres`}
            revealable
            value={password}
            onChange={(value) => {
              setPassword(value)
              clear('password')
            }}
            error={errors.password}
            hint={password ? undefined : 'Misture letras, números e símbolos.'}
          />
          {password && (
            <div style={{ marginTop: 10 }}>
              <PasswordStrength password={password} />
            </div>
          )}
        </div>

        <TextField
          label="WhatsApp (opcional)"
          type="tel"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(11) 98765-4321"
          value={phone}
          onChange={(value) => {
            setPhone(formatPhoneInput(value))
            clear('phone')
          }}
          error={errors.phone}
          hint="A barbearia confirma seus horários por aqui."
        />

        <Checkbox
          checked={terms}
          onChange={(checked) => {
            setTerms(checked)
            clear('terms')
          }}
          error={errors.terms}
        >
          Li e aceito os{' '}
          <Link to="/termos" target="_blank" rel="noopener">
            Termos de uso
          </Link>{' '}
          e a{' '}
          <Link to="/privacidade" target="_blank" rel="noopener">
            Política de privacidade
          </Link>
          .
        </Checkbox>

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" block loading={loading} className={styles.submit}>
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  )
}

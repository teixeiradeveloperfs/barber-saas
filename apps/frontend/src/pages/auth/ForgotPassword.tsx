import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../../auth/useCustomerAuth'
import { Button } from '../../components/Button/Button'
import { PasswordStrength } from '../../components/PasswordStrength/PasswordStrength'
import { TextField } from '../../components/TextField/TextField'
import { canAutoFocus } from '../../lib/device'
import { ApiError, type OtpChannel, type OtpSent } from '../../lib/api'
import { formatPhoneInput, isPhone, messages, MIN_PASSWORD } from '../../lib/validation'
import { AuthLayout } from './AuthLayout'
import { ChannelPicker } from './ChannelPicker'
import { OtpStep } from './OtpStep'
import styles from './auth.module.css'

/** Recuperação: código por WhatsApp ou SMS, nova senha, e já entra. */
export function ForgotPassword() {
  const navigate = useNavigate()
  const { requestCode, recover } = useCustomerAuth()
  const [phone, setPhone] = useState('')
  const [channel, setChannel] = useState<OtpChannel>('WHATSAPP')
  const [error, setError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState<OtpSent | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordError, setPasswordError] = useState<string>()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!phone.trim()) return setError(messages.phoneRequired)
    if (!isPhone(phone)) return setError(messages.phoneInvalid)
    setError(undefined)
    setFormError(null)
    setLoading(true)
    try {
      setSent(await requestCode(phone, channel, 'RECUPERACAO'))
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'Não deu para enviar o código agora.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Crie uma nova senha." subtitle="Digite o código que enviamos e escolha a senha nova." back={{ to: '/recuperar-senha', label: 'Trocar número' }}>
        <OtpStep
          sent={sent}
          purpose="RECUPERACAO"
          phone={phone}
          onResent={setSent}
          submitLabel="Salvar nova senha e entrar"
          onSubmit={async (code) => {
            if (password.length < MIN_PASSWORD) {
              setPasswordError(messages.passwordShort)
              throw new ApiError(0, messages.passwordShort)
            }
            if (confirm !== password) {
              setPasswordError(messages.passwordMismatch)
              throw new ApiError(0, messages.passwordMismatch)
            }
            setPasswordError(undefined)
            await recover(phone, code, password)
            navigate('/home', { replace: true })
          }}
        >
          <div>
            <TextField
              label="Nova senha"
              type="password"
              name="new-password"
              autoComplete="new-password"
              placeholder={`Mínimo de ${MIN_PASSWORD} caracteres`}
              revealable
              value={password}
              onChange={(value) => {
                setPassword(value)
                setPasswordError(undefined)
              }}
              error={passwordError}
            />
            {password && (
              <div style={{ marginTop: 10 }}>
                <PasswordStrength password={password} />
              </div>
            )}
          </div>
          <TextField
            label="Confirmar nova senha"
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            revealable
            value={confirm}
            onChange={(value) => {
              setConfirm(value)
              setPasswordError(undefined)
            }}
          />
        </OtpStep>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Esqueceu a senha?"
      subtitle="Informe o WhatsApp da sua conta. Enviamos um código para você criar uma senha nova."
      back={{ to: '/login', label: 'Voltar para entrar' }}
      footer={
        <>
          Prefere não usar senha? <Link to="/login">Entre com código</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="WhatsApp"
          type="tel"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(11) 98765-4321"
          value={phone}
          onChange={(value) => {
            setPhone(formatPhoneInput(value))
            if (error) setError(undefined)
          }}
          error={error}
          autoFocus={canAutoFocus()}
        />
        <ChannelPicker value={channel} onChange={setChannel} />
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" block loading={loading} className={styles.submit}>
          Receber código por {channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}
        </Button>
      </form>
    </AuthLayout>
  )
}

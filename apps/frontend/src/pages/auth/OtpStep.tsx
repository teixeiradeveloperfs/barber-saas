import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/Button/Button'
import type { OtpChannel, OtpPurpose, OtpSent } from '../../lib/api'
import { ApiError } from '../../lib/api'
import { messages } from '../../lib/validation'
import { useCustomerAuth } from '../../auth/useCustomerAuth'
import styles from './auth.module.css'

type Props = {
  sent: OtpSent
  purpose: OtpPurpose
  /** Telefone como o cliente digitou, para reenviar. */
  phone: string
  onResent: (sent: OtpSent) => void
  /** Recebe o código de 6 dígitos; lança ApiError para mostrar o erro aqui. */
  onSubmit: (code: string) => Promise<void>
  submitLabel: string
  children?: React.ReactNode
}

const CHANNEL_LABEL: Record<OtpChannel, string> = { WHATSAPP: 'WhatsApp', SMS: 'SMS' }

/** Segundo passo dos fluxos por código: digitar, reenviar, trocar de canal. */
export function OtpStep({ sent, purpose, phone, onResent, onSubmit, submitLabel, children }: Props) {
  const { requestCode } = useCustomerAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  // Contagem derivada do relógio: o efeito só acompanha o tempo, sem setState síncrono.
  const [now, setNow] = useState(() => Date.now())
  const [sentAt, setSentAt] = useState(now)
  const [lastSent, setLastSent] = useState(sent)
  if (sent !== lastSent) {
    // Reenvio: reinicia a contagem a partir do último tique do relógio.
    setLastSent(sent)
    setSentAt(now)
  }
  const secondsLeft = Math.max(0, sent.retryInSeconds - Math.floor((now - sentAt) / 1000))

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) return setError(messages.codeInvalid)
    setError(null)
    setLoading(true)
    try {
      await onSubmit(code)
    } catch (caught) {
      setError(caught instanceof ApiError ? (caught.issues[0]?.message ?? caught.message) : 'Não deu para validar agora. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  async function resend(channel: OtpChannel) {
    setResending(true)
    setError(null)
    try {
      onResent(await requestCode(phone, channel, purpose))
      setCode('')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não deu para reenviar agora.')
    } finally {
      setResending(false)
    }
  }

  const other: OtpChannel = sent.channel === 'WHATSAPP' ? 'SMS' : 'WHATSAPP'

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <p className={styles.otpIntro}>
        Enviamos um código de 6 números por <strong>{CHANNEL_LABEL[sent.channel]}</strong> para <strong>{sent.phoneMasked}</strong>. Vale por {Math.round(sent.expiresInSeconds / 60)} minutos.
      </p>
      {sent.devCode && import.meta.env.DEV && (
        <p className={styles.devHint}>
          Ambiente de desenvolvimento, sem envio real. Código: <code>{sent.devCode}</code>
        </p>
      )}
      <input
        className={styles.codeInput}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="••••••"
        value={code}
        onChange={(event) => {
          setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
          if (error) setError(null)
        }}
        aria-label="Código de 6 números"
        aria-invalid={error ? true : undefined}
        autoFocus
      />
      {error && (
        <p className={styles.codeError} role="alert">
          {error}
        </p>
      )}
      {children}
      <Button type="submit" size="lg" block loading={loading} className={styles.submit}>
        {submitLabel}
      </Button>
      <div className={styles.otpActions}>
        <span>{secondsLeft > 0 ? `Reenviar em ${secondsLeft}s` : 'Não chegou?'}</span>
        <span>
          <button type="button" className={styles.linkButton} disabled={secondsLeft > 0 || resending} onClick={() => resend(sent.channel)}>
            Reenviar por {CHANNEL_LABEL[sent.channel]}
          </button>
          {' · '}
          <button type="button" className={styles.linkButton} disabled={secondsLeft > 0 || resending} onClick={() => resend(other)}>
            Tentar por {CHANNEL_LABEL[other]}
          </button>
        </span>
      </div>
    </form>
  )
}

import type { OtpChannel } from '../../lib/api'
import styles from './auth.module.css'

/** WhatsApp ou SMS para receber o código. */
export function ChannelPicker({ value, onChange }: { value: OtpChannel; onChange: (channel: OtpChannel) => void }) {
  return (
    <div className={styles.channels} role="radiogroup" aria-label="Receber o código por">
      <button type="button" role="radio" aria-checked={value === 'WHATSAPP'} className={[styles.channel, value === 'WHATSAPP' && styles.channelOn].filter(Boolean).join(' ')} onClick={() => onChange('WHATSAPP')}>
        <strong>WhatsApp</strong>
        <span>Mensagem no seu WhatsApp</span>
      </button>
      <button type="button" role="radio" aria-checked={value === 'SMS'} className={[styles.channel, value === 'SMS' && styles.channelOn].filter(Boolean).join(' ')} onClick={() => onChange('SMS')}>
        <strong>SMS</strong>
        <span>Torpedo no celular</span>
      </button>
    </div>
  )
}

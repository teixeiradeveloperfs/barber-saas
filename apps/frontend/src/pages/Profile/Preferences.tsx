import { Segmented } from '../../components/Segmented/Segmented'
import { Switch } from '../../components/Switch/Switch'
import { useTheme } from '../../theme/useTheme'
import type { Theme } from '../../theme/theme-context'
import { useUser } from '../../user/useUser'
import type { NotificationPrefs } from '../../user/user-context'
import styles from './profile.module.css'
import { useFlash } from './useFlash'

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
]

export function Preferences() {
  const { theme, setTheme } = useTheme()
  const { user, updateNotifications } = useUser()
  const { message, flash } = useFlash()

  function toggle(key: keyof NotificationPrefs) {
    return (checked: boolean) => {
      updateNotifications({ [key]: checked })
      flash('Preferências salvas.')
    }
  }

  return (
    <section className={styles.card} aria-labelledby="preferencias">
      <header className={styles.cardHead}>
        <h2 id="preferencias" className={styles.cardTitle}>
          Preferências
        </h2>
        <p className={styles.cardHint}>Salvas na hora, sem botão.</p>
      </header>

      <div className={styles.block}>
        <div className={styles.blockHead}>
          <span className={styles.blockTitle}>Aparência</span>
          <span className={styles.blockHint}>
            Sistema segue o modo do seu aparelho.
          </span>
        </div>
        <Segmented
          aria-label="Aparência"
          options={THEME_OPTIONS}
          value={theme}
          onChange={(value) => {
            setTheme(value)
            flash('Preferências salvas.')
          }}
        />
      </div>

      <div className={styles.block}>
        <div className={styles.blockHead}>
          <span className={styles.blockTitle}>Notificações</span>
        </div>
        <div className={styles.switches}>
          <Switch
            label="Lembretes de agendamento"
            description="Aviso 2 horas antes do horário marcado."
            checked={user.notifications.reminders}
            onChange={toggle('reminders')}
          />
          <Switch
            label="Confirmações pelo WhatsApp"
            description={
              user.phone ? `Enviadas para ${user.phone}.` : 'Cadastre um telefone para ativar.'
            }
            checked={user.notifications.whatsapp && Boolean(user.phone)}
            onChange={toggle('whatsapp')}
            disabled={!user.phone}
          />
          <Switch
            label="Novidades e promoções"
            description="No máximo uma mensagem por semana."
            checked={user.notifications.news}
            onChange={toggle('news')}
          />
        </div>
      </div>

      <span className={styles.flash} role="status">
        {message}
      </span>
    </section>
  )
}

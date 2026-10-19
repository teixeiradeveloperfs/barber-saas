import { formatPoints } from '../../data/gamification'
import { useGamification } from '../../gamification/useGamification'
import styles from './rewards.module.css'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

/** "17 de set" -> "17 set" */
function shortDate(iso: string) {
  return dateFormat.format(new Date(iso)).replace('.', '').replace(' de ', ' ')
}

export function History() {
  const { state } = useGamification()

  return (
    <section className={styles.card} aria-labelledby="historico">
      <header className={styles.cardHead}>
        <h2 id="historico" className={styles.cardTitle}>
          Histórico
        </h2>
      </header>
      <ul className={styles.history}>
        {state.events.slice(0, 8).map((event) => (
          <li key={event.id} className={styles.event}>
            <span className={styles.eventDate}>{shortDate(event.date)}</span>
            <span className={styles.eventLabel}>{event.label}</span>
            <span className={[styles.eventPoints, event.points < 0 && styles.eventNegative].filter(Boolean).join(' ')}>
              {event.points > 0 ? '+' : ''}
              {formatPoints(event.points)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

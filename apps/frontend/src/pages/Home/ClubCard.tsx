import { Link } from 'react-router-dom'
import { ArrowRightIcon, CrownIcon } from '../../components/icons/Icons'
import { formatPrice } from '../../data/barbers'
import { getClubName, getPlans, isClubEnabled } from '../../data/gamification'
import { creditsLeft, formatCredits, getPlan, isSubscriptionActive } from '../../gamification/plan'
import { useGamification } from '../../gamification/useGamification'
import styles from './ClubCard.module.css'

const shortDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

/** Sócio vê os créditos do ciclo; avulso vê o convite para o Clube. */
export function ClubCard() {
  const { state } = useGamification()
  const { subscription } = state
  const plan = getPlan(subscription?.planId)

  if (!isClubEnabled()) return null

  if (!subscription || !plan || !isSubscriptionActive(subscription)) {
    const cheapest = Math.min(...getPlans().map((item) => item.price))
    return (
      <Link to="/clube" className={styles.card}>
        <span className={styles.icon} aria-hidden="true">
          <CrownIcon />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>Entre no {getClubName()}</span>
          <span className={styles.hint}>
            Cortes do mês inclusos a partir de {formatPrice(cheapest)}/mês. Sem fidelidade.
          </span>
        </span>
        <ArrowRightIcon className={styles.arrow} />
      </Link>
    )
  }

  const left = creditsLeft(subscription, plan)
  const parts = [
    `${formatCredits(left.cabelo)} ${left.cabelo === 1 ? 'corte' : 'cortes'}`,
    plan.covers.barba !== 0 ? `${formatCredits(left.barba)} ${left.barba === 1 ? 'barba' : 'barbas'}` : null,
  ].filter(Boolean)
  const ends = shortDate.format(new Date(subscription.renewsAt)).replace('.', '')

  return (
    <Link to="/clube" className={`${styles.card} ${styles.member}`}>
      <span className={styles.icon} aria-hidden="true">
        <CrownIcon />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>
          Plano {plan.name}
          {subscription.status === 'cancelada' && <span className={styles.badge}>Termina {ends}</span>}
        </span>
        <span className={styles.hint}>
          {parts.join(' e ')} disponíveis até {ends}.
        </span>
      </span>
      <ArrowRightIcon className={styles.arrow} />
    </Link>
  )
}

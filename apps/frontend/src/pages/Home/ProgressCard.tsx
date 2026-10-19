import { Link } from 'react-router-dom'
import { ScissorsIcon } from '../../components/ScissorsIcon/ScissorsIcon'
import { ArrowRightIcon, CrownIcon, FlameIcon } from '../../components/icons/Icons'
import { formatPoints, loyaltyRules } from '../../data/gamification'
import { levelProgress, stampsMissing } from '../../gamification/derived'
import { useGamification } from '../../gamification/useGamification'
import styles from './ProgressCard.module.css'

/** Resumo do programa de fidelidade na Home. Leva para /recompensas. */
export function ProgressCard() {
  const { state } = useGamification()
  const { current, next, ratio } = levelProgress(state)
  const missing = stampsMissing(state)
  const STAMPS_PER_CARD = loyaltyRules().stampsPerCard

  return (
    <Link to="/recompensas" className={styles.card} aria-label="Ver recompensas">
      <div className={styles.left}>
        <span className={styles.level}>
          <CrownIcon />
          {current.name}
        </span>
        <span className={styles.points}>
          {formatPoints(state.points)} <small>pontos</small>
        </span>
        <span className={styles.bar} aria-hidden="true">
          <span style={{ width: `${ratio * 100}%` }} />
        </span>
        <span className={styles.hint}>
          {next ? `Rumo a ${next.name}` : 'Nível máximo'} ·{' '}
          <FlameIcon className={styles.flame} /> {state.streakMonths} meses em dia
        </span>
      </div>

      <div className={styles.right}>
        <span className={styles.stamps} aria-hidden="true">
          {Array.from({ length: STAMPS_PER_CARD }, (_, index) => (
            <span key={index} className={index < state.stamps ? styles.stampOn : styles.stamp}>
              <ScissorsIcon />
            </span>
          ))}
        </span>
        <span className={styles.stampText}>
          {missing === 1 ? 'Falta 1 corte' : `Faltam ${missing} cortes`} para o grátis
        </span>
      </div>

      <ArrowRightIcon className={styles.arrow} />
    </Link>
  )
}

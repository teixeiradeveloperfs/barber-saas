import { Link } from 'react-router-dom'
import { CrownIcon, FlameIcon } from '../../components/icons/Icons'
import { formatPoints, isClubEnabled } from '../../data/gamification'
import { levelProgress } from '../../gamification/derived'
import { useGamification } from '../../gamification/useGamification'
import styles from './rewards.module.css'

export function LevelCard() {
  const { state } = useGamification()
  const { current, next, ratio, missing } = levelProgress(state)

  return (
    <section className={`${styles.card} ${styles.levelCard}`} data-level={current.id}>
      <div className={styles.levelTop}>
        <div className={styles.levelBadge}>
          <CrownIcon />
          <span>Nível {current.name}</span>
        </div>
        <span className={styles.streak}>
          <FlameIcon />
          {state.streakMonths} {state.streakMonths === 1 ? 'mês' : 'meses'} em dia
        </span>
      </div>

      <div className={styles.balance}>
        <span className={styles.balanceValue}>{formatPoints(state.points)}</span>
        <span className={styles.balanceLabel}>pontos para trocar</span>
      </div>

      <div className={styles.levelProgress}>
        <div className={styles.bar} role="progressbar" aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${ratio * 100}%` }} />
        </div>
        <p className={styles.levelHint}>
          {next
            ? `Faltam ${formatPoints(missing)} pontos para ${next.name}.`
            : 'Você está no nível mais alto.'}
          <span className={styles.lifetime}> {formatPoints(state.lifetimePoints)} acumulados no total.</span>
        </p>
      </div>

      <ul className={styles.perks}>
        {current.perks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>

      {isClubEnabled() && (
        <Link to="/clube" className={styles.inlineLink}>
          {state.subscription ? 'Renove o plano e ganhe bônus' : 'Entre no Clube e ganhe bônus'}
        </Link>
      )}
    </section>
  )
}

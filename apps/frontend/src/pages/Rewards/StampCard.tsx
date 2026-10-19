import { ScissorsIcon } from '../../components/ScissorsIcon/ScissorsIcon'
import { loyaltyRules } from '../../data/gamification'
import { stampsMissing } from '../../gamification/derived'
import { useGamification } from '../../gamification/useGamification'
import styles from './rewards.module.css'

export function StampCard() {
  const { state } = useGamification()
  const missing = stampsMissing(state)
  const STAMPS_PER_CARD = loyaltyRules().stampsPerCard

  return (
    <section className={styles.card} aria-labelledby="selos">
      <header className={styles.cardHead}>
        <h2 id="selos" className={styles.cardTitle}>
          Cartão fidelidade
        </h2>
        <p className={styles.cardHint}>A cada {STAMPS_PER_CARD} cortes, o próximo é por nossa conta.</p>
      </header>

      <div className={styles.stamps} role="img" aria-label={`${state.stamps} de ${STAMPS_PER_CARD} selos`}>
        {Array.from({ length: STAMPS_PER_CARD }, (_, index) => {
          const filled = index < state.stamps
          const last = index === STAMPS_PER_CARD - 1
          return (
            <span
              key={index}
              className={[styles.stamp, filled && styles.stampOn, last && styles.stampPrize]
                .filter(Boolean)
                .join(' ')}
            >
              {last ? <span className={styles.prizeText}>Grátis</span> : <ScissorsIcon />}
            </span>
          )
        })}
      </div>

      <p className={styles.stampHint}>
        {missing === 1 ? (
          <>
            <strong>Falta 1 corte</strong> para o seu corte grátis.
          </>
        ) : (
          <>
            <strong>Faltam {missing} cortes</strong> para o seu corte grátis.
          </>
        )}
        {state.freeCuts > 0 && (
          <>
            {' '}
            Você tem <strong>{state.freeCuts}</strong> corte grátis para usar.
          </>
        )}
      </p>
    </section>
  )
}

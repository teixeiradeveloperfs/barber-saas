import { SparklesIcon } from '../../components/icons/Icons'
import { getEarnRules } from '../../data/gamification'
import styles from './rewards.module.css'

export function EarnRules() {
  return (
    <section className={styles.card} aria-labelledby="ganhar">
      <header className={styles.cardHead}>
        <h2 id="ganhar" className={styles.cardTitle}>
          Como ganhar
        </h2>
      </header>
      <ul className={styles.rules}>
        {getEarnRules().map((rule) => (
          <li key={rule.id} className={styles.rule}>
            <SparklesIcon className={styles.ruleIcon} />
            <span className={styles.ruleLabel}>{rule.label}</span>
            <span className={styles.rulePoints}>{rule.points}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

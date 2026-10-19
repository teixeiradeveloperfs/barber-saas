import { passwordScore } from '../../lib/validation'
import styles from './PasswordStrength.module.css'

const LABELS = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'] as const

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const score = passwordScore(password)

  return (
    <div className={styles.strength} data-score={score} aria-live="polite">
      <span className={styles.bars} aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <span key={level} className={styles.bar} data-on={level <= score || undefined} />
        ))}
      </span>
      <span className={styles.label}>Senha {LABELS[score].toLowerCase()}</span>
    </div>
  )
}

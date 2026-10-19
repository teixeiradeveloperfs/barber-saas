import { CheckIcon, TrophyIcon } from '../../components/icons/Icons'
import { achievementsFrom } from '../../gamification/derived'
import { useGamification } from '../../gamification/useGamification'
import styles from './rewards.module.css'

export function Achievements() {
  const { state } = useGamification()
  const achievements = achievementsFrom(state)
  const unlocked = achievements.filter((item) => item.unlocked).length

  return (
    <section className={styles.card} aria-labelledby="conquistas">
      <header className={styles.cardHead}>
        <h2 id="conquistas" className={styles.cardTitle}>
          Conquistas
        </h2>
        <p className={styles.cardHint}>
          {unlocked} de {achievements.length} desbloqueadas.
        </p>
      </header>

      <ul className={styles.badges}>
        {achievements.map((item) => (
          <li
            key={item.id}
            className={[styles.badge, item.unlocked && styles.badgeOn].filter(Boolean).join(' ')}
          >
            <span className={styles.badgeIcon} aria-hidden="true">
              {item.unlocked ? <CheckIcon /> : <TrophyIcon />}
            </span>
            <span className={styles.badgeName}>{item.name}</span>
            <span className={styles.badgeDesc}>{item.description}</span>
            {!item.unlocked && (
              <span className={styles.badgeProgress}>
                <span className={styles.miniBar}>
                  <span style={{ width: `${(item.progress / item.target) * 100}%` }} />
                </span>
                {item.progress}/{item.target}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

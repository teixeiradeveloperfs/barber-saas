import { Achievements } from './Achievements'
import { EarnRules } from './EarnRules'
import { History } from './History'
import { LevelCard } from './LevelCard'
import { RewardsCatalog } from './RewardsCatalog'
import { StampCard } from './StampCard'
import styles from './rewards.module.css'

export function Rewards() {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Recompensas</h1>
        <p className={styles.subtitle}>Cada corte conta. Selos, pontos e vantagens por ser de casa.</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.aside}>
          <LevelCard />
          <EarnRules />
        </div>
        <div className={styles.main}>
          <StampCard />
          <RewardsCatalog />
          <Achievements />
          <History />
        </div>
      </div>
    </div>
  )
}

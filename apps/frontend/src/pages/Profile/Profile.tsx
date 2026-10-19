import { AccountActions } from './AccountActions'
import { PersonalData } from './PersonalData'
import { Preferences } from './Preferences'
import { ProfileCard } from './ProfileCard'
import { Security } from './Security'
import { useUser } from '../../user/useUser'
import styles from './profile.module.css'

export function Profile() {
  const { user } = useUser()
  const identity = `${user.name}|${user.email}|${user.phone}`

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Seu perfil</h1>
        <p className={styles.subtitle}>Seus dados, preferências e a segurança da conta.</p>
      </header>

      <div className={styles.layout}>
        <ProfileCard />
        <div className={styles.stack}>
          <PersonalData key={identity} />
          <Preferences />
          <Security />
          <AccountActions />
        </div>
      </div>
    </div>
  )
}

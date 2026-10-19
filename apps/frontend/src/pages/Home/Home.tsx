import { Link } from 'react-router-dom'
import { Avatar } from '../../components/Avatar/Avatar'
import { ArrowRightIcon } from '../../components/icons/Icons'
import { getBarbers, type Barber } from '../../data/home'
import { useTenant } from '../../tenant/useTenant'
import { useAppointments } from '../../appointments/useAppointments'
import { useUser } from '../../user/useUser'
import { BarberCard } from './BarberCard'
import { ClubCard } from './ClubCard'
import { InstallBanner } from './InstallBanner'
import { LocationCard } from './LocationCard'
import { ReferCard } from './ReferCard'
import { getTenant } from '../../tenant/active'
import { NotificationsMenu } from './NotificationsMenu'
import { SettingsMenu } from './SettingsMenu'
import { isLoyaltyEnabled } from '../../data/gamification'
import { ProgressCard } from './ProgressCard'
import styles from './Home.module.css'
import { SearchBar } from './SearchBar'
import { TeamCard } from './TeamCard'

function firstName(name: string) {
  return name.split(' ')[0] ?? name
}

export function Home() {
  const { user } = useUser()
  const { copy } = useTenant()
  const barbers = getBarbers()
  const { past } = useAppointments()
  // Barbeiros dos últimos atendimentos concluídos, do mais recente ao mais antigo.
  const lastBarbers = past
    .filter((item) => item.status === 'concluido')
    .map((item) => barbers.find((barber) => barber.id === item.barberId))
    .filter((barber, index, list): barber is Barber => Boolean(barber) && list.indexOf(barber) === index)
    .slice(0, 3)

  return (
    <div className={styles.home}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link to="/perfil" className={styles.user}>
            <Avatar name={user.name} src={user.avatar} />
            <div className={styles.greeting}>
              <span className={styles.hello}>
                Olá <span aria-hidden="true">👋</span>
              </span>
              <span className={styles.userName}>{user.name}</span>
            </div>
          </Link>

          <nav className={styles.actions} aria-label="Conta">
            <NotificationsMenu />
            <SettingsMenu />
          </nav>
        </header>

        <section className={styles.intro}>
          <h1 className={styles.title}>{copy.homeTitle.replace('{nome}', firstName(user.name))}</h1>
          <p className={styles.subtitle}>{copy.homeSubtitle}</p>
          <SearchBar />
        </section>

        {/* Largura cheia, alinhado com as seções abaixo. */}
        <div className={styles.highlights}>
          {isLoyaltyEnabled() && <ProgressCard />}
          <ClubCard />
          <InstallBanner />
        </div>

        {lastBarbers.length > 0 && (
          <section className={styles.section} aria-labelledby="last-appointment">
            <div className={styles.sectionHead}>
              <h2 id="last-appointment" className={styles.sectionTitle}>
                {lastBarbers.length === 1 ? 'Agende de novo' : 'Seus últimos barbeiros'}
              </h2>
              <Link to="/agendamentos" className={styles.more}>
                Ver histórico <ArrowRightIcon />
              </Link>
            </div>
            <div className={`${styles.scroller} ${styles.barbers}`}>
              {lastBarbers.map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </div>
          </section>
        )}

        <section className={styles.section} aria-labelledby="team">
          <div className={styles.sectionHead}>
            <h2 id="team" className={styles.sectionTitle}>
              Nossos barbeiros
            </h2>
            <Link to="/barbeiros" className={styles.more}>
              Ver todos <ArrowRightIcon />
            </Link>
          </div>
          <div className={`${styles.scroller} ${styles.team}`}>
            {barbers.slice(0, 4).map((barber) => (
              <TeamCard key={barber.id} barber={barber} />
            ))}
          </div>
        </section>

        {getTenant().referral.enabled && (
          <section className={styles.section} aria-label="Indique e ganhe">
            <ReferCard />
          </section>
        )}

        <section className={styles.section} aria-label="Localização">
          <LocationCard />
        </section>
      </div>
    </div>
  )
}

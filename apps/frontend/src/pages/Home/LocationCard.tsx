import { Link } from 'react-router-dom'
import { ArrowRightIcon, PinIcon } from '../../components/icons/Icons'
import { getShop, todayStatus } from '../../data/shop'
import { RouteButtons } from '../Location/RouteButtons'
import styles from './LocationCard.module.css'

/** Resumo de endereço e rota na Home. Leva para /como-chegar. */
export function LocationCard() {
  const status = todayStatus()
  const shop = getShop()

  return (
    <section className={styles.card} aria-labelledby="como-chegar">
      <div className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          <PinIcon />
        </span>
        <div className={styles.text}>
          <h2 id="como-chegar" className={styles.title}>
            Como chegar
          </h2>
          <p className={styles.address}>
            {shop.address.street} · {shop.address.district}
          </p>
        </div>
        <span className={[styles.status, status.open ? styles.open : styles.closed].join(' ')}>
          {status.label}
        </span>
      </div>

      <RouteButtons compact />

      <Link to="/como-chegar" className={styles.more}>
        Horários, estacionamento e contato <ArrowRightIcon />
      </Link>
    </section>
  )
}

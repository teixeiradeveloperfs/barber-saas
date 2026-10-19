import { ChatIcon, ClockIcon, InstagramIcon, PinIcon } from '../../components/icons/Icons'
import {
  fullAddress,
  getShop,
  instagramLink,
  mapEmbedUrl,
  todayStatus,
  weekdayNames,
  whatsappLink,
} from '../../data/shop'
import { RouteButtons } from './RouteButtons'
import styles from './location.module.css'

export function Location() {
  const today = new Date().getDay()
  const status = todayStatus()
  const shop = getShop()
  const instagram = instagramLink()

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Como chegar</h1>
        <p className={styles.subtitle}>
          Toque no app de sua preferência e a rota abre pronta até a porta da barbearia.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.card}>
            <div className={styles.addressRow}>
              <span className={styles.addressIcon} aria-hidden="true">
                <PinIcon />
              </span>
              <div className={styles.address}>
                <span className={styles.addressMain}>
                  {shop.address.street}, {shop.address.complement}
                </span>
                <span className={styles.addressSub}>
                  {shop.address.district} · {shop.address.city} - {shop.address.state} ·{' '}
                  {shop.address.zip}
                </span>
              </div>
              <span className={[styles.status, status.open ? styles.open : styles.closed].join(' ')}>
                {status.label}
              </span>
            </div>

            <RouteButtons />

            <div className={styles.map}>
              <iframe
                title={`Mapa: ${fullAddress()}`}
                src={mapEmbedUrl()}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            {shop.parking && <p className={styles.tip}>{shop.parking}</p>}
          </section>
        </div>

        <aside className={styles.aside}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <ClockIcon />
              Horários
            </h2>
            <ul className={styles.hours}>
              {shop.hours.map((item) => (
                <li
                  key={item.day}
                  className={[styles.hourRow, item.day === today && styles.today].filter(Boolean).join(' ')}
                >
                  <span>{weekdayNames[item.day]}</span>
                  <span className={styles.hourValue}>
                    {item.open && item.close ? `${item.open} – ${item.close}` : 'Fechado'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Fale com a gente</h2>
            <div className={styles.contacts}>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={styles.contact}>
                <ChatIcon />
                <span>
                  <span className={styles.contactLabel}>WhatsApp</span>
                  <span className={styles.contactValue}>{shop.phone}</span>
                </span>
              </a>
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className={styles.contact}>
                  <InstagramIcon />
                  <span>
                    <span className={styles.contactLabel}>Instagram</span>
                    <span className={styles.contactValue}>@{shop.instagram}</span>
                  </span>
                </a>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

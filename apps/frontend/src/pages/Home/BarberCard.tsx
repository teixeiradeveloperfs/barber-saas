import { Button } from '../../components/Button/Button'
import { Photo } from '../../components/Photo/Photo'
import { StarIcon } from '../../components/icons/Icons'
import { formatRating, type Barber } from '../../data/home'
import styles from './BarberCard.module.css'

export function BarberCard({ barber }: { barber: Barber }) {
  return (
    <article className={styles.card}>
      <Photo src={barber.image} alt="" className={styles.photo}>
        {barber.tier && <span className={styles.tier}>{barber.tier}</span>}
      </Photo>

      <div className={styles.body}>
        <h3 className={styles.name}>{barber.name}</h3>
        <p className={styles.rating}>
          <StarIcon className={styles.star} />
          <span>{formatRating(barber.rating)}</span>
          <span className={styles.reviews}>({barber.reviews} avaliações)</span>
        </p>
      </div>

      <Button size="sm" to={`/agendar/${barber.id}`}>
        Agendar
      </Button>
    </article>
  )
}

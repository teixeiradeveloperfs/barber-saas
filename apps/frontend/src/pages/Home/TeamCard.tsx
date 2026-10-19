import { useState } from 'react'
import { Button } from '../../components/Button/Button'
import { Photo } from '../../components/Photo/Photo'
import { ScissorsIcon } from '../../components/ScissorsIcon/ScissorsIcon'
import { HeartIcon, StarIcon } from '../../components/icons/Icons'
import { formatRating, type Barber } from '../../data/home'
import styles from './TeamCard.module.css'

type TeamCardProps = {
  barber: Barber
  /** Query para o agendamento, ex.: "?servico=corte" vindo de Serviços. */
  bookingQuery?: string
}

/** Card vertical de barbeiro da equipe, com foto grande. */
export function TeamCard({ barber, bookingQuery = '' }: TeamCardProps) {
  const [favorite, setFavorite] = useState(false)

  return (
    <article className={styles.card}>
      <Photo src={barber.image} alt="" className={styles.photo}>
        <span className={styles.rating}>
          <StarIcon className={styles.star} />
          {formatRating(barber.rating)} <span className={styles.reviews}>({barber.reviews})</span>
        </span>
        <button
          type="button"
          className={[styles.favorite, favorite && styles.favoriteOn].filter(Boolean).join(' ')}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          onClick={() => setFavorite((value) => !value)}
        >
          <HeartIcon filled={favorite} />
        </button>
        {barber.tier && <span className={styles.tier}>{barber.tier}</span>}
      </Photo>

      <div className={styles.body}>
        <p className={styles.hours}>
          <span className={barber.nextAvailable.today ? styles.open : styles.closed}>
            {barber.nextAvailable.today ? 'Disponível hoje' : 'Próximo horário'}
          </span>
          <span className={styles.range}>
            {barber.nextAvailable.label.replace(/^Hoje · /, '')}
          </span>
        </p>
        <h3 className={styles.name}>{barber.name}</h3>
        <p className={styles.specialties}>
          <ScissorsIcon className={styles.specialtyIcon} />
          {barber.specialties.join(' · ')}
        </p>
        <Button block to={`/agendar/${barber.id}${bookingQuery}`} className={styles.cta}>
          Agendar horário
        </Button>
      </div>
    </article>
  )
}

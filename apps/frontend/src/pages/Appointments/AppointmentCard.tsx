import { isLoyaltyEnabled } from '../../data/gamification'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Appointment } from '../../appointments/appointments-context'
import {
  canCancelFree,
  formatDateLong,
  formatDateShort,
  formatTime,
  relativeDay,
} from '../../appointments/format'
import { useAppointments } from '../../appointments/useAppointments'
import { Avatar } from '../../components/Avatar/Avatar'
import { Button } from '../../components/Button/Button'
import { Dialog } from '../../components/Dialog/Dialog'
import {
  CalendarIcon,
  PinIcon,
  RepeatIcon,
  StarIcon,
  XIcon,
} from '../../components/icons/Icons'
import { formatDuration, formatPrice, getBarber, getService } from '../../data/barbers'
import { getShop } from '../../data/shop'
import { useGamification } from '../../gamification/useGamification'
import { CalendarDialog } from './CalendarDialog'
import { RatingDialog } from './RatingDialog'
import styles from './appointments.module.css'

const STATUS_LABEL: Record<Appointment['status'], string> = {
  marcado: 'Confirmado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  faltou: 'Não compareceu',
  cancelado: 'Cancelado',
}

type AppointmentCardProps = {
  appointment: Appointment
  /** Está na lista de próximos (ações de gerenciar) ou no histórico. */
  upcoming: boolean
  /** Primeiro da lista de próximos: mais informação e ações completas. */
  featured?: boolean
  onFlash?: (message: string) => void
}

export function AppointmentCard({ appointment, upcoming, featured = false, onFlash }: AppointmentCardProps) {
  const navigate = useNavigate()
  const { cancel, rate } = useAppointments()
  const { registerRating } = useGamification()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const barber = getBarber(appointment.barberId)
  const services = appointment.serviceIds
    .map((id) => getService(id))
    .filter((service): service is NonNullable<typeof service> => Boolean(service))
  const serviceNames = services.map((service) => service.name).join(' + ')
  const isUpcoming = upcoming
  const isDone = appointment.status === 'concluido'
  const freeCancel = canCancelFree(appointment.date)
  const bookAgainQuery = `?servico=${appointment.serviceIds.join(',')}`
  const covered = appointment.coveredServiceIds ?? []
  const allCovered = covered.length > 0 && appointment.total === 0

  if (!barber) return null

  async function confirmCancel() {
    setCancelling(true)
    try {
      await cancel(appointment.id)
      setCancelOpen(false)
      onFlash?.('Agendamento cancelado.')
    } catch {
      setCancelOpen(false)
      onFlash?.('Não deu para cancelar agora. Tente de novo ou fale com a barbearia.')
    } finally {
      setCancelling(false)
    }
  }

  function reschedule() {
    navigate(`/agendar/${barber?.id}${bookAgainQuery}&reagendar=${appointment.id}`)
  }

  function submitRating(stars: number, comment: string) {
    rate(appointment.id, stars, comment)
    registerRating(`Avaliação: ${serviceNames} com ${barber?.name}`)
    setRatingOpen(false)
    onFlash?.(isLoyaltyEnabled() ? 'Obrigado pela avaliação. +20 pontos.' : 'Obrigado pela avaliação.')
  }

  return (
    <article className={[styles.card, featured && styles.featured, !isUpcoming && styles.pastCard].filter(Boolean).join(' ')}>
      <header className={styles.cardTop}>
        <div className={styles.when}>
          <span className={styles.date}>
            {featured ? formatDateLong(appointment.date) : formatDateShort(appointment.date)}
          </span>
          <span className={styles.time}>
            {formatTime(appointment.date)}
            <span className={styles.relative}> · {relativeDay(appointment.date)}</span>
          </span>
        </div>
        <span className={[styles.status, styles[`status_${appointment.status}`]].join(' ')}>
          {STATUS_LABEL[appointment.status]}
        </span>
      </header>

      <div className={styles.who}>
        <Avatar name={barber.name} src={barber.image} size={featured ? 52 : 44} />
        <div className={styles.whoText}>
          <span className={styles.barberName}>{barber.name}</span>
          <span className={styles.services}>{serviceNames}</span>
        </div>
        <div className={styles.money}>
          <span className={styles.total}>{allCovered ? 'Incluso' : formatPrice(appointment.total)}</span>
          <span className={styles.duration}>
            {covered.length > 0 && <span className={styles.planTag}>Plano</span>}
            {formatDuration(appointment.durationMin)}
          </span>
        </div>
      </div>
      {featured && <p className={styles.code}>Código da reserva: <strong>{appointment.code}</strong></p>}

      {isDone && appointment.rating && (
        <div className={styles.rated}>
          <span className={styles.ratedStars} aria-label={`Sua nota: ${appointment.rating} de 5`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <StarIcon key={value} className={value <= appointment.rating! ? styles.ratedOn : styles.ratedOff} />
            ))}
          </span>
          {appointment.ratingComment && <span className={styles.ratedComment}>"{appointment.ratingComment}"</span>}
        </div>
      )}

      <footer className={styles.actions}>
        {isUpcoming ? (
          <>
            <Link to="/como-chegar" className={styles.action}>
              <PinIcon />
              Como chegar
            </Link>
            <button type="button" className={styles.action} onClick={() => setCalendarOpen(true)}>
              <CalendarIcon />
              Calendário
            </button>
            <button type="button" className={styles.action} onClick={reschedule}>
              <RepeatIcon />
              Reagendar
            </button>
            <button type="button" className={`${styles.action} ${styles.actionDanger}`} onClick={() => setCancelOpen(true)}>
              <XIcon />
              Cancelar
            </button>
          </>
        ) : (
          <>
            {isDone && !appointment.rating && (
              <Button size="sm" onClick={() => setRatingOpen(true)}>
                <StarIcon />
                Avaliar
              </Button>
            )}
            <Button size="sm" variant="ghost" to={`/agendar/${barber.id}${bookAgainQuery}`}>
              <RepeatIcon />
              Agendar de novo
            </Button>
          </>
        )}
      </footer>

      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancelar este agendamento?"
        actions={
          <>
            <Button variant="ghost" size="lg" onClick={() => setCancelOpen(false)}>
              Manter
            </Button>
            <Button variant="danger" size="lg" onClick={confirmCancel} loading={cancelling}>
              Cancelar agendamento
            </Button>
          </>
        }
      >
        <p>
          {formatDateLong(appointment.date)} às {formatTime(appointment.date)} com {barber.name}.{' '}
          {freeCancel
            ? 'Ainda dá para cancelar sem custo.'
            : 'Faltam menos de 2 horas: a barbearia pode cobrar a taxa de cancelamento.'}
        </p>
      </Dialog>

      <CalendarDialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title={`${getShop().name} · ${serviceNames}`}
        description={`${serviceNames} com ${barber.name}. Total ${formatPrice(appointment.total)}.`}
        start={new Date(appointment.date)}
        durationMin={appointment.durationMin}
      />

      <RatingDialog
        open={ratingOpen}
        barberName={barber.name}
        onClose={() => setRatingOpen(false)}
        onSubmit={submitRating}
      />
    </article>
  )
}

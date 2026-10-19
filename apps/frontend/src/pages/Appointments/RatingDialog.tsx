import { isLoyaltyEnabled } from '../../data/gamification'
import { useState } from 'react'
import { Button } from '../../components/Button/Button'
import { Dialog } from '../../components/Dialog/Dialog'
import { StarIcon, StarOutlineIcon } from '../../components/icons/Icons'
import styles from './appointments.module.css'

const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente']

type RatingDialogProps = {
  open: boolean
  barberName: string
  onClose: () => void
  onSubmit: (rating: number, comment: string) => void
}

export function RatingDialog({ open, barberName, onClose, onSubmit }: RatingDialogProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const shown = hover || rating

  function submit() {
    if (!rating) return
    onSubmit(rating, comment)
    setRating(0)
    setComment('')
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Como foi com ${barberName}?`}
      actions={
        <>
          <Button variant="ghost" size="lg" onClick={onClose}>
            Agora não
          </Button>
          <Button size="lg" onClick={submit} disabled={!rating}>
            Enviar avaliação
          </Button>
        </>
      }
    >
      <div className={styles.ratingBody}>
        <div className={styles.stars} role="radiogroup" aria-label="Nota">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
              className={[styles.star, value <= shown && styles.starOn].filter(Boolean).join(' ')}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(value)}
            >
              {value <= shown ? <StarIcon /> : <StarOutlineIcon />}
            </button>
          ))}
        </div>
        <p className={styles.ratingLabel}>{shown ? LABELS[shown] : 'Toque nas estrelas'}</p>
        <textarea
          className={styles.comment}
          placeholder="Quer contar algo? (opcional)"
          rows={3}
          maxLength={280}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        {isLoyaltyEnabled() && <p className={styles.ratingHint}>Avaliar vale +20 pontos no programa de fidelidade.</p>}
      </div>
    </Dialog>
  )
}

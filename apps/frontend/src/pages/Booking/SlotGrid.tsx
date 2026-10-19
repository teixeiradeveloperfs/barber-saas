import type { Slot } from '../../lib/api'
import styles from './SlotGrid.module.css'

type SlotGridProps = {
  slots: Slot[]
  selected: string | null
  onSelect: (time: string) => void
  loading?: boolean
  /** Mensagem no lugar da grade: agenda fechada, erro, dia sem horários. */
  notice?: string | null
}

const REASON: Record<NonNullable<Slot['reason']>, string> = {
  passou: 'Horário já passou',
  ocupado: 'Horário ocupado',
  bloqueado: 'Sem atendimento neste horário',
}

export function SlotGrid({ slots, selected, onSelect, loading = false, notice = null }: SlotGridProps) {
  if (loading) {
    return (
      <div className={styles.grid} aria-busy="true" aria-label="Carregando horários">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} className={`${styles.slot} ${styles.skeleton}`} />
        ))}
      </div>
    )
  }
  if (notice) return <p className={styles.empty}>{notice}</p>
  if (slots.length === 0) {
    return <p className={styles.empty}>Sem horários neste dia. Escolha outro.</p>
  }
  if (!slots.some((slot) => slot.available)) {
    return <p className={styles.empty}>Todos os horários deste dia já foram. Escolha outro dia.</p>
  }

  return (
    <div className={styles.grid} role="radiogroup" aria-label="Horário">
      {slots.map((slot) => {
        const isSelected = slot.time === selected
        return (
          <button
            key={slot.time}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={!slot.available}
            className={[styles.slot, isSelected && styles.selected].filter(Boolean).join(' ')}
            onClick={() => onSelect(slot.time)}
            title={slot.available ? undefined : REASON[slot.reason ?? 'ocupado']}
          >
            {slot.time}
          </button>
        )
      })}
    </div>
  )
}

import type { Day } from '../../data/barbers'
import styles from './DayPicker.module.css'

type DayPickerProps = {
  days: Day[]
  selected: string
  onSelect: (key: string) => void
}

export function DayPicker({ days, selected, onSelect }: DayPickerProps) {
  return (
    <div className={styles.days} role="radiogroup" aria-label="Dia">
      {days.map((day) => {
        const isSelected = day.key === selected
        return (
          <button
            key={day.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${day.weekday} ${day.dayNumber}${day.closed ? ', fechado' : ''}`}
            disabled={day.closed}
            className={[styles.day, isSelected && styles.selected].filter(Boolean).join(' ')}
            onClick={() => onSelect(day.key)}
          >
            <span className={styles.weekday}>{day.isToday ? 'Hoje' : day.weekday}</span>
            <span className={styles.number}>{day.dayNumber}</span>
          </button>
        )
      })}
    </div>
  )
}

import { CheckIcon } from '../../components/icons/Icons'
import { formatDuration, formatPrice, type Service } from '../../data/barbers'
import styles from './ServiceList.module.css'

type ServiceListProps = {
  services: Service[]
  selected: string[]
  onToggle: (id: string) => void
  /** Serviços que o plano do Clube cobre nesta seleção. */
  coveredIds?: string[]
}

export function ServiceList({ services, selected, onToggle, coveredIds = [] }: ServiceListProps) {
  return (
    <ul className={styles.list} aria-label="Serviços">
      {services.map((service) => {
        const isSelected = selected.includes(service.id)
        const isCovered = isSelected && coveredIds.includes(service.id)
        return (
          <li key={service.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              className={[styles.row, isSelected && styles.selected].filter(Boolean).join(' ')}
              onClick={() => onToggle(service.id)}
            >
              <span className={styles.check} aria-hidden="true">
                <CheckIcon />
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{service.name}</span>
                <span className={styles.duration}>{formatDuration(service.durationMin)}</span>
              </span>
              <span className={styles.priceCol}>
                {isCovered && <span className={styles.covered}>Incluso</span>}
                <span className={[styles.price, isCovered && styles.priceStruck].filter(Boolean).join(' ')}>
                  {formatPrice(service.price)}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

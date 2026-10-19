import { Button } from '../../components/Button/Button'
import { formatDuration, formatPrice } from '../../data/barbers'
import styles from './SummaryBar.module.css'

type SummaryBarProps = {
  dayLabel: string | null
  time: string | null
  serviceCount: number
  totalMinutes: number
  /** Valor a pagar depois do plano. */
  total: number
  coveredCount: number
  /** Nulo com Recompensas desligadas: não mostra pontos. */
  points: number | null
  loading: boolean
  onConfirm: () => void
}

export function SummaryBar({
  dayLabel,
  time,
  serviceCount,
  totalMinutes,
  total,
  coveredCount,
  points,
  loading,
  onConfirm,
}: SummaryBarProps) {
  const ready = Boolean(dayLabel && time && serviceCount > 0)
  const allCovered = serviceCount > 0 && coveredCount === serviceCount

  const when = dayLabel && time ? `${dayLabel} · ${time}` : 'Escolha dia e horário'
  const parts = [
    `${serviceCount} ${serviceCount === 1 ? 'serviço' : 'serviços'}`,
    formatDuration(totalMinutes),
    coveredCount > 0 ? `${coveredCount} ${coveredCount === 1 ? 'incluso' : 'inclusos'} no plano` : null,
    points !== null ? `+${points} pts` : null,
  ].filter(Boolean)
  const what = serviceCount === 0 ? 'Selecione ao menos um serviço' : parts.join(' · ')

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.text}>
          <span className={styles.when}>{when}</span>
          <span className={styles.what}>{what}</span>
        </div>
        <Button size="lg" disabled={!ready} loading={loading} onClick={onConfirm} className={styles.cta}>
          Confirmar
          {serviceCount > 0 && (
            <span className={styles.total}>{allCovered ? 'Incluso' : formatPrice(total)}</span>
          )}
        </Button>
      </div>
    </div>
  )
}

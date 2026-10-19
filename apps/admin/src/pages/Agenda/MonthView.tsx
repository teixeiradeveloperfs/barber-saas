import type { AppConfig } from '@barber/tenant-config'
import type { Appointment } from '../../api/admin'
import { todayKey } from '../../lib/format'
import { WEEKDAY_SHORT, isClosedDay, monthGrid, parseDate, sameMonth } from './calendar'
import styles from './MonthView.module.css'

type Props = {
  date: string
  appointments: Appointment[]
  config: AppConfig
  onPickDay: (date: string) => void
}

/** Mês em calendário: cada dia com quantos atendimentos e faltas. Clicar abre o dia. */
export function MonthView({ date, appointments, config, onPickDay }: Props) {
  const today = todayKey()
  const weeks = monthGrid(date)
  const order = [1, 2, 3, 4, 5, 6, 0]
  return (
    <div className={styles.wrap} data-testid="month-view">
      <div className={styles.head}>
        {order.map((day) => (
          <span key={day}>{WEEKDAY_SHORT[day]}</span>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0]} className={styles.week}>
          {week.map((day) => {
            const list = appointments.filter((item) => item.date === day && item.status !== 'CANCELADO')
            const faltas = list.filter((item) => item.status === 'FALTOU').length
            return (
              <button
                key={day}
                type="button"
                className={[styles.cell, !sameMonth(day, date) && styles.outside, day === today && styles.today, isClosedDay(config, day) && styles.closed].filter(Boolean).join(' ')}
                onClick={() => onPickDay(day)}
                aria-label={`${day}: ${list.length} atendimentos`}
                data-testid="month-cell"
              >
                <span className={styles.num}>{parseDate(day).getDate()}</span>
                {list.length > 0 && (
                  <span className={styles.chips}>
                    <span className={styles.chip}>
                      {list.length} {list.length === 1 ? 'atend.' : 'atend.'}
                    </span>
                    {faltas > 0 && <span className={`${styles.chip} ${styles.chipDanger}`}>{faltas} {faltas === 1 ? 'falta' : 'faltas'}</span>}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

import type { AppConfig } from '@barber/tenant-config'
import type { AgendaBlock, Appointment } from '../../api/admin'
import { todayKey } from '../../lib/format'
import { TimeGrid, type GridBlock, type GridColumn } from './TimeGrid'
import { WEEKDAY_SHORT, isClosedDay, localParts, parseDate } from './calendar'

type Props = {
  days: string[]
  appointments: Appointment[]
  blocks: AgendaBlock[]
  config: AppConfig
  range: { start: number; end: number }
  showBarber: boolean
  canCreate: boolean
  onOpen: (appointment: Appointment) => void
  onCreate: (date: string, time: string) => void
}

/** Semana: uma coluna por dia. */
export function WeekView({ days, appointments, blocks, config, range, showBarber, canCreate, onOpen, onCreate }: Props) {
  const today = todayKey()
  const barberName = (id: string) => config.barbers.find((barber) => barber.id === id)?.name ?? id
  const columns: GridColumn[] = days.map((day) => {
    const value = parseDate(day)
    return {
      key: day,
      date: day,
      today: day === today,
      now: day === today,
      closed: isClosedDay(config, day),
      title: (
        <>
          <span>{WEEKDAY_SHORT[value.getDay()]}</span>
          <strong>{value.getDate()}</strong>
        </>
      ),
    }
  })
  const gridBlocks: GridBlock[] = blocks.map((block) => {
    const start = localParts(block.startsAt)
    return {
      id: block.id,
      column: 'all',
      date: start.date,
      begin: start.minutes,
      end: localParts(block.endsAt).minutes,
      label: block.reason ?? 'Bloqueado',
      title: `${block.barberId ? barberName(block.barberId) : 'Toda a barbearia'}: ${block.reason ?? 'bloqueado'}`,
    }
  })
  return (
    <TimeGrid
      testId="week-view"
      columns={columns}
      events={appointments.map((appointment) => ({ column: appointment.date, appointment }))}
      blocks={gridBlocks}
      range={range}
      showBarber={showBarber}
      barberName={barberName}
      canCreate={canCreate}
      onOpen={onOpen}
      onCreate={(column, time) => onCreate(column.date, time)}
    />
  )
}

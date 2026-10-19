import type { AppConfig } from '@barber/tenant-config'
import type { AgendaBlock, Appointment, BarberAgendaState } from '../../api/admin'
import { todayKey } from '../../lib/format'
import { TimeGrid, type GridBlock, type GridColumn } from './TimeGrid'
import { isClosedDay, localParts } from './calendar'

type Props = {
  date: string
  /** Barbeiros que viram colunas (já filtrados). */
  barbers: { id: string; name: string }[]
  /** Estado da agenda de cada um (aberta/fechada), quando houver. */
  states?: BarberAgendaState[]
  appointments: Appointment[]
  blocks: AgendaBlock[]
  config: AppConfig
  range: { start: number; end: number }
  canCreate: boolean
  /** Link do cabeçalho de cada coluna (ex.: grade do barbeiro). */
  linkTo?: (barberId: string) => string
  onOpen: (appointment: Appointment) => void
  onCreate: (barberId: string, time: string) => void
}

/** Dia: uma coluna por barbeiro. */
export function DayView({ date, barbers, states, appointments, blocks, config, range, canCreate, linkTo, onOpen, onCreate }: Props) {
  const today = todayKey()
  const closedDay = isClosedDay(config, date)
  const barberName = (id: string) => config.barbers.find((barber) => barber.id === id)?.name ?? id
  const columns: GridColumn[] = barbers.map((barber) => {
    const state = states?.find((item) => item.id === barber.id)
    return {
      key: barber.id,
      date,
      now: date === today,
      closed: closedDay || (state ? !state.open : false),
      link: linkTo?.(barber.id),
      title: (
        <>
          <strong>{barber.name}</strong>
          {state && !state.open && <span>fechada</span>}
        </>
      ),
    }
  })
  const gridBlocks: GridBlock[] = blocks.map((block) => {
    const start = localParts(block.startsAt)
    return {
      id: block.id,
      column: block.barberId ?? 'all',
      date: start.date,
      begin: start.minutes,
      end: localParts(block.endsAt).minutes,
      label: block.reason ?? 'Bloqueado',
      title: `${block.barberId ? barberName(block.barberId) : 'Toda a barbearia'}: ${block.reason ?? 'bloqueado'}`,
    }
  })
  return (
    <TimeGrid
      testId="day-view"
      columns={columns}
      events={appointments.map((appointment) => ({ column: appointment.barberId, appointment }))}
      blocks={gridBlocks}
      range={range}
      showBarber={false}
      barberName={barberName}
      canCreate={canCreate}
      minColumn={barbers.length === 1 ? 240 : 150}
      onOpen={onOpen}
      onCreate={(column, time) => onCreate(column.key, time)}
    />
  )
}

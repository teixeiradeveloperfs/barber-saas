import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Appointment } from '../../api/admin'
import { PX_PER_MIN, STEP_MIN, minutesOf, timeOfMinutes } from './calendar'
import styles from './TimeGrid.module.css'

export type GridColumn = {
  key: string
  /** Dia que a coluna representa ("YYYY-MM-DD"). */
  date: string
  title: ReactNode
  closed?: boolean
  /** Destaque de "hoje" no cabeçalho (colunas de dia). */
  today?: boolean
  /** Mostra a linha do horário atual (a coluna é do dia de hoje). */
  now?: boolean
  /** Cabeçalho vira link (ex.: página do barbeiro). */
  link?: string
}

export type GridEvent = { column: string; appointment: Appointment }

export type GridBlock = {
  id: string
  /** Coluna ou 'all' para bloqueio da barbearia inteira no dia. */
  column: string | 'all'
  date: string
  begin: number
  end: number
  label: string
  title?: string
}

type Props = {
  columns: GridColumn[]
  events: GridEvent[]
  blocks: GridBlock[]
  range: { start: number; end: number }
  /** Sem filtro de barbeiro, cada bloco mostra quem atende. */
  showBarber: boolean
  barberName: (id: string) => string
  canCreate: boolean
  onOpen: (appointment: Appointment) => void
  onCreate: (column: GridColumn, time: string) => void
  /** Largura mínima de cada coluna em px. */
  minColumn?: number
  testId?: string
}

type Placed = { appointment: Appointment; top: number; height: number; lane: number; lanes: number }

/** Blocos que se sobrepõem dividem a coluna em faixas lado a lado. */
function place(list: Appointment[], start: number): Placed[] {
  const sorted = [...list].sort((a, b) => minutesOf(a.time) - minutesOf(b.time) || b.durationMin - a.durationMin)
  const placed: Placed[] = []
  let cluster: Placed[] = []
  let clusterEnd = -1
  const laneEnds: number[] = []
  const flush = () => {
    for (const item of cluster) item.lanes = laneEnds.length
    placed.push(...cluster)
    cluster = []
    laneEnds.length = 0
  }
  for (const appointment of sorted) {
    const begin = minutesOf(appointment.time)
    const finish = begin + appointment.durationMin
    if (cluster.length > 0 && begin >= clusterEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= begin)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(finish)
    } else laneEnds[lane] = finish
    cluster.push({ appointment, top: (begin - start) * PX_PER_MIN, height: Math.max(appointment.durationMin * PX_PER_MIN - 2, 22), lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, finish)
  }
  flush()
  return placed
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Grade de horários em colunas (dias da semana ou barbeiros do dia), linhas de
 * meia em meia hora, atendimentos como blocos posicionados pelo horário.
 */
export function TimeGrid({ columns, events, blocks, range, showBarber, barberName, canCreate, onOpen, onCreate, minColumn = 132, testId = 'time-grid' }: Props) {
  const height = (range.end - range.start) * PX_PER_MIN
  const hours = useMemo(() => {
    const list: number[] = []
    for (let minute = Math.ceil(range.start / 60) * 60; minute <= range.end; minute += 60) list.push(minute)
    return list
  }, [range])
  const byColumn = useMemo(
    () => new Map(columns.map((column) => [column.key, place(events.filter((event) => event.column === column.key && event.appointment.date === column.date).map((event) => event.appointment), range.start)])),
    [columns, events, range.start],
  )
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  function create(column: GridColumn, event: MouseEvent<HTMLDivElement>) {
    if (!canCreate) return
    const rect = event.currentTarget.getBoundingClientRect()
    const minute = range.start + Math.floor((event.clientY - rect.top) / PX_PER_MIN / STEP_MIN) * STEP_MIN
    onCreate(column, timeOfMinutes(Math.min(Math.max(minute, range.start), range.end - STEP_MIN)))
  }

  return (
    <div className={styles.wrap} data-testid={testId}>
      <div className={styles.grid} style={{ '--cols': columns.length, '--col-min': `${minColumn}px` } as React.CSSProperties}>
        <div className={styles.corner} aria-hidden="true" />
        {columns.map((column) => {
          const className = [styles.dayHead, column.today && styles.today, column.closed && styles.closed].filter(Boolean).join(' ')
          return column.link ? (
            <Link key={column.key} to={column.link} className={`${className} ${styles.headLink}`}>
              {column.title}
            </Link>
          ) : (
            <div key={column.key} className={className}>
              {column.title}
            </div>
          )
        })}

        <div className={styles.times} style={{ height }} aria-hidden="true">
          {hours.map((minute) => (
            <span key={minute} className={[styles.hour, minute === range.start && styles.hourFirst].filter(Boolean).join(' ')} style={{ top: (minute - range.start) * PX_PER_MIN }}>
              {timeOfMinutes(minute)}
            </span>
          ))}
        </div>

        {columns.map((column) => (
          <div
            key={column.key}
            className={[styles.col, column.closed && styles.colClosed, canCreate && styles.colClickable].filter(Boolean).join(' ')}
            style={{ height }}
            onClick={(event) => create(column, event)}
            role={canCreate ? 'button' : undefined}
            aria-label={canCreate ? `Agendar em ${column.date}` : undefined}
          >
            {blocks
              .filter((block) => block.date === column.date && (block.column === 'all' || block.column === column.key))
              .map((block) => (
                <div key={block.id} className={styles.block} style={{ top: (block.begin - range.start) * PX_PER_MIN, height: (block.end - block.begin) * PX_PER_MIN }} title={block.title ?? block.label}>
                  <span>{block.label}</span>
                </div>
              ))}
            {(byColumn.get(column.key) ?? []).map(({ appointment, top, height: blockHeight, lane, lanes }) => (
              <button
                key={appointment.id}
                type="button"
                className={[styles.event, styles[`status_${appointment.status}`], blockHeight < 46 && styles.xs, blockHeight >= 46 && blockHeight < 66 && styles.sm].filter(Boolean).join(' ')}
                style={{ top, height: blockHeight, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
                title={`${appointment.time} · ${appointment.customer.name} · ${barberName(appointment.barberId)}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen(appointment)
                }}
                data-testid="week-event"
              >
                <span className={styles.eventTime}>{appointment.time}</span>
                <span className={styles.eventName}>{appointment.customer.name}</span>
                {showBarber && <span className={styles.eventBarber}>{lanes > 1 ? initials(barberName(appointment.barberId)) : barberName(appointment.barberId)}</span>}
              </button>
            ))}
            {column.now && nowMinutes >= range.start && nowMinutes <= range.end && <div className={styles.now} style={{ top: (nowMinutes - range.start) * PX_PER_MIN }} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  )
}

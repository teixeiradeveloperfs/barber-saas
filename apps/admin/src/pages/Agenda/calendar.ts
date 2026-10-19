import type { AppConfig } from '@barber/tenant-config'
import { shiftDay } from '../../lib/format'

export type AgendaView = 'dia' | 'semana' | 'mes'

const VIEW_KEY = 'barber-admin:agenda-view'
const TIME_ZONE = 'America/Sao_Paulo'

export const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
/** Minutos entre linhas da grade e altura de cada passo em px. */
export const STEP_MIN = 30
export const PX_PER_MIN = 2

export function loadView(): AgendaView {
  try {
    const value = localStorage.getItem(VIEW_KEY)
    return value === 'semana' || value === 'mes' ? value : 'dia'
  } catch {
    return 'dia'
  }
}

export function saveView(view: AgendaView) {
  try {
    localStorage.setItem(VIEW_KEY, view)
  } catch {
    // sem storage, a visão dura só esta aba
  }
}

const pad = (value: number) => String(value).padStart(2, '0')

export function parseDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function keyOf(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

/** Segunda a domingo da semana que contém a data. */
export function weekOf(date: string) {
  const offset = (parseDate(date).getDay() + 6) % 7
  const start = shiftDay(date, -offset)
  return Array.from({ length: 7 }, (_, index) => shiftDay(start, index))
}

/** Semanas (segunda a domingo) que cobrem o mês, com os dias vizinhos que completam as pontas. */
export function monthGrid(date: string) {
  const value = parseDate(date)
  const first = keyOf(new Date(value.getFullYear(), value.getMonth(), 1))
  const last = keyOf(new Date(value.getFullYear(), value.getMonth() + 1, 0))
  const weeks: string[][] = []
  let cursor = weekOf(first)[0]
  while (cursor <= last) {
    weeks.push(weekOf(cursor))
    cursor = shiftDay(cursor, 7)
  }
  return weeks
}

export function shiftMonth(date: string, delta: number) {
  const value = parseDate(date)
  return keyOf(new Date(value.getFullYear(), value.getMonth() + delta, 1))
}

export function sameMonth(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7)
}

export function minutesOf(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function timeOfMinutes(total: number) {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

const partsFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })

/** Data e minutos do dia no fuso da barbearia. */
export function localParts(iso: string) {
  const parts = Object.fromEntries(partsFormat.formatToParts(new Date(iso)).map((part) => [part.type, part.value]))
  const hour = Number(parts.hour) % 24
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: hour * 60 + Number(parts.minute) }
}

/** Faixa de horário da grade: do menor "abre" ao maior "fecha" dos dias mostrados; sem expediente, 8h às 20h. */
export function gridRange(config: AppConfig, days: string[]) {
  let start = 24 * 60
  let end = 0
  for (const day of days) {
    const hours = config.hours.find((entry) => entry.day === parseDate(day).getDay())
    if (hours?.open && hours?.close) {
      start = Math.min(start, minutesOf(hours.open))
      end = Math.max(end, minutesOf(hours.close))
    }
  }
  if (end <= start) return { start: 8 * 60, end: 20 * 60 }
  return { start, end }
}

export function isClosedDay(config: AppConfig, day: string) {
  const hours = config.hours.find((entry) => entry.day === parseDate(day).getDay())
  return !hours?.open || !hours?.close
}

const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

/** "15 – 21 de set" ou "28 de set – 4 de out". */
export function weekLabel(days: string[]) {
  const first = parseDate(days[0])
  const last = parseDate(days[days.length - 1])
  const lastLabel = dayMonth.format(last).replace('.', '')
  if (first.getMonth() === last.getMonth()) return `${first.getDate()} – ${lastLabel}`
  return `${dayMonth.format(first).replace('.', '')} – ${lastLabel}`
}

export function monthLabel(date: string) {
  return monthYear.format(parseDate(date))
}

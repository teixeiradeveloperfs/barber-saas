import type { Barber, Service, ServiceCategory, ServiceCategoryId } from '@barber/tenant-config'
import { getTenant } from '../tenant/active'
import { getBarbers } from './home'

export type { Service, ServiceCategory, ServiceCategoryId }

export type BarberProfile = Barber & {
  services: Service[]
}

/** Catálogo do tenant. Toda a equipe atende a lista completa. */
export function getServices(): Service[] {
  return getTenant().services
}

export function getServiceCategories(): ServiceCategory[] {
  return getTenant().serviceCategories
}

export function getService(id: string) {
  return getServices().find((service) => service.id === id)
}

export function getBarber(id: string | undefined): BarberProfile | null {
  const base = getBarbers().find((barber) => barber.id === id)
  if (!base) return null
  return { ...base, services: getServices() }
}

export const tierLabel: Record<NonNullable<Barber['tier']>, string> = {
  Pro: 'Barbeiro Pro',
  Novo: 'Novo na plataforma',
}

/* ---------- agenda ---------- */

export type Day = {
  date: Date
  key: string
  weekday: string
  dayNumber: number
  isToday: boolean
  closed: boolean
}

const weekdayFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const longDateFormat = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

/** Próximos 7 dias a partir de hoje. Fechado segue os horários do tenant. */
export function getUpcomingDays(from = new Date(), count = 7): Day[] {
  const hours = getTenant().hours
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    const today = hours.find((item) => item.day === date.getDay())
    return {
      date,
      key: dayKey(date),
      weekday: capitalize(weekdayFormat.format(date).replace('.', '')),
      dayNumber: date.getDate(),
      isToday: offset === 0,
      closed: !today?.open || !today.close,
    }
  })
}

export function formatLongDate(date: Date) {
  return capitalize(longDateFormat.format(date))
}

/** "AAAA-MM-DD" do dia, no relógio local do cliente (mesmo fuso da barbearia no Brasil). */
export function dateKey(day: Day) {
  const { date } = day
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/* ---------- formatação ---------- */

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const currencyCents = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** "R$ 18" quando inteiro; "R$ 14,40" com centavos (desconto de indicação). */
export function formatPrice(value: number) {
  return Number.isInteger(value) ? currency.format(value) : currencyCents.format(value)
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h${String(rest).padStart(2, '0')}` : `${hours}h`
}

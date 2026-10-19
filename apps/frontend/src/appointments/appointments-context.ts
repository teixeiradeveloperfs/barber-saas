import { createContext } from 'react'

/**
 * Situação vista pelo cliente. Toda reserva já nasce `confirmado`; `marcado`
 * só aparece em reserva antiga e vale igual. `faltou` é registro da barbearia
 * de que o cliente não veio.
 */
export type AppointmentStatus = 'marcado' | 'confirmado' | 'concluido' | 'faltou' | 'cancelado'

export type Appointment = {
  /** Id do agendamento na barbearia. */
  id: string
  /** Código para consultar e cancelar; a única chave que o app guarda. */
  code: string
  barberId: string
  serviceIds: string[]
  /** Início em ISO (UTC). */
  date: string
  durationMin: number
  /** Valor a pagar. Zero quando o plano cobriu tudo. */
  total: number
  /** Serviços pagos pelo plano do Clube neste agendamento. */
  coveredServiceIds?: string[]
  /** Desconto de recompensa de indicação já abatido do total. */
  discount?: number
  rewardLabel?: string
  status: AppointmentStatus
  rating?: number
  ratingComment?: string
  createdAt: string
}

export type NewAppointment = {
  barberId: string
  serviceIds: string[]
  coveredServiceIds: string[]
  /** "AAAA-MM-DD" e "HH:MM" no horário da barbearia. */
  date: string
  time: string
  customer: { name: string; phone: string }
  /** Recompensa de indicação usada nesta reserva. */
  rewardId?: string
}

export type AppointmentsContextValue = {
  appointments: Appointment[]
  upcoming: Appointment[]
  past: Appointment[]
  /** Reserva na barbearia. Lança ApiError em conflito ou dados inválidos. */
  add: (input: NewAppointment) => Promise<Appointment>
  cancel: (id: string) => Promise<void>
  rate: (id: string, rating: number, comment?: string) => void
  /** Atualiza a situação dos agendamentos abertos com a barbearia. */
  refresh: () => Promise<void>
  reset: () => void
  /** Cliente novo: sem histórico. */
  clearAll: () => void
}

export const AppointmentsContext = createContext<AppointmentsContextValue | null>(null)

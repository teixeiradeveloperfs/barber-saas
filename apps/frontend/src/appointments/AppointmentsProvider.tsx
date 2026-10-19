import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCustomerAuth } from '../auth/useCustomerAuth'
import { agendaApi, type ServerAppointment, type ServerStatus } from '../lib/api'
import { getTenant } from '../tenant/active'
import { AppointmentsContext, type Appointment, type AppointmentStatus, type NewAppointment } from './appointments-context'

/** Uma lista por barbearia: o mesmo navegador pode abrir apps diferentes. */
function storageKey() {
  return `barber:${getTenant().id}:appointments`
}

const STATUS: Record<ServerStatus, AppointmentStatus> = {
  MARCADO: 'marcado',
  CONFIRMADO: 'confirmado',
  CONCLUIDO: 'concluido',
  FALTOU: 'faltou',
  CANCELADO: 'cancelado',
}

const OPEN: AppointmentStatus[] = ['marcado', 'confirmado']

function fromServer(row: ServerAppointment, previous?: Appointment): Appointment {
  return {
    id: row.id,
    code: row.cancelCode,
    barberId: row.barberId,
    serviceIds: row.serviceIds,
    date: row.startsAt,
    durationMin: row.durationMin,
    total: row.total,
    coveredServiceIds: row.coveredServiceIds,
    discount: row.discount || undefined,
    rewardLabel: row.rewardLabel ?? undefined,
    status: STATUS[row.status],
    rating: previous?.rating,
    ratingComment: previous?.ratingComment,
    createdAt: row.createdAt,
  }
}

function readStored(): Appointment[] {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return []
    const stored = JSON.parse(raw) as Appointment[]
    // Entradas antigas da demo não têm código: não existem na barbearia, somem.
    return Array.isArray(stored) ? stored.filter((item) => typeof item.code === 'string' && item.code) : []
  } catch {
    return []
  }
}

const byDateAsc = (a: Appointment, b: Appointment) => a.date.localeCompare(b.date)
const byDateDesc = (a: Appointment, b: Appointment) => b.date.localeCompare(a.date)

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const { status, customer } = useCustomerAuth()
  const logged = status === 'logado'
  const [appointments, setAppointments] = useState<Appointment[]>(readStored)
  // Referência de "agora" fixa por montagem: mantém o render puro.
  const [now] = useState(() => Date.now())

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(appointments))
    } catch {
      // storage bloqueado: segue só em memória
    }
  }, [appointments])

  const upsert = useCallback((row: ServerAppointment) => {
    let result: Appointment | null = null
    setAppointments((current) => {
      const previous = current.find((item) => item.id === row.id)
      result = fromServer(row, previous)
      const next = previous ? current.map((item) => (item.id === row.id ? result! : item)) : [result!, ...current]
      return next
    })
    return result as Appointment | null
  }, [])

  const add = useCallback(
    async (input: NewAppointment) => {
      const row = await agendaApi.book(input)
      const appointment = fromServer(row)
      setAppointments((current) => [appointment, ...current.filter((item) => item.id !== row.id)])
      return appointment
    },
    [],
  )

  const cancel = useCallback(
    async (id: string) => {
      const target = appointments.find((item) => item.id === id)
      if (!target) return
      const row = logged ? await agendaApi.cancelMine(target.id) : await agendaApi.cancel(target.code)
      upsert(row)
    },
    [appointments, logged, upsert],
  )

  /**
   * Reconcilia com a barbearia. Logado, a lista vem inteira da conta (inclui
   * reservas feitas em outro aparelho); visitante, só o que este navegador guardou.
   */
  const refresh = useCallback(async () => {
    if (logged) {
      const rows = await agendaApi.mine().catch(() => null)
      if (!rows) return
      setAppointments((current) => {
        const byId = new Map(current.map((item) => [item.id, item]))
        return rows.map((row) => fromServer(row, byId.get(row.id)))
      })
      return
    }
    const open = appointments.filter((item) => OPEN.includes(item.status))
    await Promise.all(
      open.map((item) =>
        agendaApi
          .byCode(item.code)
          .then((row) => upsert(row))
          .catch(() => undefined),
      ),
    )
  }, [appointments, logged, upsert])

  // Sincroniza ao abrir e sempre que a sessão muda (entrou, saiu, outra conta).
  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logged, customer?.id])

  const rate = useCallback((id: string, rating: number, comment?: string) => {
    setAppointments((current) =>
      current.map((item) => (item.id === id ? { ...item, rating, ratingComment: comment?.trim() || undefined } : item)),
    )
  }, [])

  const clearAll = useCallback(() => {
    setAppointments([])
  }, [])

  const reset = useCallback(() => {
    setAppointments([])
    try {
      localStorage.removeItem(storageKey())
    } catch {
      // nada a limpar
    }
  }, [])

  const value = useMemo(() => {
    const upcoming = appointments.filter((item) => OPEN.includes(item.status) && new Date(item.date).getTime() >= now).sort(byDateAsc)
    const past = appointments.filter((item) => !OPEN.includes(item.status) || new Date(item.date).getTime() < now).sort(byDateDesc)
    return { appointments, upcoming, past, add, cancel, rate, refresh, reset, clearAll }
  }, [appointments, now, add, cancel, rate, refresh, reset, clearAll])

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>
}

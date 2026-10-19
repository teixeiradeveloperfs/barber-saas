import { useEffect, useState } from 'react'
import { agendaApi, type SlotsResponse } from '../lib/api'

type Result = { key: string; data: SlotsResponse | null; error: string | null }

/** Horários livres de um barbeiro num dia para a duração escolhida. Refaz ao mudar qualquer um. */
export function useSlots(barberId: string | undefined, date: string | null, durationMin: number) {
  const key = barberId && date ? `${barberId}|${date}|${Math.max(durationMin, 5)}` : ''
  const [result, setResult] = useState<Result>({ key: '', data: null, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!barberId || !date) return
    let cancelled = false
    const current = key
    agendaApi
      .slots(barberId, date, Math.max(durationMin, 5))
      .then((data) => {
        if (!cancelled) setResult({ key: current, data, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult({ key: current, data: null, error: error instanceof Error ? error.message : 'Não deu para carregar os horários.' })
      })
    return () => {
      cancelled = true
    }
  }, [barberId, date, durationMin, key, tick])

  // Carregando enquanto o resultado guardado não é desta combinação.
  const fresh = result.key === key
  return {
    data: fresh ? result.data : null,
    error: fresh ? result.error : null,
    loading: Boolean(key) && !fresh,
    reload: () => setTick((value) => value + 1),
  }
}

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'

type State<T> = { data: T | null; error: string | null; loading: boolean }

/** Carrega um recurso assíncrono e expõe `reload` e `mutate` para atualizar em memória. */
export function useResource<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((previous) => ({ ...previous, loading: true, error: null }))
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof ApiError ? error.message : 'Não foi possível carregar. Tente de novo.'
        setState((previous) => ({ data: previous.data, error: message, loading: false }))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((value) => value + 1), [])
  const mutate = useCallback((updater: T | ((current: T) => T)) => {
    setState((previous) => {
      if (previous.data === null && typeof updater === 'function') return previous
      const next = typeof updater === 'function' ? (updater as (current: T) => T)(previous.data as T) : updater
      return { ...previous, data: next }
    })
  }, [])

  return { ...state, reload, mutate }
}

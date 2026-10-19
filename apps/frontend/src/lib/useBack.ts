import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Volta no histórico quando há para onde voltar. Em aba nova ou link direto
 * (primeira entrada do app), vai para `fallback` no lugar de não fazer nada.
 */
export function useBack(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(() => {
    const isFirstEntry = location.key === 'default' || window.history.length <= 1
    if (isFirstEntry) navigate(fallback, { replace: true })
    else navigate(-1)
  }, [navigate, location.key, fallback])
}

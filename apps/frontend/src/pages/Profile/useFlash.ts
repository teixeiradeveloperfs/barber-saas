import { useCallback, useEffect, useRef, useState } from 'react'

/** Mensagem curta de confirmação que some sozinha. */
export function useFlash(duration = 3200) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const flash = useCallback(
    (text: string) => {
      window.clearTimeout(timer.current)
      setMessage(text)
      timer.current = window.setTimeout(() => setMessage(null), duration)
    },
    [duration],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { message, flash }
}

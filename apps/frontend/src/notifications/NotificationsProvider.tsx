import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAppointments } from '../appointments/useAppointments'
import { useGamification } from '../gamification/useGamification'
import { useUser } from '../user/useUser'
import { deriveNotifications } from './derive'
import { NotificationsContext } from './notifications-context'

const STORAGE_KEY = 'luxe-cuts:notifications'

type Stored = { read: string[]; dismissed: string[] }

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { read: [], dismissed: [] }
    const parsed = JSON.parse(raw) as Partial<Stored>
    return { read: parsed.read ?? [], dismissed: parsed.dismissed ?? [] }
  } catch {
    return { read: [], dismissed: [] }
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { upcoming } = useAppointments()
  const { state: loyalty } = useGamification()
  const { user } = useUser()
  const [stored, setStored] = useState<Stored>(readStored)
  // Referência de "agora" fixa por montagem: mantém o render puro.
  const [now] = useState(() => Date.now())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // sem storage, segue só em memória
    }
  }, [stored])

  const notifications = useMemo(
    () =>
      deriveNotifications({ upcoming, loyalty, prefs: user.notifications, now }).filter(
        (item) => !stored.dismissed.includes(item.id),
      ),
    [upcoming, loyalty, user.notifications, now, stored.dismissed],
  )

  const isRead = useCallback((id: string) => stored.read.includes(id), [stored.read])

  const markRead = useCallback((id: string) => {
    setStored((current) =>
      current.read.includes(id) ? current : { ...current, read: [...current.read, id] },
    )
  }, [])

  const markAllRead = useCallback(() => {
    setStored((current) => ({
      ...current,
      read: Array.from(new Set([...current.read, ...notifications.map((item) => item.id)])),
    }))
  }, [notifications])

  const dismiss = useCallback((id: string) => {
    setStored((current) => ({ ...current, dismissed: [...current.dismissed, id] }))
  }, [])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !stored.read.includes(item.id)).length,
      isRead,
      markRead,
      markAllRead,
      dismiss,
    }),
    [notifications, stored.read, isRead, markRead, markAllRead, dismiss],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

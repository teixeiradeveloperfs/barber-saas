import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { seedUser } from './seed'
import { UserContext, type NotificationPrefs, type User } from './user-context'

const STORAGE_KEY = 'luxe-cuts:user'

function readStoredUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedUser
    const stored = JSON.parse(raw) as Partial<User>
    return {
      ...seedUser,
      ...stored,
      notifications: { ...seedUser.notifications, ...(stored.notifications ?? {}) },
    }
  } catch {
    return seedUser
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(readStoredUser)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } catch {
      // foto muito grande ou storage bloqueado: segue só em memória
    }
  }, [user])

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((state) => ({ ...state, ...patch }))
  }, [])

  const updateNotifications = useCallback((patch: Partial<NotificationPrefs>) => {
    setUser((state) => ({ ...state, notifications: { ...state.notifications, ...patch } }))
  }, [])

  const startFresh = useCallback(({ name, email }: { name: string; email: string }) => {
    setUser({
      name: name.trim(),
      email: email.trim(),
      phone: '',
      avatar: '',
      memberSince: new Date().toISOString(),
      appointments: 0,
      notifications: { reminders: true, news: true, whatsapp: false },
      onboardingDone: false,
    })
  }, [])

  const completeOnboarding = useCallback(() => {
    setUser((state) => (state.onboardingDone ? state : { ...state, onboardingDone: true }))
  }, [])

  const resetUser = useCallback(() => {
    setUser(seedUser)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // sem storage, nada a limpar
    }
  }, [])

  const value = useMemo(
    () => ({ user, updateUser, updateNotifications, resetUser, startFresh, completeOnboarding }),
    [user, updateUser, updateNotifications, resetUser, startFresh, completeOnboarding],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

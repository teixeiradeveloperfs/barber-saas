import { createContext } from 'react'

export type NotificationKind = 'agenda' | 'pontos' | 'clube' | 'novidade'

export type AppNotification = {
  /** Estável entre renders: mesma origem, mesmo id. */
  id: string
  kind: NotificationKind
  title: string
  body: string
  /** Rota aberta ao tocar. */
  to: string
  date: string
}

export type NotificationsContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  isRead: (id: string) => boolean
  markRead: (id: string) => void
  markAllRead: () => void
  dismiss: (id: string) => void
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null)

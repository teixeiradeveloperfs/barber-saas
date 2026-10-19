import { createContext } from 'react'

export type NotificationPrefs = {
  /** Aviso 2 horas antes do horário marcado. */
  reminders: boolean
  /** Novidades e promoções da barbearia. */
  news: boolean
  /** Confirmações e lembretes também pelo WhatsApp. */
  whatsapp: boolean
}

export type User = {
  name: string
  email: string
  phone: string
  /** URL ou data URL da foto. Vazio usa as iniciais. */
  avatar: string
  memberSince: string
  appointments: number
  notifications: NotificationPrefs
  /** Já passou pelo tour inicial. Conta nova começa em false. */
  onboardingDone: boolean
}

export type UserContextValue = {
  user: User
  updateUser: (patch: Partial<User>) => void
  updateNotifications: (patch: Partial<NotificationPrefs>) => void
  /** Volta ao usuário de exemplo. Usado ao sair e ao excluir a conta. */
  resetUser: () => void
  /** Cliente recém-cadastrado: perfil limpo, tour pendente. */
  startFresh: (input: { name: string; email: string }) => void
  completeOnboarding: () => void
}

export const UserContext = createContext<UserContextValue | null>(null)

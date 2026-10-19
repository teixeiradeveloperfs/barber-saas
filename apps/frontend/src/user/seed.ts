import { currentUser } from '../data/home'
import type { User } from './user-context'

/** Usuário de exemplo até o backend existir. */
export const seedUser: User = {
  name: currentUser.name,
  email: 'rafael.costa@exemplo.com',
  phone: '(11) 98765-4321',
  avatar: currentUser.avatar,
  memberSince: '2025-03-14',
  appointments: 12,
  notifications: { reminders: true, news: false, whatsapp: true },
  onboardingDone: true,
}

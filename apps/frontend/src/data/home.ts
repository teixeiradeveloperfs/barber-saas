import type { Barber } from '@barber/tenant-config'
import { getTenant } from '../tenant/active'

export type { Barber }

/** Usuário de exemplo até o backend existir. Não é dado do tenant. */
export const currentUser = {
  name: 'Rafael Costa',
  avatar: '/images/avatar.jpg',
}

/** Equipe da barbearia do tenant ativo. */
export function getBarbers(): Barber[] {
  return getTenant().barbers
}

const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatRating(value: number) {
  return decimal.format(value)
}

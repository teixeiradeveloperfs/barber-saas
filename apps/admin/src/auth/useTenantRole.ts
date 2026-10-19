import type { MemberRole } from '../api/admin'
import { useAuth } from './useAuth'

export type TenantRole = 'PLATAFORMA' | MemberRole

/** Papel do usuário logado nesta barbearia. Plataforma manda como dono. */
export function useTenantRole(installationId: string): TenantRole {
  const { admin, isPlatform } = useAuth()
  if (isPlatform) return 'PLATAFORMA'
  return admin?.tenants.find((tenant) => tenant.id === installationId)?.role ?? 'BARBEIRO'
}

/** Dono ou plataforma: controla marca, equipe, domínios, publicação e acessos. */
export function isOwnerRole(role: TenantRole) {
  return role === 'PLATAFORMA' || role === 'DONO'
}

/** Dono, gestor ou plataforma: opera a agenda inteira. */
export function isManagerRole(role: TenantRole) {
  return isOwnerRole(role) || role === 'GESTOR'
}

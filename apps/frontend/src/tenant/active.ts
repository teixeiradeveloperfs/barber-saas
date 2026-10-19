import type { AppConfig } from '@barber/tenant-config'

/**
 * Tenant ativo nesta sessão. Um domínio = um tenant, então um singleton
 * basta e deixa os helpers puros (getBarber, getService...) sem contexto.
 * O TenantProvider define antes de renderizar qualquer tela.
 */
let active: AppConfig | null = null

export function setActiveTenant(config: AppConfig) {
  active = config
}

export function getTenant(): AppConfig {
  if (!active) throw new Error('Tenant ainda não carregado. Envolva o app em <TenantProvider>.')
  return active
}

export function hasActiveTenant() {
  return active !== null
}

const LAST_TENANT_KEY = 'barber-admin:agenda-tenant'

/** Última barbearia aberta na agenda, para /agenda cair nela de novo. */
export function rememberAgendaTenant(id: string) {
  try {
    localStorage.setItem(LAST_TENANT_KEY, id)
  } catch {
    // sem storage, tudo bem
  }
}

export function lastAgendaTenant() {
  try {
    return localStorage.getItem(LAST_TENANT_KEY)
  } catch {
    return null
  }
}

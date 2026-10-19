/**
 * Origem da visita: `utm_*` da URL (última vale), guardada no navegador para
 * seguir a pessoa até o clique no WhatsApp, mesmo depois de rolar e voltar.
 */

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>

const UTM_STORE = 'sua-barbearia:lp:utm'
const SESSION_STORE = 'sua-barbearia:lp:sessao'
let memorySession: string | null = null

function read(store: Storage, key: string) {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

function write(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value)
  } catch {
    // sem storage (privado/bloqueado), a origem vale só nesta página
  }
}

/** Lê os `utm_*` da URL; com algum presente, substitui o que estava guardado. */
export function captureUtm(): Utm {
  const params = new URLSearchParams(window.location.search)
  const fromUrl: Utm = {}
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim()
    if (value) fromUrl[key] = value.slice(0, 120)
  }
  if (Object.keys(fromUrl).length > 0) {
    write(localStorage, UTM_STORE, JSON.stringify(fromUrl))
    return fromUrl
  }
  try {
    const stored = read(localStorage, UTM_STORE)
    return stored ? (JSON.parse(stored) as Utm) : {}
  } catch {
    return {}
  }
}

/** Id da sessão do navegador (aba), para contar uma visita por sessão. */
export function sessionId() {
  const stored = read(sessionStorage, SESSION_STORE)
  if (stored) return stored
  if (!memorySession) {
    memorySession = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g, '').slice(0, 24)
    write(sessionStorage, SESSION_STORE, memorySession)
  }
  return memorySession
}

/** Linha curta para a mensagem do WhatsApp: "Origem: instagram / cpc / setembro". */
export function originLabel(utm: Utm) {
  const parts = [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? `Origem: ${parts.join(' / ')}` : null
}

const REF_STORE = 'sua-barbearia:lp:parceiro'
const REF_DAYS = 90

/** `?ref=CODIGO` do link de parceiro: vale por 90 dias neste navegador e vai junto na compra. */
export function captureRef() {
  const code = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase()
  if (code && /^[A-Z0-9]{4,24}$/.test(code)) write(localStorage, REF_STORE, JSON.stringify({ code, at: Date.now() }))
}

export function currentRef(): string | null {
  try {
    const stored = read(localStorage, REF_STORE)
    if (!stored) return null
    const { code, at } = JSON.parse(stored) as { code: string; at: number }
    return Date.now() - at < REF_DAYS * 86_400_000 ? code : null
  } catch {
    return null
  }
}

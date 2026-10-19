import { parseAppConfig, type AppConfig } from '@barber/tenant-config'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const TIMEOUT_MS = 4000

/** Por que o tenant não carregou: decide a tela mostrada ao cliente. */
export type TenantErrorKind = 'sem-barbearia' | 'nao-publicado' | 'api-indisponivel'

export class TenantError extends Error {
  readonly kind: TenantErrorKind

  constructor(kind: TenantErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

/** Token emitido pelo admin para abrir o rascunho da instalação única. */
function previewToken() {
  return new URLSearchParams(window.location.search).get('preview')
}

/**
 * Carrega a configuração da única instalação. O endereço nunca escolhe outra
 * barbearia.
 */
export async function resolveTenant(): Promise<AppConfig> {
  if (!API_URL) throw new TenantError('api-indisponivel', 'VITE_API_URL não configurada.')

  const preview = previewToken()
  const url = new URL(`${API_URL}/public/tenant`, window.location.origin)
  if (preview) url.searchParams.set('preview', preview)

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { accept: 'application/json' } })
  } catch (error) {
    throw new TenantError('api-indisponivel', error instanceof Error ? error.message : String(error))
  } finally {
    window.clearTimeout(timer)
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    const message = body?.message ?? `API respondeu ${response.status}`
    if (response.status === 404) {
      throw new TenantError(/publicou/.test(message) ? 'nao-publicado' : 'sem-barbearia', message)
    }
    throw new TenantError('api-indisponivel', message)
  }

  const payload = (await response.json()) as { config: unknown; draft?: boolean }
  if (payload.draft) document.documentElement.dataset.preview = 'draft'
  return parseAppConfig(payload.config)
}

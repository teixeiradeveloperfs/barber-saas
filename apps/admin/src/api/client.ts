const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '')
const TOKEN_KEY = 'barber-admin:token'

export type ApiIssue = { path: string; message: string }

export class ApiError extends Error {
  readonly status: number
  readonly issues: ApiIssue[]

  constructor(status: number, message: string, issues: ApiIssue[] = []) {
    super(message)
    this.status = status
    this.issues = issues
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // sem storage, a sessão dura só esta aba
  }
}

let onUnauthorized: (() => void) | null = null
export function handleUnauthorized(callback: () => void) {
  onUnauthorized = callback
}

/** fetch com token, JSON e erros normalizados (ApiError com issues do zod). */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('accept', 'application/json')
  const token = getToken()
  if (token) headers.set('authorization', `Bearer ${token}`)
  let body = init.body
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(init.json)
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, body })
  if (response.status === 204) return undefined as T
  const text = await response.text()
  const data = text ? (JSON.parse(text) as unknown) : null

  if (!response.ok) {
    const payload = (data ?? {}) as { message?: string | string[]; issues?: ApiIssue[] }
    const message = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message ?? `Erro ${response.status}`
    if (response.status === 401 && !path.startsWith('/admin/auth/login')) onUnauthorized?.()
    throw new ApiError(response.status, message, payload.issues ?? [])
  }
  return data as T
}

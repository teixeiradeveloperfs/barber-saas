const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly issues: { path: string; message: string }[]

  constructor(status: number, message: string, issues: { path: string; message: string }[] = []) {
    super(message)
    this.status = status
    this.issues = issues
  }
}

/* ---------- sessão do cliente ---------- */

function tokenKey() {
  return 'barber:cliente-token'
}

export function getCustomerToken() {
  try {
    return localStorage.getItem(tokenKey())
  } catch {
    return null
  }
}

export function setCustomerToken(token: string | null) {
  try {
    if (token) localStorage.setItem(tokenKey(), token)
    else localStorage.removeItem(tokenKey())
  } catch {
    // sem storage, a sessão vive só nesta aba
  }
}

let onUnauthorized: (() => void) | null = null
/** Sessão de cliente recusada pela API (expirou, outra barbearia): quem cuida é o provider de auth. */
export function handleCustomerUnauthorized(callback: () => void) {
  onUnauthorized = callback
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const url = new URL(`${API_URL}${path}`, window.location.origin)
  const headers = new Headers(init.headers)
  headers.set('accept', 'application/json')
  const token = getCustomerToken()
  if (token && !headers.has('authorization')) headers.set('authorization', `Bearer ${token}`)
  let body = init.body
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(init.json)
  }
  let response: Response
  try {
    response = await fetch(url, { ...init, headers, body })
  } catch {
    throw new ApiError(0, 'Sem conexão com a barbearia. Confira sua internet e tente de novo.')
  }
  const text = await response.text()
  const data = text ? (JSON.parse(text) as unknown) : null
  if (!response.ok) {
    const payload = (data ?? {}) as { message?: string | string[]; issues?: { path: string; message: string }[] }
    const message = Array.isArray(payload.message) ? payload.message.join(', ') : (payload.message ?? `Erro ${response.status}`)
    // 401 com token guardado: a sessão do cliente não vale mais.
    if (response.status === 401 && token && !path.startsWith('/public/auth/login') && !path.startsWith('/public/auth/register') && !path.startsWith('/public/auth/recover')) onUnauthorized?.()
    throw new ApiError(response.status, message, payload.issues ?? [])
  }
  return data as T
}

/* ---------- agenda ---------- */

export type SlotReason = 'passou' | 'ocupado' | 'bloqueado'
export type Slot = { time: string; available: boolean; reason?: SlotReason }
export type SlotsResponse = {
  date: string
  barberId: string
  /** Agenda do barbeiro aberta para novas reservas. */
  open: boolean
  /** Barbearia fechada neste dia da semana. */
  closed: boolean
  closedReason?: string | null
  slots: Slot[]
}

export type ServerStatus = 'MARCADO' | 'CONFIRMADO' | 'CONCLUIDO' | 'FALTOU' | 'CANCELADO'

export type ServerAppointment = {
  id: string
  barberId: string
  serviceIds: string[]
  coveredServiceIds: string[]
  customer: { name: string; phone: string }
  customerId?: string | null
  startsAt: string
  endsAt: string
  date: string
  time: string
  durationMin: number
  total: number
  status: ServerStatus
  cancelCode: string
  createdAt: string
  /** Desconto de recompensa (indicação) já abatido do total. */
  discount?: number
  rewardLabel?: string | null
}

export const agendaApi = {
  slots: (barberId: string, date: string, durationMin: number) =>
    api<SlotsResponse>(`/public/agenda/slots?barber=${encodeURIComponent(barberId)}&date=${date}&duration=${durationMin}`),
  /** Logado, `customer` é opcional: a API usa a conta. */
  book: (input: { barberId: string; serviceIds: string[]; coveredServiceIds: string[]; date: string; time: string; customer?: { name: string; phone: string }; rewardId?: string }) =>
    api<ServerAppointment>('/public/agenda/appointments', { method: 'POST', json: input }),
  mine: () => api<ServerAppointment[]>('/public/agenda/mine'),
  cancelMine: (id: string) => api<ServerAppointment>(`/public/agenda/mine/${encodeURIComponent(id)}/cancel`, { method: 'POST' }),
  byCode: (code: string) => api<ServerAppointment>(`/public/agenda/appointments/${encodeURIComponent(code)}`),
  cancel: (code: string) => api<ServerAppointment>(`/public/agenda/appointments/${encodeURIComponent(code)}/cancel`, { method: 'POST' }),
}

/* ---------- conta do cliente ---------- */

export type OtpChannel = 'WHATSAPP' | 'SMS'
export type OtpPurpose = 'CADASTRO' | 'LOGIN' | 'RECUPERACAO'

export type OtpSent = {
  sent: true
  channel: OtpChannel
  /** Dígitos com DDI, como a API guardou. */
  phone: string
  phoneMasked: string
  expiresInSeconds: number
  retryInSeconds: number
  /** Só em desenvolvimento sem provedor de SMS/WhatsApp. */
  devCode?: string
}

export type CustomerProfile = {
  id: string
  name: string
  phone: string | null
  phoneMasked: string
  email: string | null
  hasPassword: boolean
  createdAt: string
}

export type CustomerSession = { token: string; customer: CustomerProfile }

export const authApi = {
  requestCode: (phone: string, channel: OtpChannel, purpose: OtpPurpose) =>
    api<OtpSent>('/public/auth/otp', { method: 'POST', json: { phone, channel, purpose } }),
  register: (input: { name: string; email: string; password: string; phone?: string; referralCode?: string }) =>
    api<CustomerSession>('/public/auth/register', { method: 'POST', json: input }),
  loginPassword: (email: string, password: string) => api<CustomerSession>('/public/auth/login', { method: 'POST', json: { email, password } }),
  loginCode: (phone: string, code: string) => api<CustomerSession>('/public/auth/login-code', { method: 'POST', json: { phone, code } }),
  recover: (phone: string, code: string, newPassword: string) =>
    api<CustomerSession>('/public/auth/recover', { method: 'POST', json: { phone, code, newPassword } }),
  me: () => api<CustomerProfile>('/public/auth/me'),
  updateMe: (input: { name?: string; email?: string | null; phone?: string | null }) => api<CustomerProfile>('/public/auth/me', { method: 'PATCH', json: input }),
  changePassword: (current: string | undefined, next: string) => api<{ ok: true }>('/public/auth/password', { method: 'PATCH', json: { current, next } }),
}

/* ---------- indicação (indique e ganhe) ---------- */

export type CustomerReward = { id: string; label: string; source: 'INDICOU' | 'INDICADO'; kind: 'desconto_percentual' | 'desconto_valor' | 'servico_gratis'; value: number; serviceId: string | null; expiresAt: string | null }
export type ReferralMe = {
  enabled: boolean
  headline: string
  code: string
  youGet: string | null
  friendGets: string | null
  referrals: { name: string; status: 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA'; createdAt: string; completedAt: string | null }[]
  rewards: CustomerReward[]
}

/** Estimativa do desconto de uma recompensa (a API recalcula ao reservar). Espelha `rewardDiscount` do backend. */
export function rewardDiscount(reward: CustomerReward, lines: { id: string; price: number; covered: boolean }[], total: number): { discount: number; error: string | null } {
  if (total <= 0) return { discount: 0, error: 'Este agendamento já não tem nada a pagar.' }
  const round = (value: number) => Math.round(value * 100) / 100
  if (reward.kind === 'desconto_percentual') return { discount: round(Math.min(total, (total * Math.min(100, reward.value)) / 100)), error: null }
  if (reward.kind === 'desconto_valor') return { discount: round(Math.min(total, reward.value)), error: null }
  const line = lines.find((item) => item.id === reward.serviceId && !item.covered)
  if (!line) return { discount: 0, error: 'Adicione o serviço da recompensa para usar.' }
  return { discount: round(Math.min(total, line.price)), error: null }
}

export const referralsApi = {
  me: () => api<ReferralMe>('/public/referrals/me'),
  preview: (code: string) => api<{ referrerName: string; reward: string | null; headline: string }>(`/public/referrals/code/${encodeURIComponent(code)}`),
}

/** Código de indicação que veio no link (?indicacao=), guardado até o cadastro. */
function referralKey() {
  return 'barber:indicacao'
}

export function captureReferralCode() {
  const code = new URLSearchParams(window.location.search).get('indicacao')?.trim().toUpperCase()
  if (!code || !/^[A-Z0-9]{4,20}$/.test(code)) return
  try {
    localStorage.setItem(referralKey(), code)
  } catch {
    // sem storage, vale só nesta visita pela URL
  }
}

export function pendingReferralCode() {
  try {
    return localStorage.getItem(referralKey()) ?? new URLSearchParams(window.location.search).get('indicacao')?.toUpperCase() ?? null
  } catch {
    return new URLSearchParams(window.location.search).get('indicacao')?.toUpperCase() ?? null
  }
}

export function clearReferralCode() {
  try {
    localStorage.removeItem(referralKey())
  } catch {
    // nada a limpar
  }
}

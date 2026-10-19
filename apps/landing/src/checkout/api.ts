const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')

export type CheckoutMethod = 'PIX_AUTOMATICO' | 'CARTAO'
export type CheckoutStatus = 'AGUARDANDO_PAGAMENTO' | 'PAGO' | 'CONCLUIDO' | 'FALHOU' | 'EXPIRADO'

export type CheckoutView = {
  id: string
  status: CheckoutStatus
  method: CheckoutMethod
  shopName: string
  email: string
  priceCents: number
  founder: boolean
  pix: { payload: string; image: string | null; expiresAt: string | null } | null
  error: string | null
  accessLink: string | null
}

export type CheckoutInput = {
  name: string
  email: string
  phone: string
  document: string
  shopName: string
  method: CheckoutMethod
  card?: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string; postalCode: string; addressNumber: string }
  utm?: Record<string, string> | null
  ref?: string | null
  website?: string
}

export class CheckoutError extends Error {
  readonly issues: { path: string; message: string }[]
  constructor(message: string, issues: { path: string; message: string }[] = []) {
    super(message)
    this.issues = issues
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new CheckoutError('Checkout indisponível agora. Fale com a gente no WhatsApp.')
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers: { accept: 'application/json', ...(init?.body ? { 'content-type': 'application/json' } : {}) } })
  } catch {
    throw new CheckoutError('Sem conexão. Confira a internet e tente de novo.')
  }
  const data = (await response.json().catch(() => null)) as (T & { message?: string | string[]; issues?: { path: string; message: string }[] }) | null
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message
    throw new CheckoutError(message || 'Não foi possível continuar. Tente de novo.', data?.issues ?? [])
  }
  return data as T
}

export const startCheckout = (input: CheckoutInput) => request<CheckoutView>('/platform/checkout', { method: 'POST', body: JSON.stringify(input) })
export const checkoutStatus = (id: string) => request<CheckoutView>(`/platform/checkout/${encodeURIComponent(id)}`)

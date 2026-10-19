import type { AppConfig } from '@barber/tenant-config'
import { api } from './client'

export type TenantStatus = 'ATIVO' | 'SUSPENSO' | 'ENCERRADO'
export type AdminRole = 'PLATAFORMA' | 'BARBEARIA'
/** Papel dentro de uma barbearia. */
export type MemberRole = 'DONO' | 'GESTOR' | 'BARBEIRO'
export type AdminUserStatus = 'ATIVO' | 'SUSPENSO'

export type TenantRef = { id: string; slug: string; name: string; status: TenantStatus }
/** Barbearia vinculada a um usuário, com o papel dele nela. */
export type TenantLink = TenantRef & { role: MemberRole; barberId: string | null }

/** Quem está logado. */
export type AdminProfile = {
  id: string
  email: string
  name: string
  role: AdminRole
  mustChangePassword: boolean
  /** Programa de parceiros: nulo quando ainda não entrou. */
  affiliate?: 'ATIVO' | 'SUSPENSO' | null
  /** Barbearias com vínculo (vazio para a plataforma, que vê todas). */
  tenants: TenantLink[]
}

export type AdminUser = {
  id: string
  email: string
  name: string
  role: AdminRole
  status: AdminUserStatus
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
  tenants: TenantLink[]
}

export type TenantMember = {
  id: string
  email: string
  name: string
  role: AdminRole
  memberRole: MemberRole
  barberId: string | null
  status: AdminUserStatus
  lastLoginAt: string | null
  since: string
}

/** Resultado de vincular um dono: se `created`, a senha temporária vem uma única vez. */
export type MemberResult = Omit<TenantMember, 'since' | 'lastLoginAt'> & { created: boolean; temporaryPassword?: string }
export type DomainKind = 'SUBDOMINIO' | 'PROPRIO'
export type DomainStatus = 'PENDENTE_DNS' | 'VERIFICANDO' | 'ATIVO' | 'ERRO'

export type DnsRecord = { type: 'A' | 'CNAME' | 'TXT'; name: string; value: string; note?: string }

export type TenantDomain = {
  id: string
  hostname: string
  kind: DomainKind
  status: DomainStatus
  cloudflareId: string | null
  dnsInstructions: DnsRecord[] | null
  verifiedAt: string | null
  createdAt: string
}

export type AccessPeek = { name: string; email: string; tenant: { id: string; name: string } | null; firstAccess: boolean }

export type ReferralSummary = {
  total: number
  done: number
  rewardsUsed: number
  recent: { id: string; referrer: string; referred: string; status: 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA'; createdAt: string; completedAt: string | null }[]
}

export type TenantOverview = {
  date: string
  today: { total: number; confirmados: number; concluidos: number; faltas: number; cancelados: number; expected: number }
  revenue: { month: number; monthCount: number; previousMonth: number; previousCount: number }
  upcoming: { id: string; date: string; time: string; barberId: string; barberName: string; customerName: string; services: string[]; status: AppointmentStatus; total: number }[]
  barbers: { id: string; name: string; image: string; open: boolean; closedReason: string | null; today: number }[]
  customers: { total: number; newThisMonth: number }
  publication: { publishedVersion: number | null; publishedAt: string | null; hasDraft: boolean }
}

export type ConfigVersion = { version: number; config: AppConfig; at: string }
export type ConfigState = { published: ConfigVersion | null; draft: ConfigVersion | null }

export type TenantDetail = {
  id: string
  slug: string
  name: string
  status: TenantStatus
  createdAt: string
  updatedAt: string
  domains: TenantDomain[]
  configs: ConfigState
  freeHostname: string
}

/** Site da plataforma (landing): contato, app modelo e tracking. Só quem opera a plataforma edita. */
export type LandingSettings = {
  whatsapp: string | null
  demoUrl: string | null
  metaPixelId: string | null
  googleTagId: string | null
  googleAdsConversion: string | null
}

export type LandingSourceRow = { source: string; medium: string | null; campaign: string | null; visitas: number; contatos: number; demos: number }
export type LandingStats = {
  days: number
  since: string
  totals: { visitas: number; contatos: number; demos: number }
  bySource: LandingSourceRow[]
  byDay: { day: string; visitas: number; contatos: number }[]
}

export type PlatformSettings = {
  platformDomain: string
  fallbackHost: string | null
  defaultTenant: TenantRef | null
  landing: LandingSettings
  updatedAt: string
}

export type AppointmentStatus = 'MARCADO' | 'CONFIRMADO' | 'CONCLUIDO' | 'FALTOU' | 'CANCELADO'

export type Appointment = {
  id: string
  barberId: string
  serviceIds: string[]
  coveredServiceIds: string[]
  customer: { name: string; phone: string }
  startsAt: string
  endsAt: string
  /** Data e hora locais da barbearia. */
  date: string
  time: string
  durationMin: number
  total: number
  /** Desconto de recompensa de indicação já abatido do total. */
  discount?: number
  rewardLabel?: string | null
  status: AppointmentStatus
  source: 'APP' | 'PAINEL'
  notes: string | null
  cancelCode: string
  cancelledAt: string | null
  createdAt: string
  /** Cliente respondeu ao lembrete do WhatsApp confirmando que vai. */
  customerConfirmedAt?: string | null
}

export type WhatsappStatus = 'DESCONECTADO' | 'CONECTANDO' | 'AGUARDANDO_QR' | 'CONECTADO' | 'FALHOU'
export type WhatsappConnection = {
  /** A plataforma tem o serviço de WhatsApp ligado. */
  available: boolean
  status: WhatsappStatus
  phone: string | null
  name: string | null
  connectedAt: string | null
  lastError: string | null
}
/** Avisos ativos. Reserva feita e confirmação saíram para poupar o número. */
export type NotificationEvent = 'LEMBRETE' | 'CLIENTE_CONFIRMOU' | 'CANCELADO' | 'CONCLUIDO' | 'FALTOU'
export type NotificationTemplate = {
  event: NotificationEvent
  enabled: boolean
  text: string
  /** Só no lembrete: minutos antes do horário. */
  offsetMin: number | null
  /** A barbearia mudou o padrão. */
  custom: boolean
  defaultText: string
}
export type TemplateVariable = { key: string; label: string; example: string }
export type WhatsappMessage = {
  id: string
  /** Pode vir um aviso que não existe mais (reserva feita, confirmação). */
  event: NotificationEvent | 'AGENDADO' | 'CONFIRMADO' | null
  phone: string
  text: string
  status: 'PENDENTE' | 'ENVIADO' | 'FALHOU'
  error: string | null
  appointmentId: string | null
  createdAt: string
}

export type AgendaBlock = {
  id: string
  barberId: string | null
  startsAt: string
  endsAt: string
  reason: string | null
  createdAt: string
}

export type TeamBarber = {
  slug: string
  name: string
  tier: 'Pro' | 'Novo' | null
  rating: number
  reviews: number
  specialties: string[]
  nextAvailable: { label: string; today: boolean }
  image: string
  /** Afastado ou desligado: fora do app, sem novas reservas. */
  active: boolean
  position: number
  createdAt: string
}

export type TeamBarberInput = {
  slug?: string
  name: string
  tier?: 'Pro' | 'Novo' | null
  rating?: number
  reviews?: number
  specialties?: string[]
  nextAvailable?: { label: string; today: boolean }
  image?: string
  active?: boolean
}

export type MediaSource = 'UPLOAD' | 'LINK'

export type MediaAsset = {
  id: string
  /** Nulo: biblioteca da plataforma, visível para todas as barbearias. */
  installationId: string | null
  name: string
  url: string
  source: MediaSource
  mime: string | null
  size: number | null
  width: number | null
  height: number | null
  /** A URL aparece no config (rascunho ou publicado) ou na foto de um barbeiro. */
  inUse: boolean
  createdAt: string
}

export type MediaLibrary = { own: MediaAsset[]; platform: MediaAsset[] }

/** Form do upload: o nome vai antes do arquivo para a API ler junto. */
function mediaForm(file: File, name?: string) {
  const form = new FormData()
  if (name) form.append('name', name)
  form.append('file', file, file.name)
  return form
}

export type BarberAgendaState = { id: string; name: string; image: string; open: boolean; closedReason: string | null }

export type AgendaSlot = { time: string; available: boolean; reason?: 'passou' | 'ocupado' | 'bloqueado' }
export type AgendaSlots = { date: string; barberId: string; open: boolean; closed: boolean; closedReason?: string | null; slots: AgendaSlot[] }

export type NewAppointmentInput = {
  barberId: string
  serviceIds: string[]
  date: string
  time: string
  customer: { name: string; phone: string }
  notes?: string
}

export const adminApi = {
  whatsapp: (_id: string) => api<WhatsappConnection>('/admin/installation/whatsapp'),
  whatsappConnect: (_id: string) => api<WhatsappConnection>('/admin/installation/whatsapp/connect', { method: 'POST' }),
  whatsappQr: (_id: string) => api<{ image: string }>('/admin/installation/whatsapp/qr'),
  whatsappPairingCode: (_id: string, phone: string) => api<{ code: string }>('/admin/installation/whatsapp/pairing-code', { method: 'POST', json: { phone } }),
  whatsappDisconnect: (_id: string) => api<WhatsappConnection>('/admin/installation/whatsapp/disconnect', { method: 'POST' }),
  whatsappTemplates: (_id: string) =>
    api<{ items: NotificationTemplate[]; variables: TemplateVariable[]; reminderOptions: number[] }>('/admin/installation/whatsapp/templates'),
  saveWhatsappTemplate: (_id: string, event: NotificationEvent, input: { enabled: boolean; text: string; offsetMin?: number | null }) =>
    api<NotificationTemplate>(`/admin/installation/whatsapp/templates/${event}`, { method: 'PUT', json: input }),
  resetWhatsappTemplate: (_id: string, event: NotificationEvent) => api<NotificationTemplate>(`/admin/installation/whatsapp/templates/${event}`, { method: 'DELETE' }),
  whatsappTest: (_id: string, input: { phone: string; event?: NotificationEvent }) =>
    api<{ status: 'ENVIADO' | 'FALHOU' | 'PENDENTE'; error: string | null }>('/admin/installation/whatsapp/test', { method: 'POST', json: input }),
  whatsappMessages: (_id: string) => api<WhatsappMessage[]>('/admin/installation/whatsapp/messages'),
  listTeam: (_id: string) => api<TeamBarber[]>('/admin/installation/team'),
  createBarber: (_id: string, input: TeamBarberInput) => api<TeamBarber>('/admin/installation/team', { method: 'POST', json: input }),
  updateBarber: (_id: string, slug: string, input: Partial<Omit<TeamBarberInput, 'slug'>>) =>
    api<TeamBarber>(`/admin/installation/team/${encodeURIComponent(slug)}`, { method: 'PATCH', json: input }),
  removeBarber: (_id: string, slug: string) => api<{ ok: true }>(`/admin/installation/team/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  reorderTeam: (_id: string, order: string[]) => api<TeamBarber[]>('/admin/installation/team/order', { method: 'PUT', json: { order } }),
  agendaSlots: (_id: string, barberId: string, date: string, duration: number) =>
    api<AgendaSlots>(`/admin/installation/agenda/slots?barber=${encodeURIComponent(barberId)}&date=${date}&duration=${duration}`),
  listAppointments: (_id: string, params: { from: string; to: string; barberId?: string; status?: AppointmentStatus }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to })
    if (params.barberId) query.set('barber', params.barberId)
    if (params.status) query.set('status', params.status)
    return api<Appointment[]>(`/admin/installation/agenda/appointments?${query}`)
  },
  createAppointment: (_id: string, input: NewAppointmentInput) =>
    api<Appointment>('/admin/installation/agenda/appointments', { method: 'POST', json: input }),
  updateAppointment: (_id: string, appointmentId: string, input: { status?: AppointmentStatus; notes?: string }) =>
    api<Appointment>(`/admin/installation/agenda/appointments/${appointmentId}`, { method: 'PATCH', json: input }),
  listBlocks: (_id: string, from: string, to: string) => api<AgendaBlock[]>(`/admin/installation/agenda/blocks?from=${from}&to=${to}`),
  addBlock: (_id: string, input: { barberId: string | null; date: string; from: string; to: string; reason?: string }) =>
    api<AgendaBlock>('/admin/installation/agenda/blocks', { method: 'POST', json: input }),
  removeBlock: (_id: string, blockId: string) => api<{ ok: true }>(`/admin/installation/agenda/blocks/${blockId}`, { method: 'DELETE' }),
  agendaBarbers: (_id: string) => api<BarberAgendaState[]>('/admin/installation/agenda/barbers'),
  setBarberAgenda: (_id: string, barberId: string, input: { open: boolean; reason?: string }) =>
    api<{ barberId: string; open: boolean; closedReason: string | null }>(`/admin/installation/agenda/barbers/${encodeURIComponent(barberId)}`, { method: 'PUT', json: input }),

  listMedia: (_id: string) => api<MediaLibrary>('/admin/installation/media'),
  uploadMedia: (_id: string, file: File, name?: string) => api<MediaAsset>('/admin/installation/media', { method: 'POST', body: mediaForm(file, name) }),
  addMediaLink: (_id: string, url: string, name?: string) => api<MediaAsset>('/admin/installation/media/links', { method: 'POST', json: { url, name } }),
  renameMedia: (_id: string, assetId: string, name: string) => api<MediaAsset>(`/admin/installation/media/${assetId}`, { method: 'PATCH', json: { name } }),
  removeMedia: (_id: string, assetId: string) => api<{ ok: true }>(`/admin/installation/media/${assetId}`, { method: 'DELETE' }),
  listPlatformMedia: () => api<MediaAsset[]>('/admin/media'),
  uploadPlatformMedia: (file: File, name?: string) => api<MediaAsset>('/admin/media', { method: 'POST', body: mediaForm(file, name) }),
  addPlatformMediaLink: (url: string, name?: string) => api<MediaAsset>('/admin/media/links', { method: 'POST', json: { url, name } }),
  renamePlatformMedia: (assetId: string, name: string) => api<MediaAsset>(`/admin/media/${assetId}`, { method: 'PATCH', json: { name } }),
  removePlatformMedia: (assetId: string) => api<{ ok: true }>(`/admin/media/${assetId}`, { method: 'DELETE' }),

  login: (email: string, password: string) =>
    api<{ token: string; admin: Omit<AdminProfile, 'tenants'> }>('/admin/auth/login', {
      method: 'POST',
      json: { email, password },
    }),
  me: () => api<AdminProfile>('/admin/auth/me'),
  peekAccess: (token: string) => api<AccessPeek>(`/admin/auth/access/${encodeURIComponent(token)}`),
  redeemAccess: (token: string, password: string) => api<{ token: string; admin: Omit<AdminProfile, 'tenants'>; installationId: string | null }>('/admin/auth/access', { method: 'POST', json: { token, password } }),
  forgotPassword: (email: string) => api<{ ok: true }>('/admin/auth/forgot', { method: 'POST', json: { email } }),
  changePassword: (current: string, next: string) =>
    api<{ ok: true }>('/admin/auth/password', { method: 'PATCH', json: { current, next } }),

  listMembers: (_id: string) => api<TenantMember[]>('/admin/installation/members'),
  addMember: (_id: string, input: { email: string; name?: string; role?: MemberRole; barberId?: string | null }) =>
    api<MemberResult>('/admin/installation/members', { method: 'POST', json: input }),
  updateMember: (_id: string, userId: string, input: { role: MemberRole; barberId?: string | null }) =>
    api<TenantMember>(`/admin/installation/members/${userId}`, { method: 'PATCH', json: input }),
  resetMemberPassword: (_id: string, userId: string) => api<{ temporaryPassword: string }>(`/admin/installation/members/${userId}/reset-password`, { method: 'POST' }),
  removeMember: (_id: string, userId: string) => api<{ ok: true }>(`/admin/installation/members/${userId}`, { method: 'DELETE' }),
  tenantOverview: (_id: string) => api<TenantOverview>('/admin/installation/overview'),
  referralSummary: (_id: string) => api<ReferralSummary>('/admin/installation/referrals'),

  getTenant: (_id: string) =>
    api<TenantDetail>('/admin/installation').then((tenant) => {
      rememberAssetHost(tenant)
      return tenant
    }),
  updateTenant: (_id: string, input: { name?: string; status?: TenantStatus }) =>
    api<TenantDetail>('/admin/installation', { method: 'PATCH', json: input }),

  getConfig: (_id: string) => api<ConfigState>('/admin/installation/config'),
  saveDraft: (_id: string, config: AppConfig) =>
    api<ConfigVersion>('/admin/installation/config/draft', { method: 'PUT', json: config }),
  publish: (_id: string) => api<ConfigState>('/admin/installation/config/publish', { method: 'POST' }),
  discardDraft: (_id: string) => api<ConfigState>('/admin/installation/config/draft', { method: 'DELETE' }),
  previewToken: (_id: string) =>
    api<{ token: string; slug: string; expiresInSeconds: number }>('/admin/installation/preview-token', {
      method: 'POST',
    }),

}

/**
 * Onde o app do cliente mora. A instalação é única, portanto não há slug ou
 * query string para escolher outra barbearia.
 */
const DEV_FRONTEND = (import.meta.env.VITE_FRONTEND_URL ?? '').trim().replace(/\/$/, '')
let assetHost: string | null = null

type TenantHosts = Pick<TenantDetail, 'slug' | 'freeHostname' | 'domains'>

/** Host principal da barbearia: primeiro domínio próprio ativo, senão o subdomínio grátis. */
export function primaryHost(tenant: TenantHosts) {
  return tenant.domains.find((domain) => domain.kind === 'PROPRIO' && domain.status === 'ATIVO')?.hostname ?? tenant.freeHostname
}

/** Guarda um host que serve o build do app, para resolver imagens relativas (/images/...) em produção. */
function rememberAssetHost(tenant: TenantHosts) {
  assetHost = tenant.freeHostname
}

/** URL do app do cliente mostrando o rascunho da instalação. */
export function previewUrl(tenant: TenantHosts, token: string) {
  if (DEV_FRONTEND) return `${DEV_FRONTEND}/?preview=${encodeURIComponent(token)}`
  return `https://${primaryHost(tenant)}/?preview=${encodeURIComponent(token)}`
}

/** Imagens do config são caminhos do app do cliente (/images/...) ou URLs absolutas. */
export function assetUrl(path: string | undefined) {
  if (!path) return undefined
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  const base = DEV_FRONTEND || (assetHost ? `https://${assetHost}` : '')
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

/** URL pública do app do cliente. */
export function publicUrl(tenant: TenantHosts) {
  if (DEV_FRONTEND) return `${DEV_FRONTEND}/`
  return `https://${primaryHost(tenant)}/`
}

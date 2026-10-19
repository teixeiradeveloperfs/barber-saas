import type { AdminRole, AdminUserStatus, AppointmentStatus, MemberRole, TenantStatus } from '../api/admin'

const dateTime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const dateOnly = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return dateTime.format(new Date(value)).replace('.', '')
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return dateOnly.format(new Date(value)).replace('.', '')
}

export const tenantStatusLabel: Record<TenantStatus, string> = {
  ATIVO: 'Ativa',
  SUSPENSO: 'Suspensa',
  ENCERRADO: 'Encerrada',
}

/** Transforma "Barbearia do Zé" em "barbearia-do-ze". */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente de novo.') {
  return error instanceof Error && error.message ? error.message : fallback
}

export const roleLabel: Record<AdminRole, string> = {
  PLATAFORMA: 'Plataforma',
  BARBEARIA: 'Barbearia',
}

export const memberRoleLabel: Record<MemberRole, string> = {
  DONO: 'Dono',
  GESTOR: 'Gestor',
  BARBEIRO: 'Barbeiro',
}

export const userStatusLabel: Record<AdminUserStatus, string> = {
  ATIVO: 'Ativo',
  SUSPENSO: 'Suspenso',
}

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  MARCADO: 'Agendado',
  CONFIRMADO: 'Agendado',
  CONCLUIDO: 'Atendido',
  FALTOU: 'Faltou',
  CANCELADO: 'Cancelado',
}

/** "2026-09-18" no fuso local da barbearia → "quinta, 18 de set". */
export function formatDayLabel(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const value = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }).format(value).replace('.', '')
}

/** Data de hoje como "YYYY-MM-DD" no relógio do navegador. */
export function todayKey(offsetDays = 0) {
  const value = new Date()
  value.setDate(value.getDate() + offsetDays)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function shiftDay(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number)
  const value = new Date(y, m - 1, d + days)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

/** 5511987654321 → (11) 98765-4321 */
export function formatPhone(digits: string) {
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return digits
}

export function whatsappLink(digits: string) {
  const withCountry = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${withCountry}`
}

const brlCents = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 2 })
export function formatPrice(value: number) {
  return Number.isInteger(value) ? brl.format(value) : brlCents.format(value)
}

/** Centavos da API → "R$ 149,90" (sempre com centavos, é dinheiro cobrado). */
export function formatCents(cents: number) {
  return brlCents.format(cents / 100)
}

const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
/** "2026-09" → "set 2026". */
export function formatMonth(key: string) {
  const [year, month] = key.split('-').map(Number)
  return monthFormat.format(new Date(year, month - 1, 1)).replace('.', '')
}

/** Mês atual como "AAAA-MM" no relógio do navegador. */
export function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

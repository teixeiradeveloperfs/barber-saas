import type { Appointment } from '../appointments/appointments-context'
import { formatTime, relativeDay } from '../appointments/format'
import { getBarber, getService } from '../data/barbers'
import { formatPoints, isClubEnabled, loyaltyRules } from '../data/gamification'
import type { GamificationState } from '../gamification/gamification-context'
import { getPlan, isSubscriptionActive } from '../gamification/plan'
import type { NotificationPrefs } from '../user/user-context'
import type { AppNotification } from './notifications-context'

const DAY = 86_400_000

type Sources = {
  upcoming: Appointment[]
  loyalty: GamificationState
  prefs: NotificationPrefs
  now: number
}

/** Monta as notificações a partir do estado do app. Sem backend, é isto. */
export function deriveNotifications({ upcoming, loyalty, prefs, now }: Sources): AppNotification[] {
  const list: AppNotification[] = []

  // Agenda: próximos 7 dias
  for (const appointment of upcoming) {
    const when = new Date(appointment.date).getTime()
    if (when - now > 7 * DAY) continue
    const barber = getBarber(appointment.barberId)
    const services = appointment.serviceIds
      .map((id) => getService(id)?.name)
      .filter(Boolean)
      .join(' + ')
    const rel = relativeDay(appointment.date)
    list.push({
      id: `agenda-${appointment.id}`,
      kind: 'agenda',
      title: rel === 'hoje' || rel === 'amanhã' ? `Seu corte é ${rel}` : `Corte confirmado ${rel}`,
      body: `${formatTime(appointment.date)} com ${barber?.name ?? 'seu barbeiro'} · ${services}`,
      to: '/agendamentos',
      date: appointment.createdAt,
    })
  }

  const rewardsOn = loyaltyRules().enabled

  // Pontos: últimos movimentos (só com Recompensas ligadas)
  for (const event of rewardsOn ? loyalty.events.slice(0, 3) : []) {
    if (event.kind === 'corte') continue
    list.push({
      id: `pontos-${event.id}`,
      kind: 'pontos',
      title: event.points > 0 ? `+${formatPoints(event.points)} pontos` : `${formatPoints(event.points)} pontos`,
      body: event.label,
      to: '/recompensas',
      date: event.date,
    })
  }

  // Clube: renovação ou término
  const sub = loyalty.subscription
  const plan = getPlan(sub?.planId)
  if (sub && plan && isSubscriptionActive(sub, now)) {
    const days = Math.ceil((new Date(sub.renewsAt).getTime() - now) / DAY)
    if (days <= 20) {
      list.push({
        id: `clube-${sub.renewsAt}-${sub.status}`,
        kind: 'clube',
        title:
          sub.status === 'cancelada'
            ? `Seu plano termina em ${days} ${days === 1 ? 'dia' : 'dias'}`
            : `Plano ${plan.name} renova em ${days} ${days === 1 ? 'dia' : 'dias'}`,
        body:
          sub.status === 'cancelada'
            ? 'Reative para continuar com os créditos do Clube.'
            : rewardsOn
              ? `Renovar antes garante o ciclo e credita +${loyaltyRules().renewalBonus} pontos.`
              : 'Renovar antes garante o próximo ciclo.',
        to: '/clube',
        date: new Date(now - 2 * DAY).toISOString(),
      })
    }
  } else if (prefs.news && isClubEnabled()) {
    list.push({
      id: 'clube-convite',
      kind: 'clube',
      title: 'Cortes do mês inclusos a partir de R$ 59',
      body: 'Conheça o Clube Luxe. Sem fidelidade.',
      to: '/clube',
      date: new Date(now - 5 * DAY).toISOString(),
    })
  }

  // Selos: perto do corte grátis
  const STAMPS_PER_CARD = loyaltyRules().stampsPerCard
  const missing = STAMPS_PER_CARD - loyalty.stamps
  if (rewardsOn && missing <= 3) {
    list.push({
      id: `selos-${loyalty.stamps}`,
      kind: 'pontos',
      title: missing === 1 ? 'Falta 1 corte para o grátis' : `Faltam ${missing} cortes para o grátis`,
      body: `${loyalty.stamps} de ${STAMPS_PER_CARD} selos no cartão fidelidade.`,
      to: '/recompensas',
      date: new Date(now - 3 * DAY).toISOString(),
    })
  }

  // Novidades (só com a preferência ligada)
  if (prefs.news) {
    list.push({
      id: 'novidade-hidratacao',
      kind: 'novidade',
      title: 'Hidratação entrou no catálogo',
      body: 'Máscara e massagem no couro cabeludo, 15 min, R$ 20.',
      to: '/servicos',
      date: new Date(now - 6 * DAY).toISOString(),
    })
  }

  return list.sort((a, b) => b.date.localeCompare(a.date))
}

/** "agora", "há 3h", "ontem", "há 5 dias" */
export function relativeTime(iso: string, now = Date.now()) {
  const diff = now - new Date(iso).getTime()
  if (diff < 60_000) return 'agora'
  if (diff < 3_600_000) return `há ${Math.floor(diff / 60_000)} min`
  if (diff < DAY) return `há ${Math.floor(diff / 3_600_000)}h`
  const days = Math.floor(diff / DAY)
  if (days === 1) return 'ontem'
  return `há ${days} dias`
}

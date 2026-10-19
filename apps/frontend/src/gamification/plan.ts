import { getPlans, type Credits, type Plan } from '../data/gamification'
import { getService, type Service } from '../data/barbers'
import type { Subscription } from './gamification-context'

export function getPlan(id: string | undefined): Plan | null {
  return getPlans().find((plan) => plan.id === id) ?? null
}

/** Assinatura que ainda dá direito a benefícios (ativa, ou cancelada dentro do ciclo pago). */
export function isSubscriptionActive(subscription: Subscription | null, now = Date.now()) {
  if (!subscription) return false
  if (subscription.status === 'ativa') return true
  return new Date(subscription.renewsAt).getTime() > now
}

function left(total: Credits, used: number): Credits {
  return total === 'ilimitado' ? 'ilimitado' : Math.max(0, total - used)
}

export type CreditsLeft = {
  cabelo: Credits
  barba: Credits
  extras: string[]
}

/** Créditos restantes no ciclo atual. */
export function creditsLeft(subscription: Subscription, plan: Plan): CreditsLeft {
  return {
    cabelo: left(plan.covers.cabelo, subscription.used.cabelo),
    barba: left(plan.covers.barba, subscription.used.barba),
    extras: plan.covers.extras.filter((id) => !subscription.used.extras.includes(id)),
  }
}

export type Coverage = {
  coveredIds: string[]
  toPay: number
}

/** Combos consomem um crédito de cabelo e um de barba. */
function needs(service: Service): { cabelo: number; barba: number; extra?: string } {
  if (service.category === 'cabelo') return { cabelo: 1, barba: 0 }
  if (service.category === 'barba') return { cabelo: 0, barba: 1 }
  if (service.category === 'combos') {
    return { cabelo: 1, barba: 1, extra: service.id === 'combo-completo' ? 'sobrancelha' : undefined }
  }
  return { cabelo: 0, barba: 0, extra: service.id }
}

function take(credits: Credits, amount: number): { ok: boolean; next: Credits } {
  if (credits === 'ilimitado') return { ok: true, next: 'ilimitado' }
  if (credits >= amount) return { ok: true, next: credits - amount }
  return { ok: false, next: credits }
}

/** Quais dos serviços escolhidos o plano cobre agora, e quanto sobra para pagar. */
export function coverageFor(serviceIds: string[], subscription: Subscription | null): Coverage {
  const services = serviceIds
    .map((id) => getService(id))
    .filter((service): service is Service => Boolean(service))
  const total = services.reduce((sum, service) => sum + service.price, 0)
  const plan = subscription ? getPlan(subscription.planId) : null
  if (!subscription || !plan || !isSubscriptionActive(subscription)) {
    return { coveredIds: [], toPay: total }
  }

  let remaining = creditsLeft(subscription, plan)
  const coveredIds: string[] = []
  let toPay = 0
  for (const service of services) {
    const need = needs(service)
    const cabelo = take(remaining.cabelo, need.cabelo)
    const barba = take(remaining.barba, need.barba)
    const extraOk = need.extra ? remaining.extras.includes(need.extra) : true
    if (cabelo.ok && barba.ok && extraOk) {
      coveredIds.push(service.id)
      remaining = {
        cabelo: cabelo.next,
        barba: barba.next,
        extras: need.extra ? remaining.extras.filter((id) => id !== need.extra) : remaining.extras,
      }
    } else {
      toPay += service.price
    }
  }
  return { coveredIds, toPay }
}

export function formatCredits(value: Credits) {
  return value === 'ilimitado' ? 'Ilimitado' : String(value)
}

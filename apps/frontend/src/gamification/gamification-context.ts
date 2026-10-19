import { createContext } from 'react'

export type PointEventKind = 'corte' | 'renovacao' | 'avaliacao' | 'indicacao' | 'resgate' | 'bonus'

export type PointEvent = {
  id: string
  date: string
  label: string
  points: number
  kind: PointEventKind
}

export type Voucher = {
  id: string
  rewardId: string
  name: string
  code: string
  createdAt: string
  used: boolean
}

export type SubscriptionUsage = {
  cabelo: number
  barba: number
  /** Ids dos extras já usados neste ciclo. */
  extras: string[]
}

export type Subscription = {
  planId: string
  startedAt: string
  renewsAt: string
  renewals: number
  used: SubscriptionUsage
  /** `cancelada` mantém os benefícios até `renewsAt` e não renova. */
  status: 'ativa' | 'cancelada'
}

export type GamificationState = {
  /** Saldo disponível para trocar. */
  points: number
  /** Total acumulado na vida, define o nível. */
  lifetimePoints: number
  /** Selos no cartão atual (0 até STAMPS_PER_CARD - 1). */
  stamps: number
  /** Cortes grátis conquistados e ainda não usados. */
  freeCuts: number
  totalCuts: number
  streakMonths: number
  ratings: number
  referrals: number
  barbersVisited: string[]
  events: PointEvent[]
  vouchers: Voucher[]
  /** null = cliente avulso, paga por serviço. */
  subscription: Subscription | null
}

export type GamificationContextValue = {
  state: GamificationState
  /** Troca pontos por uma recompensa. Devolve o voucher ou null se faltar saldo. */
  redeem: (rewardId: string) => Voucher | null
  /** Renova o plano atual: estende a data, zera os créditos e paga o bônus. */
  renewPlan: () => void
  changePlan: (planId: string) => void
  /** Entra no Clube com o plano escolhido e ganha o bônus de boas-vindas. */
  subscribe: (planId: string) => void
  /** Marca para não renovar. Benefícios seguem até o fim do ciclo. */
  cancelSubscription: () => void
  reactivateSubscription: () => void
  /** Consome créditos do ciclo ao confirmar um agendamento coberto. */
  consumeCredits: (serviceIds: string[]) => void
  markVoucherUsed: (voucherId: string) => void
  /** Avaliação de atendimento: +20 pontos e conta para a conquista. */
  registerRating: (label: string) => void
  /** Zera para o estado de exemplo. */
  reset: () => void
  /** Cliente novo: zero pontos, sem plano, sem histórico. */
  startFresh: () => void
}

export const GamificationContext = createContext<GamificationContextValue | null>(null)

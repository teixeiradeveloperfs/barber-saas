import type { GamificationState } from './gamification-context'

const day = 24 * 60 * 60 * 1000

function daysAgo(days: number) {
  return new Date(Date.now() - days * day).toISOString()
}

function daysAhead(days: number) {
  return new Date(Date.now() + days * day).toISOString()
}

/** Cliente de exemplo: nível Ouro, 7 selos, plano Completo com 4 renovações. */
export const seedState: GamificationState = {
  points: 1240,
  lifetimePoints: 2180,
  stamps: 7,
  freeCuts: 0,
  totalCuts: 17,
  streakMonths: 4,
  ratings: 3,
  referrals: 0,
  barbersVisited: ['tony', 'andre'],
  events: [
    { id: 'e1', date: daysAgo(2), label: 'Corte + barba com Tony Barbosa', points: 33, kind: 'corte' },
    { id: 'e2', date: daysAgo(9), label: 'Avaliação do atendimento', points: 20, kind: 'avaliacao' },
    { id: 'e3', date: daysAgo(12), label: 'Renovação do plano Completo', points: 200, kind: 'renovacao' },
    { id: 'e4', date: daysAgo(16), label: 'Degradê com André Ferreira', points: 22, kind: 'corte' },
    { id: 'e5', date: daysAgo(30), label: 'Resgate: barba grátis', points: -300, kind: 'resgate' },
    { id: 'e6', date: daysAgo(33), label: 'Corte clássico com Tony Barbosa', points: 18, kind: 'corte' },
  ],
  vouchers: [],
  subscription: {
    planId: 'completo',
    startedAt: daysAgo(132),
    renewsAt: daysAhead(18),
    renewals: 4,
    used: { cabelo: 2, barba: 1, extras: [] },
    status: 'ativa',
  },
}

/** Cliente recém-cadastrado: tudo zerado e avulso. */
export const freshState: GamificationState = {
  points: 0,
  lifetimePoints: 0,
  stamps: 0,
  freeCuts: 0,
  totalCuts: 0,
  streakMonths: 0,
  ratings: 0,
  referrals: 0,
  barbersVisited: [],
  events: [],
  vouchers: [],
  subscription: null,
}

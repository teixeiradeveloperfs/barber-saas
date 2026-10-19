import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getPlans, getRewards, loyaltyRules } from '../data/gamification'
import { getService } from '../data/barbers'
import { getPlan } from './plan'
import { GamificationContext, type GamificationState, type Voucher } from './gamification-context'
import { freshState, seedState } from './seed'

const STORAGE_KEY = 'luxe-cuts:gamification'

function readStored(): GamificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedState
    const stored = JSON.parse(raw) as Partial<GamificationState> & {
      subscription?: (Partial<GamificationState['subscription']> & { cutsUsed?: number }) | null
    }
    const merged = { ...seedState, ...stored } as GamificationState
    // Formato antigo da assinatura (cutsUsed) vira o novo (used por tipo).
    const sub = stored.subscription
    if (sub && !('used' in sub && sub.used)) {
      merged.subscription = {
        ...seedState.subscription!,
        ...sub,
        used: { cabelo: sub.cutsUsed ?? 0, barba: 0, extras: [] },
        status: 'ativa',
      } as GamificationState['subscription']
    }
    return merged
  } catch {
    return seedState
  }
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function voucherCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LX-'
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

function addDays(iso: string, days: number) {
  const base = new Date(iso)
  const start = base.getTime() > Date.now() ? base : new Date()
  start.setDate(start.getDate() + days)
  return start.toISOString()
}

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState>(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage bloqueado: segue só em memória
    }
  }, [state])

  const redeem = useCallback(
    (rewardId: string): Voucher | null => {
      const reward = getRewards().find((item) => item.id === rewardId)
      if (!reward || state.points < reward.cost) return null
      const voucher: Voucher = {
        id: id('v'),
        rewardId,
        name: reward.name,
        code: voucherCode(),
        createdAt: new Date().toISOString(),
        used: false,
      }
      setState((current) => ({
        ...current,
        points: current.points - reward.cost,
        vouchers: [voucher, ...current.vouchers],
        events: [
          {
            id: id('e'),
            date: voucher.createdAt,
            label: `Resgate: ${reward.name.toLowerCase()}`,
            points: -reward.cost,
            kind: 'resgate',
          },
          ...current.events,
        ],
      }))
      return voucher
    },
    [state.points],
  )

  const renewPlan = useCallback(() => {
    setState((current) => {
      if (!current.subscription) return current
      const plan = getPlan(current.subscription.planId) ?? getPlans()[0]
      const RENEWAL_BONUS = loyaltyRules().renewalBonus
      return {
        ...current,
        points: current.points + RENEWAL_BONUS,
        lifetimePoints: current.lifetimePoints + RENEWAL_BONUS,
        subscription: {
          ...current.subscription,
          renewsAt: addDays(current.subscription.renewsAt, 30),
          used: { cabelo: 0, barba: 0, extras: [] },
          renewals: current.subscription.renewals + 1,
          status: 'ativa',
        },
        events: [
          {
            id: id('e'),
            date: new Date().toISOString(),
            label: `Renovação do plano ${plan.name}`,
            points: RENEWAL_BONUS,
            kind: 'renovacao',
          },
          ...current.events,
        ],
      }
    })
  }, [])

  const changePlan = useCallback((planId: string) => {
    if (!getPlan(planId)) return
    setState((current) =>
      current.subscription
        ? { ...current, subscription: { ...current.subscription, planId } }
        : current,
    )
  }, [])

  const subscribe = useCallback((planId: string) => {
    const plan = getPlan(planId)
    if (!plan) return
    setState((current) => {
      if (current.subscription) return current
      const now = new Date()
      const WELCOME_BONUS = loyaltyRules().welcomeBonus
      return {
        ...current,
        points: current.points + WELCOME_BONUS,
        lifetimePoints: current.lifetimePoints + WELCOME_BONUS,
        subscription: {
          planId,
          startedAt: now.toISOString(),
          renewsAt: addDays(now.toISOString(), 30),
          renewals: 0,
          used: { cabelo: 0, barba: 0, extras: [] },
          status: 'ativa',
        },
        events: [
          {
            id: id('e'),
            date: now.toISOString(),
            label: `Boas-vindas ao Clube: plano ${plan.name}`,
            points: WELCOME_BONUS,
            kind: 'bonus',
          },
          ...current.events,
        ],
      }
    })
  }, [])

  const cancelSubscription = useCallback(() => {
    setState((current) =>
      current.subscription
        ? { ...current, subscription: { ...current.subscription, status: 'cancelada' } }
        : current,
    )
  }, [])

  const reactivateSubscription = useCallback(() => {
    setState((current) =>
      current.subscription
        ? { ...current, subscription: { ...current.subscription, status: 'ativa' } }
        : current,
    )
  }, [])

  const consumeCredits = useCallback((serviceIds: string[]) => {
    setState((current) => {
      if (!current.subscription) return current
      const used = { ...current.subscription.used, extras: [...current.subscription.used.extras] }
      for (const serviceId of serviceIds) {
        const service = getService(serviceId)
        if (!service) continue
        if (service.category === 'cabelo') used.cabelo += 1
        else if (service.category === 'barba') used.barba += 1
        else if (service.category === 'combos') {
          used.cabelo += 1
          used.barba += 1
          if (service.id === 'combo-completo') used.extras.push('sobrancelha')
        } else used.extras.push(service.id)
      }
      return { ...current, subscription: { ...current.subscription, used } }
    })
  }, [])

  const markVoucherUsed = useCallback((voucherId: string) => {
    setState((current) => ({
      ...current,
      vouchers: current.vouchers.map((voucher) =>
        voucher.id === voucherId ? { ...voucher, used: true } : voucher,
      ),
    }))
  }, [])

  const registerRating = useCallback((label: string) => {
    setState((current) => ({
      ...current,
      points: current.points + 20,
      lifetimePoints: current.lifetimePoints + 20,
      ratings: current.ratings + 1,
      events: [
        { id: id('e'), date: new Date().toISOString(), label, points: 20, kind: 'avaliacao' },
        ...current.events,
      ],
    }))
  }, [])

  const startFresh = useCallback(() => {
    setState(freshState)
  }, [])

  const reset = useCallback(() => {
    setState(seedState)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // nada a limpar
    }
  }, [])

  const value = useMemo(
    () => ({
      state,
      redeem,
      renewPlan,
      changePlan,
      subscribe,
      cancelSubscription,
      reactivateSubscription,
      consumeCredits,
      markVoucherUsed,
      registerRating,
      reset,
      startFresh,
    }),
    [
      state,
      redeem,
      renewPlan,
      changePlan,
      subscribe,
      cancelSubscription,
      reactivateSubscription,
      consumeCredits,
      markVoucherUsed,
      registerRating,
      reset,
      startFresh,
    ],
  )

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>
}

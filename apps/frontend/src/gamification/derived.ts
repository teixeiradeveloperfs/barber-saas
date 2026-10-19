import {
  getAchievementDefs,
  levelFor,
  loyaltyRules,
  nextLevelFor,
  type AchievementDef,
} from '../data/gamification'
import type { GamificationState } from './gamification-context'

export type Achievement = AchievementDef & {
  progress: number
  unlocked: boolean
}

/** Progresso de cada conquista a partir do estado. */
export function achievementsFrom(state: GamificationState): Achievement[] {
  const progressById: Record<string, number> = {
    primeiro: state.totalCuts,
    casa: state.totalCuts,
    fiel: state.subscription?.renewals ?? 0,
    sequencia3: state.streakMonths,
    sequencia6: state.streakMonths,
    explorador: state.barbersVisited.length,
    critico: state.ratings,
    embaixador: state.referrals,
  }
  return getAchievementDefs().map((def) => {
    const progress = Math.min(def.target, progressById[def.id] ?? 0)
    return { ...def, progress, unlocked: progress >= def.target }
  })
}

export function levelProgress(state: GamificationState) {
  const current = levelFor(state.lifetimePoints)
  const next = nextLevelFor(state.lifetimePoints)
  const span = next ? next.min - current.min : 1
  const done = next ? state.lifetimePoints - current.min : span
  return {
    current,
    next,
    ratio: Math.min(1, done / span),
    missing: next ? next.min - state.lifetimePoints : 0,
  }
}

export function stampsMissing(state: GamificationState) {
  return loyaltyRules().stampsPerCard - state.stamps
}

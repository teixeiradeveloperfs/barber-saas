import type {
  AchievementDef,
  Credits,
  EarnRule,
  Level,
  LevelId,
  Plan,
  Reward,
} from '@barber/tenant-config'
import { getTenant } from '../tenant/active'

export type { AchievementDef, Credits, EarnRule, Level, LevelId, Plan, Reward }

/** Números do programa de fidelidade do tenant ativo. */
export function loyaltyRules() {
  const { loyalty } = getTenant()
  return {
    enabled: loyalty.enabled,
    stampsPerCard: loyalty.stampsPerCard,
    renewalBonus: loyalty.renewalBonus,
    welcomeBonus: loyalty.welcomeBonus,
    pointsPerCovered: loyalty.pointsPerCovered,
  }
}

/** Programa de recompensas (pontos, selos, níveis, catálogo e conquistas) ligado no painel. */
export function isLoyaltyEnabled() {
  return getTenant().loyalty.enabled
}

export function getLevels(): Level[] {
  return getTenant().loyalty.levels
}

export function getRewards(): Reward[] {
  return getTenant().loyalty.rewards
}

export function getEarnRules(): EarnRule[] {
  return getTenant().loyalty.earnRules
}

export function getAchievementDefs(): AchievementDef[] {
  return getTenant().loyalty.achievements
}

export function getPlans(): Plan[] {
  return getTenant().club.plans
}

export function getClubPerks() {
  return getTenant().club.perks
}

export function getClubName() {
  return getTenant().club.name
}

export function isClubEnabled() {
  return getTenant().club.enabled
}

const integer = new Intl.NumberFormat('pt-BR')

export function formatPoints(value: number) {
  return integer.format(value)
}

export function levelFor(lifetimePoints: number): Level {
  const levels = getLevels()
  return [...levels].reverse().find((level) => lifetimePoints >= level.min) ?? levels[0]
}

export function nextLevelFor(lifetimePoints: number): Level | null {
  return getLevels().find((level) => level.min > lifetimePoints) ?? null
}

import { createContext, useContext } from 'react'

/** O que o painel define para o site: contato, app modelo e IDs de tracking. */
export type LandingSettings = {
  whatsapp: string | null
  demoUrl: string | null
  metaPixelId: string | null
  googleTagId: string | null
  googleAdsConversion: string | null
}

/** Plano único e oferta de sócio fundador, vindos do painel. */
export type PublicPlan = {
  name: string
  priceCents: number
  trialDays: number
  founder: { open: boolean; priceCents: number; slotsLeft: number | null; until: string | null }
  /** Checkout próprio ligado (Asaas configurado). Sem ele, comprar vai para o WhatsApp. */
  checkout: boolean
}

/** Até a API responder: o plano de lançamento, sem prometer vaga de fundador. */
export const DEFAULT_PLAN: PublicPlan = {
  name: 'Sua Barbearia Completo',
  priceCents: 35000,
  trialDays: 0,
  founder: { open: false, priceCents: 35000, slotsLeft: null, until: null },
  checkout: false,
}

export type Links = {
  admin: string
  demo: string
  contact: string
  contactLabel: string
}

export type SettingsValue = { settings: LandingSettings; links: Links; plan: PublicPlan }

export const SettingsContext = createContext<SettingsValue | null>(null)

export function useLinks(): Links {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useLinks precisa estar dentro de <SettingsProvider>')
  return value.links
}

/** Onde o botão de comprar leva: o checkout próprio, ou o WhatsApp enquanto ele não está ligado. */
export function useBuyLink(): { href: string; external: boolean } {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useBuyLink precisa estar dentro de <SettingsProvider>')
  return value.plan.checkout ? { href: '/assinar', external: false } : { href: value.links.contact, external: true }
}

export function usePlan(): PublicPlan {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('usePlan precisa estar dentro de <SettingsProvider>')
  return value.plan
}

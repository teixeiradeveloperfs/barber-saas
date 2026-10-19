import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_PLAN, SettingsContext, type LandingSettings, type Links, type PublicPlan } from './settings-context'
import { initTracking, recordVisit } from './tracking'
import { captureUtm, originLabel } from './utm'

const env = import.meta.env
const API_URL = (env.VITE_API_URL ?? '').trim().replace(/\/$/, '')
const MESSAGE = 'Olá! Quero o Sua Barbearia na minha barbearia.'
// A origem vai junto na mensagem: quem atende no WhatsApp já sabe de onde a pessoa veio.
const origin = originLabel(captureUtm())
const messageWithOrigin = origin ? `${MESSAGE} ${origin}` : MESSAGE

/** Valores do ambiente, usados até a API responder (ou se ela não responder). */
const fallback: LandingSettings = {
  whatsapp: (env.VITE_CONTACT_WHATSAPP ?? '').replace(/\D/g, '') || null,
  demoUrl: (env.VITE_DEMO_URL ?? '').trim() || null,
  metaPixelId: null,
  googleTagId: null,
  googleAdsConversion: null,
}

function linksFrom(settings: LandingSettings): Links {
  return {
    admin: (env.VITE_ADMIN_URL ?? '').trim() || '#',
    demo: settings.demoUrl ?? '#',
    // Sem número, o wa.me abre o WhatsApp para a pessoa escolher o contato.
    contact: `https://wa.me/${settings.whatsapp ?? ''}?text=${encodeURIComponent(messageWithOrigin)}`,
    contactLabel: 'Falar no WhatsApp',
  }
}

function merge(base: LandingSettings, remote: Partial<LandingSettings>): LandingSettings {
  const pick = (key: keyof LandingSettings) => {
    const value = remote[key]
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : base[key]
  }
  return {
    whatsapp: pick('whatsapp'),
    demoUrl: pick('demoUrl'),
    metaPixelId: pick('metaPixelId'),
    googleTagId: pick('googleTagId'),
    googleAdsConversion: pick('googleAdsConversion'),
  }
}

/** Busca os ajustes públicos da plataforma e liga o tracking quando os IDs chegam. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LandingSettings>(fallback)
  const [plan, setPlan] = useState<PublicPlan>(DEFAULT_PLAN)

  useEffect(() => {
    if (!API_URL) return
    const controller = new AbortController()
    fetch(`${API_URL}/platform/landing`, { signal: controller.signal, headers: { accept: 'application/json' } })
      .then((response) => (response.ok ? (response.json() as Promise<Partial<LandingSettings> & { plan?: PublicPlan }>) : null))
      .then((remote) => {
        if (!remote) return
        setSettings((current) => merge(current, remote))
        if (remote.plan && typeof remote.plan.priceCents === 'number') setPlan(remote.plan)
      })
      .catch(() => {
        // Sem API, a página segue com os valores do ambiente.
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    recordVisit()
  }, [])

  useEffect(() => {
    initTracking(settings)
  }, [settings])

  const value = useMemo(() => ({ settings, links: linksFrom(settings), plan }), [settings, plan])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}


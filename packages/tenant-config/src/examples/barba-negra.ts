import type { AppConfigInput } from '../schema.js'
import { luxeCuts } from './luxe-cuts.js'

/**
 * Segundo tenant de exemplo, para provar o multi-tenant em dev:
 * mesma equipe e catálogo, outra marca, outra cor, sem accentHi/Lo
 * (derivados por color-mix), Clube desligado, sem login Google.
 */
export const barbaNegra: AppConfigInput = {
  ...luxeCuts,
  id: 'barba-negra',
  name: 'Barba Negra',
  domains: ['barba-negra.localhost'],
  brand: {
    logo: { kind: 'wordmark', first: 'Barba', second: 'Negra' },
    faviconUrl: '/favicon.svg',
    photos: { hero: '/images/barbers/andre.jpg', auth: '/images/auth.jpg' },
    theme: {
      dark: { accent: '#d97757', onAccent: '#1a0f0a' },
      light: { accent: '#b4532f', onAccent: '#ffffff' },
    },
  },
  copy: {
    splashHeadline: 'Barba feita, cabelo no ponto. Marque seu horário.',
    splashCta: 'Agendar agora',
    homeTitle: 'Bora cortar, {nome}?',
    homeSubtitle: 'Equipe pronta. Escolha o barbeiro e o horário que encaixa no seu dia.',
    authClaim: 'A barbearia do bairro, agora no seu bolso.',
    searchPlaceholder: 'Buscar na Barba Negra...',
  },
  contact: {
    phone: '(21) 3344-5566',
    whatsapp: '5521998877665',
    instagram: 'barbanegra.rj',
  },
  address: {
    street: 'Rua Dias Ferreira, 78',
    district: 'Leblon',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zip: '22431-050',
    lat: -22.9847,
    lng: -43.2254,
  },
  parking: undefined,
  club: { ...luxeCuts.club, enabled: false, name: 'Clube Barba Negra' },
  features: { pwa: true, googleLogin: false, installBanner: true },
}

import type { AppConfigInput } from '../schema.js'
import { luxeCuts } from './luxe-cuts.js'

/**
 * Barbearia padrão da plataforma: é o que aparece no domínio da própria
 * Sua Barbearia (e no fallback) quando o host não é de nenhuma barbearia. Vitrine
 * com a identidade da plataforma; equipe, catálogo, fidelidade e textos
 * legais herdados do exemplo. A identidade padrão é nativa no app.
 */
export const barberOs: AppConfigInput = {
  ...luxeCuts,
  id: 'barberos',
  name: 'Sua Barbearia',
  domains: [],
  brand: {
    logo: {
      kind: 'wordmark',
      first: 'Sua',
      second: 'Barbearia',
    },
    faviconUrl: '/favicon.svg',
    photos: { hero: '/hero.jpg', auth: '/images/auth.jpg' },
    theme: {
      dark: { accent: '#e2d3a8', accentHi: '#eee3c4', accentLo: '#d8c59a', onAccent: '#141312' },
      light: { accent: '#b3955a', accentHi: '#e8d9ae', accentLo: '#cdb77f', onAccent: '#141312' },
    },
  },
  copy: {
    splashHeadline: 'Seu corte, no seu horário. Agende em segundos.',
    splashCta: 'Começar',
    homeTitle: 'Bem-vindo à sua barbearia, {nome}.',
    homeSubtitle: 'Escolha o barbeiro, veja os horários livres e agende sem ligar.',
    authClaim: 'A barbearia inteira no seu bolso.',
    searchPlaceholder: 'Buscar barbeiros, cortes...',
  },
  contact: {
    phone: '(11) 4000-0000',
    whatsapp: '5511940000000',
    instagram: 'suabarbearia',
    email: 'contato@suabarbearia.app',
  },
  address: {
    street: 'Av. Paulista, 1000',
    complement: 'Conj. 101',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zip: '01310-100',
    lat: -23.5654,
    lng: -46.6516,
  },
  parking: undefined,
  club: { ...luxeCuts.club, name: 'Clube Sua Barbearia' },
  features: { pwa: true, googleLogin: true, installBanner: true },
}

import type { AppConfigInput } from '../schema.js'
import { luxeCuts } from '../examples/luxe-cuts.js'

/** Wordmark a partir do nome: "Barbearia do Zé" vira "Barbearia" + "do Zé". */
function wordmarkFrom(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return { first: parts[0], second: 'Barbearia' }
  return { first: parts[0], second: parts.slice(1).join(' ') }
}

/**
 * Config inicial de um tenant recém-criado no admin. Herda catálogo,
 * fidelidade, Clube e textos legais de exemplo para o app já abrir inteiro;
 * o dono troca tudo depois. Equipe começa vazia.
 */
export function createDefaultTenant(input: { slug: string; name: string }): AppConfigInput {
  const { first, second } = wordmarkFrom(input.name)
  return {
    ...luxeCuts,
    id: input.slug,
    name: input.name,
    domains: [],
    brand: {
      logo: { kind: 'wordmark', first, second },
      photos: {},
      theme: {
        dark: { accent: '#e2d3a8', onAccent: '#141312' },
        light: { accent: '#b3955a', onAccent: '#141312' },
      },
    },
    copy: {
      splashHeadline: `Agende seu corte na ${input.name} em segundos.`,
      splashCta: 'Começar',
      homeTitle: 'Bem-vindo, {nome}.',
      homeSubtitle: 'Escolha o barbeiro, veja os horários livres e agende.',
      authClaim: `${input.name}, agora no seu bolso.`,
      searchPlaceholder: 'Buscar barbeiros, cortes...',
    },
    contact: { phone: '', whatsapp: '5500000000000' },
    address: {
      street: '',
      district: '',
      city: '',
      state: 'SP',
      zip: '',
      lat: -23.55,
      lng: -46.63,
    },
    parking: undefined,
    barbers: [],
    club: { ...luxeCuts.club, name: `Clube ${first}` },
  }
}

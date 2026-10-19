import type { Barber } from '../../data/home'
import { getBarbers } from '../../data/home'
import { normalize } from '../../lib/text'

export type Order = 'avaliacao' | 'avaliacoes' | 'nome'

export type Filters = {
  today: boolean
  pro: boolean
  specialties: string[]
  order: Order
}

export const defaultFilters: Filters = { today: false, pro: false, specialties: [], order: 'avaliacao' }

export const orderOptions: { value: Order; label: string }[] = [
  { value: 'avaliacao', label: 'Melhor nota' },
  { value: 'avaliacoes', label: 'Mais avaliados' },
  { value: 'nome', label: 'Nome' },
]

/** Todas as especialidades da equipe, sem repetir. */
export function getAllSpecialties() {
  return Array.from(new Set(getBarbers().flatMap((barber) => barber.specialties))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

export function parseFilters(params: URLSearchParams): Filters {
  const order = params.get('ordem')
  return {
    today: params.get('disponivel') === '1',
    pro: params.get('pro') === '1',
    specialties: (params.get('esp') ?? '').split(',').filter(Boolean),
    order: order === 'avaliacoes' || order === 'nome' ? order : 'avaliacao',
  }
}

/** Query string com os filtros ativos, preservando `servico` quando existir. */
export function filtersToSearch(filters: Filters, base?: URLSearchParams) {
  const params = new URLSearchParams()
  const servico = base?.get('servico')
  if (servico) params.set('servico', servico)
  if (filters.today) params.set('disponivel', '1')
  if (filters.pro) params.set('pro', '1')
  if (filters.specialties.length) params.set('esp', filters.specialties.join(','))
  if (filters.order !== 'avaliacao') params.set('ordem', filters.order)
  const text = params.toString()
  return text ? `?${text}` : ''
}

export function countActive(filters: Filters) {
  return (
    Number(filters.today) + Number(filters.pro) + filters.specialties.length + Number(filters.order !== 'avaliacao')
  )
}

export function applyFilters(list: Barber[], filters: Filters): Barber[] {
  const wanted = filters.specialties.map(normalize)
  const filtered = list.filter((barber) => {
    if (filters.today && !barber.nextAvailable.today) return false
    if (filters.pro && barber.tier !== 'Pro') return false
    if (wanted.length && !barber.specialties.some((item) => wanted.includes(normalize(item)))) return false
    return true
  })
  return [...filtered].sort((a, b) => {
    if (filters.order === 'nome') return a.name.localeCompare(b.name, 'pt-BR')
    if (filters.order === 'avaliacoes') return b.reviews - a.reviews
    return b.rating - a.rating || b.reviews - a.reviews
  })
}
